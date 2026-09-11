import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'sire-cv-backend',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});
