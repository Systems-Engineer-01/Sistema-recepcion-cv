import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { healthRouter } from './routes/health.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/', healthRouter);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'SIRE-CV API Server - Sprint 0',
    documentation: '/health'
  });
});

app.listen(PORT, () => {
  console.log(`[SIRE-CV Backend] Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`[SIRE-CV Backend] Endpoint de salud: http://localhost:${PORT}/health`);
});
