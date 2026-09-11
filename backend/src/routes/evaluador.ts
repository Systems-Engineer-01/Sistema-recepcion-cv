import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authMiddleware, requireEvaluador, AuthRequest } from '../middleware/auth.js';
import { generateActaEvaluacionPdf, EvaluacionData, EvaluacionDetalleItem } from '../utils/actaGenerator.js';

export const evaluadorRouter = Router();

// GET /evaluador/expedientes - Lista de expedientes finalizados para revisión del evaluador
evaluadorRouter.get('/expedientes', authMiddleware, requireEvaluador, (req: AuthRequest, res: Response): void => {
  const query = `
    SELECT 
      e.id AS expediente_id,
      e.postulante_id,
      p.dni AS postulante_dni,
      p.nombres AS postulante_nombres,
      p.apellidos AS postulante_apellidos,
      p.email AS postulante_email,
      e.estado AS expediente_estado,
      e.pdf_consolidado_url,
      e.hash_cvd,
      e.total_paginas,
      e.finalizado_en,
      ev.id AS evaluacion_id,
      ev.resultado_final,
      ev.evaluado_en
    FROM expedientes e
    JOIN postulantes p ON e.postulante_id = p.id
    LEFT JOIN evaluaciones ev ON ev.expediente_id = e.id
    WHERE e.estado = 'FINALIZADO'
    ORDER BY e.finalizado_en DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('[DB Error] Consultando expedientes para evaluador:', err);
      res.status(500).json({ error: 'Error al consultar lista de expedientes finalizados.' });
      return;
    }

    res.status(200).json({ expedientes: rows || [] });
  });
});

// GET /evaluador/expedientes/:id - Detalle completo de un expediente para evaluar
evaluadorRouter.get('/expedientes/:id', authMiddleware, requireEvaluador, (req: AuthRequest, res: Response): void => {
  const expedienteId = req.params.id;

  const queryExpediente = `
    SELECT 
      e.id AS expediente_id,
      e.postulante_id,
      p.dni AS postulante_dni,
      p.nombres AS postulante_nombres,
      p.apellidos AS postulante_apellidos,
      p.email AS postulante_email,
      e.estado,
      e.pdf_consolidado_url,
      e.hash_cvd,
      e.total_paginas,
      e.declaracion_ip,
      e.declaracion_fecha,
      e.finalizado_en
    FROM expedientes e
    JOIN postulantes p ON e.postulante_id = p.id
    WHERE e.id = ?
  `;

  db.get(queryExpediente, [expedienteId], (err, expedienteRow: any) => {
    if (err || !expedienteRow) {
      res.status(440).json({ error: 'Expediente no encontrado.' });
      return;
    }

    // Consultar documentos del postulante
    db.all(
      'SELECT slot, archivo_url, nombre_original, tamano_bytes, creado_en FROM documentos WHERE postulante_id = ?',
      [expedienteRow.postulante_id],
      (docErr, docRows) => {
        if (docErr) {
          res.status(500).json({ error: 'Error al consultar documentos del expediente.' });
          return;
        }

        // Consultar rubros oficiales
        db.all('SELECT * FROM rubros ORDER BY id ASC', [], (rubrosErr, rubrosRows: any[]) => {
          if (rubrosErr) {
            res.status(500).json({ error: 'Error al consultar rubros de evaluación.' });
            return;
          }

          // Consultar evaluación previa si existe
          const queryEvaluacion = `
            SELECT ev.*, ed.rubro_id, ed.cumple, ed.observacion AS detalle_observacion
            FROM evaluaciones ev
            LEFT JOIN evaluacion_detalles ed ON ed.evaluacion_id = ev.id
            WHERE ev.expediente_id = ?
          `;

          db.all(queryEvaluacion, [expedienteId], (evErr, evRows: any[]) => {
            let evaluacion = null;
            if (evRows && evRows.length > 0) {
              const first = evRows[0];
              evaluacion = {
                id: first.id,
                resultado_final: first.resultado_final,
                observacion_general: first.observacion_general,
                evaluado_en: first.evaluado_en,
                detalles: evRows.map((r) => ({
                  rubro_id: r.rubro_id,
                  cumple: r.cumple,
                  observacion: r.detalle_observacion,
                })),
              };
            }

            res.status(200).json({
              expediente: expedienteRow,
              documentos: docRows || [],
              rubros: rubrosRows || [],
              evaluacion,
            });
          });
        });
      }
    );
  });
});

// POST /evaluador/expedientes/:id/evaluacion - Registrar o actualizar evaluación de expediente
evaluadorRouter.post('/expedientes/:id/evaluacion', authMiddleware, requireEvaluador, (req: AuthRequest, res: Response): void => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const expedienteId = parseInt(rawId, 10);

  const evaluadorId = req.user?.id;
  const { observacionGeneral, detalles } = req.body as {
    observacionGeneral?: string;
    detalles: Array<{ rubro_id: number; cumple: boolean; observacion?: string }>;
  };

  if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
    res.status(400).json({ error: 'Debe enviar los detalles de la evaluación por rubro.' });
    return;
  }

  // Obtener rubros obligatorios para calcular resultado final APTO / NO APTO
  db.all('SELECT id, es_obligatorio FROM rubros', [], (err, rubros: any[]) => {
    if (err) {
      res.status(500).json({ error: 'Error al consultar catálogo de rubros.' });
      return;
    }

    const mandatorySet = new Set(rubros.filter((r) => r.es_obligatorio === 1).map((r) => r.id));

    // Determinar resultado final: NO APTO si algún rubro obligatorio no cumple
    let resultadoFinal: 'APTO' | 'NO_APTO' = 'APTO';

    for (const item of detalles) {
      if (mandatorySet.has(item.rubro_id) && !item.cumple) {
        resultadoFinal = 'NO_APTO';
        break;
      }
    }

    // Registrar o actualizar evaluación
    db.run(
      `INSERT INTO evaluaciones (expediente_id, evaluador_id, resultado_final, observacion_general, evaluado_en)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(expediente_id) DO UPDATE SET
         evaluador_id = excluded.evaluador_id,
         resultado_final = excluded.resultado_final,
         observacion_general = excluded.observacion_general,
         evaluado_en = CURRENT_TIMESTAMP`,
      [expedienteId, evaluadorId, resultadoFinal, observacionGeneral || ''],
      function (evalErr) {
        if (evalErr) {
          console.error('[DB Error] Guardando evaluación:', evalErr);
          res.status(500).json({ error: 'Error al registrar la evaluación.' });
          return;
        }

        // Obtener el ID de la evaluación insertada o actualizada
        db.get('SELECT id FROM evaluaciones WHERE expediente_id = ?', [expedienteId], (getIdErr, row: any) => {
          if (getIdErr || !row) {
            res.status(500).json({ error: 'Error al obtener ID de la evaluación.' });
            return;
          }

          const evaluacionId = row.id;

          // Limpiar y guardar detalles
          db.run('DELETE FROM evaluacion_detalles WHERE evaluacion_id = ?', [evaluacionId], () => {
            const stmt = db.prepare('INSERT INTO evaluacion_detalles (evaluacion_id, rubro_id, cumple, observacion) VALUES (?, ?, ?, ?)');
            detalles.forEach((d) => {
              stmt.run(evaluacionId, d.rubro_id, d.cumple ? 1 : 0, d.observacion || '');
            });
            stmt.finalize(() => {
              res.status(200).json({
                message: `Evaluación registrada correctamente. Resultado Final: ${resultadoFinal}`,
                resultado_final: resultadoFinal,
                evaluacion_id: evaluacionId,
              });
            });
          });
        });
      }
    );
  });
});

// GET /evaluador/expedientes/:id/acta - Generar y descargar el PDF del Acta de Evaluación Documental
evaluadorRouter.get('/expedientes/:id/acta', authMiddleware, (req: AuthRequest, res: Response): void => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const expedienteId = parseInt(rawId, 10);


  // Consulta postulante, expediente, evaluación y postulante evaluador
  const query = `
    SELECT 
      e.id AS expediente_id,
      e.pdf_consolidado_url,
      e.hash_cvd,
      e.total_paginas,
      e.declaracion_ip,
      e.declaracion_fecha,
      e.finalizado_en,
      p.id AS postulante_id,
      p.dni AS postulante_dni,
      p.nombres AS postulante_nombres,
      p.apellidos AS postulante_apellidos,
      p.email AS postulante_email,
      ev.id AS evaluacion_id,
      ev.resultado_final,
      ev.observacion_general,
      ev.evaluado_en,
      evUser.dni AS evaluador_dni,
      evUser.nombres AS evaluador_nombres,
      evUser.apellidos AS evaluador_apellidos
    FROM expedientes e
    JOIN postulantes p ON e.postulante_id = p.id
    JOIN evaluaciones ev ON ev.expediente_id = e.id
    JOIN postulantes evUser ON ev.evaluador_id = evUser.id
    WHERE e.id = ?
  `;

  db.get(query, [expedienteId], (err, row: any) => {
    if (err || !row) {
      res.status(404).json({ error: 'Evaluación o expediente no encontrado. Asegúrese de haber finalizado y evaluado el expediente.' });
      return;
    }

    // Permitir descarga si el usuario es evaluador O si el postulante es dueño del expediente
    if (req.user?.rol !== 'EVALUADOR' && req.user?.id !== row.postulante_id) {
      res.status(403).json({ error: 'No tiene permisos para descargar este acta de evaluación.' });
      return;
    }

    // Consultar detalles de rubros evaluados
    const queryDetalles = `
      SELECT ed.rubro_id, r.codigo, r.nombre, r.slot_relacionado, r.es_obligatorio, ed.cumple, ed.observacion
      FROM evaluacion_detalles ed
      JOIN rubros r ON ed.rubro_id = r.id
      WHERE ed.evaluacion_id = ?
      ORDER BY r.id ASC
    `;

    db.all(queryDetalles, [row.evaluacion_id], async (detErr, detallesRows: any[]) => {
      if (detErr) {
        res.status(500).json({ error: 'Error al consultar detalles del acta.' });
        return;
      }

      try {
        const postulante = {
          id: row.postulante_id,
          dni: row.postulante_dni,
          nombres: row.postulante_nombres,
          apellidos: row.postulante_apellidos,
          email: row.postulante_email,
        };

        const expediente = {
          id: row.expediente_id,
          pdf_consolidado_url: row.pdf_consolidado_url,
          hash_cvd: row.hash_cvd,
          total_paginas: row.total_paginas,
          declaracion_ip: row.declaracion_ip,
          declaracion_fecha: row.declaracion_fecha,
          finalizado_en: row.finalizado_en,
        };

        const evaluacion: EvaluacionData = {
          id: row.evaluacion_id,
          resultado_final: row.resultado_final,
          observacion_general: row.observacion_general,
          evaluado_en: row.evaluado_en,
          evaluador_nombres: row.evaluador_nombres,
          evaluador_apellidos: row.evaluador_apellidos,
          evaluador_dni: row.evaluador_dni,
          detalles: detallesRows || [],
        };

        const pdfBuffer = await generateActaEvaluacionPdf(postulante, expediente, evaluacion);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="acta_evaluacion_${postulante.dni}.pdf"`);
        res.status(200).send(pdfBuffer);
      } catch (pdfErr: any) {
        console.error('[PDF Error] Generando Acta:', pdfErr);
        res.status(500).json({ error: 'Error al generar el documento PDF del acta.' });
      }
    });
  });
});
