import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    dni: string;
    email: string;
    rol: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'sire_cv_secret_key_2026_magisterial';

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Acceso no autorizado. Token no proporcionado.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; dni: string; email: string; rol?: string };
    req.user = {
      id: decoded.id,
      dni: decoded.dni,
      email: decoded.email,
      rol: decoded.rol || 'POSTULANTE',
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido o expirado. Por favor inicie sesión nuevamente.' });
    return;
  }
};

export const requireEvaluador = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.rol !== 'EVALUADOR') {
    res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de Evaluador para esta acción.' });
    return;
  }
  next();
};
