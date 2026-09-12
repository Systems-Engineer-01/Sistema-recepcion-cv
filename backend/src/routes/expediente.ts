import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { VALID_SLOTS, getStorageDir } from './documentos.js';
import { consolidateAndFolioExpediente, DocumentToConsolidate } from '../utils/pdfConsolidator.js';
import { encryptBuffer, decryptBuffer } from '../utils/encryption.js';
import { logAudit } from '../utils/auditLogger.js';

export const expedienteRouter = Router();

// GET /expediente - Consultar el estado del expediente consolidado y la declaración jurada
expedienteRouter.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const postulanteId = req.user?.id;

  db.get(
    'SELECT * FROM expedientes WHERE postulante_id = ?',
    [postulanteId],
    (err, row: any) => {
      if (err) {
        res.status(500).json({ error: 'Error al consultar estado del expediente.' });
        return;
      }

      if (!row) {
        res.status(200).json({
          expediente: {
            estado: 'EN_PROCESO',
            declaracion_aceptada: 0,
          },
        });
        return;
      }

      db.get(
        'SELECT id, resultado_final, observacion_general, evaluado_en FROM evaluaciones WHERE expediente_id = ? ORDER BY evaluado_en DESC LIMIT 1',
        [row.id],
        (errEval, evRow: any) => {
          if (!evRow) {
            res.status(200).json({
              expediente: {
                ...row,
                resultado_final: null,
                observacion_general: null,
                evaluado_en: null,
                detalles: []
              },
            });
            return;
          }

          db.all(
            'SELECT ed.rubro_id, ed.cumple, ed.observacion, r.criterio, r.slot_requerido FROM evaluacion_detalles ed JOIN rubros r ON ed.rubro_id = r.id WHERE ed.evaluacion_id = ?',
            [evRow.id],
            (errDet, detRows: any[]) => {
              res.status(200).json({
                expediente: {
                  ...row,
                  resultado_final: evRow.resultado_final,
                  observacion_general: evRow.observacion_general,
                  evaluado_en: evRow.evaluado_en,
                  detalles: detRows || []
                },
              });
            }
          );
        }
      );
    }
  );
});

