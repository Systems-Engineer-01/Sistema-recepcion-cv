import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import { validatePdfA4Portrait } from '../utils/pdfValidator.js';
import { encryptBuffer } from '../utils/encryption.js';
import { logAudit } from '../utils/auditLogger.js';

export const documentosRouter = Router();

export function getStorageDir(): string {
  const customPath = process.env.STORAGE_PATH;
  if (customPath) {
    return path.isAbsolute(customPath) ? customPath : path.resolve(process.cwd(), customPath);
  }
  return path.resolve(__dirname, '../../uploads');
}

const uploadsBaseDir = getStorageDir();

if (!fs.existsSync(uploadsBaseDir)) {
  fs.mkdirSync(uploadsBaseDir, { recursive: true });
}

// Configuración Multer en memoria para pre-validación de PDF y orientación
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Formato no permitido. Solamente se admiten archivos PDF (.pdf).'));
    }
    cb(null, true);
  },
});

export const VALID_SLOTS = [
  'FICHA_INSCRIPCION',
  'DECLARACION_JURADA',
  'DNI',
  'HOJA_VIDA',
  'GRADO_TITULO',
  'CONSTANCIA_TRABAJO',
  'FICHA_SUNEDU',
  'OTROS',
] as const;

export type DocumentSlot = typeof VALID_SLOTS[number];

// GET /documentos - Obtener todos los documentos cargados por el postulante autenticado
documentosRouter.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const postulanteId = req.user?.id;

  db.all(
    'SELECT id, slot, archivo_url, nombre_original, tamano_bytes, creado_en FROM documentos WHERE postulante_id = ?',
    [postulanteId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Error al consultar documentos del postulante.' });
        return;
      }

      res.status(200).json({ documentos: rows || [] });
    }
  );
});

// POST /documentos/:slot - Subir o reemplazar documento para un slot del checklist A-H
documentosRouter.post(
  '/:slot',
  authMiddleware,
  uploadRateLimiter,
  (req: AuthRequest, res: Response): void => {
    upload.single('archivo')(req, res, async (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({ error: 'El archivo excede el tamaño máximo permitido de 10MB.' });
            return;
          }
        }
        res.status(400).json({ error: err.message || 'Error al procesar el archivo cargado.' });
        return;
      }

      const rawSlot = req.params.slot;
      const slotParam = (typeof rawSlot === 'string' ? rawSlot.toUpperCase() : '') as DocumentSlot;
      const postulanteId = req.user?.id;

      if (!VALID_SLOTS.includes(slotParam)) {
        res.status(400).json({ error: `El slot '${rawSlot}' no es válido. Debe ser uno de los slots del checklist A-H.` });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'Debe adjuntar un archivo en la petición (campo "archivo").' });
        return;
      }

      // Validar dimensiones y orientación del PDF con pdf-lib (sobre el buffer plano en memoria)
      const pdfValidation = await validatePdfA4Portrait(req.file.buffer);

      if (!pdfValidation.isValid) {
        res.status(400).json({
          error: pdfValidation.error || 'El archivo PDF no cumple con los requisitos técnicos de la convocatoria.',
          details: pdfValidation,
        });
        return;
      }

      // Guardar el archivo físicamente en el disco local CIFRADO EN REPOSO (AES-256)
      try {
        const storageBase = getStorageDir();
        const userUploadDir = path.join(storageBase, `postulante_${postulanteId}`);
        if (!fs.existsSync(userUploadDir)) {
          fs.mkdirSync(userUploadDir, { recursive: true });
        }

        const safeFilename = `${slotParam}_${Date.now()}.pdf`;
        const targetPath = path.join(userUploadDir, safeFilename);

        // Cifrar el buffer antes de escribir en disco
        const encryptedData = encryptBuffer(req.file.buffer);
        fs.writeFileSync(targetPath, encryptedData);

        const relativeUrl = `/uploads/postulante_${postulanteId}/${safeFilename}`;
        const nombreOriginal = req.file.originalname;
        const tamanoBytes = req.file.size;

        // Registrar auditoría de subida
        logAudit(req, postulanteId, req.user?.dni, 'SUBIDA_DOCUMENTO', `Slot: ${slotParam}, Archivo: ${nombreOriginal}`);

        // Registrar o actualizar (UPSERT) en la base de datos SQLite
        db.run(
          `INSERT INTO documentos (postulante_id, slot, archivo_url, nombre_original, tamano_bytes)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(postulante_id, slot) DO UPDATE SET
             archivo_url = excluded.archivo_url,
             nombre_original = excluded.nombre_original,
             tamano_bytes = excluded.tamano_bytes,
             creado_en = CURRENT_TIMESTAMP`,
          [postulanteId, slotParam, relativeUrl, nombreOriginal, tamanoBytes],
          function (dbErr) {
            if (dbErr) {
              console.error('[DB Error] Guardando documento:', dbErr);
              res.status(500).json({ error: 'Error al registrar la información del documento en la base de datos.' });
              return;
            }

            res.status(200).json({
              message: `Documento para el slot ${slotParam} subido, cifrado (AES-256) y verificado correctamente.`,
              documento: {
                id: this.lastID,
                slot: slotParam,
                archivo_url: relativeUrl,
                nombre_original: nombreOriginal,
                tamano_bytes: tamanoBytes,
                creado_en: new Date().toISOString(),
                pdfInfo: {
                  pageCount: pdfValidation.pageCount,
                  width: pdfValidation.width,
                  height: pdfValidation.height,
                  isPortrait: pdfValidation.isPortrait,
                },
              },
            });
          }
        );
      } catch (fileErr: any) {
        console.error('[File Error] Guardando archivo:', fileErr);
        res.status(500).json({ error: 'Error al guardar el archivo cifrado en el servidor local.' });
      }
    });
  }
);
