import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initDb } from './db/database.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { documentosRouter } from './routes/documentos.js';
import { expedienteRouter } from './routes/expediente.js';
import { evaluadorRouter } from './routes/evaluador.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json());

// Servir la carpeta de uploads de manera estática
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Rutas API
app.use('/', healthRouter);
app.use('/auth', authRouter);
app.use('/documentos', documentosRouter);
app.use('/expediente', expedienteRouter);
app.use('/evaluador', evaluadorRouter);

// Ruta raíz
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'SIRE-CV API Server - Sprint 3 (Panel Evaluador y Acta)',
    health: '/health',
    auth: '/auth',
    documentos: '/documentos',
    expediente: '/expediente',
    evaluador: '/evaluador',
  });
});

// Inicializar BD e Iniciar servidor
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[SIRE-CV Backend] Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(`[SIRE-CV Backend] Base de datos SQLite lista con semilleros.`);
    });
  })
  .catch((err) => {
    console.error('[DB Error] No se pudo inicializar la base de datos:', err);
    process.exit(1);
  });