// POST /expediente/finalizar - Consolidar expediente, foliar automáticamente, generar CVD y firmar declaración jurada
expedienteRouter.post('/finalizar', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postulanteId = req.user?.id;
    const { declaracionAceptada } = req.body;

    if (!declaracionAceptada) {
      res.status(400).json({
        error: 'Debe marcar y aceptar la Declaración Jurada Digital conforme al Art. 49 del TUO de la Ley N.º 27444.',
      });
      return;
    }

    // 1. Obtener todos los documentos cargados por el postulante
    db.all(
      'SELECT slot, archivo_url, nombre_original FROM documentos WHERE postulante_id = ?',
      [postulanteId],
      async (err, rows: any[]) => {
        if (err) {
          res.status(500).json({ error: 'Error al consultar documentos del postulante.' });
          return;
        }

        if (!rows || rows.length === 0) {
          res.status(400).json({
            error: 'No se han encontrado documentos cargados. Debe subir los documentos del checklist antes de finalizar.',
          });
          return;
        }

        // Ordenar documentos según el orden estricto A -> H
        const docMap: Record<string, any> = {};
        rows.forEach((r) => {
          docMap[r.slot] = r;
        });

        const docsToConsolidate: DocumentToConsolidate[] = [];
        const storageBase = getStorageDir();

        for (const slotKey of VALID_SLOTS) {
          if (docMap[slotKey]) {
            const docRecord = docMap[slotKey];
            const relativePath = docRecord.archivo_url;
            
            // Resolver ruta en storage
            const filename = path.basename(relativePath);
            const userSubdir = `postulante_${postulanteId}`;
            const fullPath = path.join(storageBase, userSubdir, filename);

            if (fs.existsSync(fullPath)) {
              const encryptedFileBuffer = fs.readFileSync(fullPath);
              // Descifrar buffer para el consolidador pdf-lib
              const plainBuffer = decryptBuffer(encryptedFileBuffer);
              docsToConsolidate.push({
                slot: slotKey,
                buffer: plainBuffer,
                nombreOriginal: docRecord.nombre_original,
              });
            }
          }
        }

        if (docsToConsolidate.length === 0) {
          res.status(400).json({ error: 'No se pudieron leer los archivos físicos del expediente en el servidor.' });
          return;
        }

        // 2. Ejecutar Consolidación, Foliado Inverso/Directo y Generación de CVD
        try {
          const result = await consolidateAndFolioExpediente(docsToConsolidate);

          // Guardar el PDF consolidado en el disco local CIFRADO EN REPOSO
          const userDir = path.join(storageBase, `postulante_${postulanteId}`);
          if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
          }

          const consolidatedFilename = `expediente_consolidado_${Date.now()}.pdf`;
          const targetPath = path.join(userDir, consolidatedFilename);

          const encryptedConsolidated = encryptBuffer(result.pdfBuffer);
          fs.writeFileSync(targetPath, encryptedConsolidated);

          const pdfUrl = `/uploads/postulante_${postulanteId}/${consolidatedFilename}`;

          // Captura de Auditoría de la Declaración Jurada Digital y Finalización
          const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
          const clientIp = Array.isArray(rawIp) ? rawIp[0] : String(rawIp);
          const fechaHoraActual = new Date().toISOString();

          logAudit(req, postulanteId, req.user?.dni, 'FINALIZACION_EXPEDIENTE', `Total Páginas: ${result.totalPaginas}, CVD: ${result.hashCvd.slice(0, 16)}...`);

          // Registra en SQLite
          db.run(
            `INSERT INTO expedientes (
              postulante_id, estado, pdf_consolidado_url, hash_cvd, total_paginas,
              declaracion_aceptada, declaracion_ip, declaracion_fecha, finalizado_en
            ) VALUES (?, 'FINALIZADO', ?, ?, ?, 1, ?, ?, ?)
            ON CONFLICT(postulante_id) DO UPDATE SET
              estado = 'FINALIZADO',
              pdf_consolidado_url = excluded.pdf_consolidado_url,
              hash_cvd = excluded.hash_cvd,
              total_paginas = excluded.total_paginas,
              declaracion_aceptada = 1,
              declaracion_ip = excluded.declaracion_ip,
              declaracion_fecha = excluded.declaracion_fecha,
              finalizado_en = excluded.finalizado_en`,
            [
              postulanteId,
              pdfUrl,
              result.hashCvd,
              result.totalPaginas,
              clientIp,
              fechaHoraActual,
              fechaHoraActual,
            ],
            function (dbErr) {
              if (dbErr) {
                console.error('[DB Error] Guardando expediente finalizado:', dbErr);
                res.status(500).json({ error: 'Error al registrar el estado del expediente en la base de datos.' });
                return;
              }

              res.status(200).json({
                message: 'Expediente consolidado, foliado y firmado digitalmente con éxito.',
                expediente: {
                  estado: 'FINALIZADO',
                  pdf_consolidado_url: pdfUrl,
                  hash_cvd: result.hashCvd,
                  short_hash_cvd: result.shortHashCvd,
                  total_paginas: result.totalPaginas,
                  declaracion_aceptada: 1,
                  declaracion_ip: clientIp,
                  declaracion_fecha: fechaHoraActual,
                  finalizado_en: fechaHoraActual,
                },
              });
            }
          );
        } catch (consolidateErr: any) {
          console.error('[Consolidation Error]:', consolidateErr);
          res.status(400).json({ error: `Error al generar el foliado digital: ${consolidateErr.message}` });
        }
      }
    );
  } catch (err: any) {
    res.status(500).json({ error: `Error del servidor: ${err.message}` });
  }
});
