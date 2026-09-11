import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initDb } from './db/database.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { documentosRouter, getStorageDir } from './routes/documentos.js';
import { expedienteRouter } from './routes/expediente.js';
import { evaluadorRouter } from './routes/evaluador.js';
import { reportesRouter } from './routes/reportes.js';
import { seguridadRouter } from './routes/seguridad.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { decryptBuffer } from './utils/encryption.js';
import { logAudit } from './utils/auditLogger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json());
app.use(globalRateLimiter);

// Servidor estático seguro de uploads con descifrado al vuelo (AES-256 en reposo) y auditoría
const storageDir = getStorageDir();
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

app.get('/uploads/*', (req: Request, res: Response): void => {
  const relativeSubpath = req.params[0];
  const storageBase = getStorageDir();
  const filePath = path.join(storageBase, relativeSubpath);

  if (!fs.existsSync(filePath) || fs.lstatSync(filePath).isDirectory()) {
    res.status(404).json({ error: 'Archivo no encontrado en el almacenamiento local.' });
    return;
  }

  try {
    const rawBuffer = fs.readFileSync(filePath);
    const decryptedBuffer = decryptBuffer(rawBuffer);

    logAudit(req, null, null, 'ACCESO_DOCUMENTO', `Ruta: /uploads/${relativeSubpath}`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.status(200).send(decryptedBuffer);
  } catch (err: any) {
    console.error('[Error Servidor Almacenamiento] Error descifrando archivo:', err);
    res.status(500).json({ error: 'Error al descifrar o servir el documento solicitado.' });
  }
});

// Rutas API
app.use('/', healthRouter);
app.use('/auth', authRouter);
app.use('/documentos', documentosRouter);
app.use('/expediente', expedienteRouter);
app.use('/evaluador', evaluadorRouter);
app.use('/reportes', reportesRouter);
app.use('/seguridad', seguridadRouter);

// Ruta raíz
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'SIRE-CV API Server - Sprint 4 (Seguridad, Almacenamiento Institucional y Reportería)',
    health: '/health',
    auth: '/auth',
    documentos: '/documentos',
    expediente: '/expediente',
    evaluador: '/evaluador',
    reportes: '/reportes',
  });
});

// Inicializar BD e Iniciar servidor
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[SIRE-CV Backend] Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(`[SIRE-CV Backend] Almacenamiento local seguro: ${getStorageDir()} (Cifrado AES-256 en reposo)`);
      console.log(`[SIRE-CV Backend] Cumplimiento de la Ley 29733 (Sin almacenamiento en nubes públicas).`);
    });
  })
  .catch((err) => {
    console.error('[DB Error] No se pudo inicializar la base de datos:', err);
    process.exit(1);
  });
