import { Request } from 'express';
import { db } from '../db/database.js';

/**
 * Registra un evento de auditoría en la tabla `log_auditoria` (Ley 29733)
 */
export function logAudit(
  req: Request,
  usuarioId: number | null | undefined,
  dni: string | null | undefined,
  accion: string,
  detalles: string = ''
): void {
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const ip = Array.isArray(rawIp) ? rawIp[0] : String(rawIp);

  db.run(
    `INSERT INTO log_auditoria (usuario_id, dni, ip, accion, detalles)
     VALUES (?, ?, ?, ?, ?)`,
    [usuarioId || null, dni || null, ip, accion, detalles],
    (err) => {
      if (err) {
        console.error('[Audit Error] No se pudo guardar el registro de auditoría:', err.message);
      }
    }
  );
}
