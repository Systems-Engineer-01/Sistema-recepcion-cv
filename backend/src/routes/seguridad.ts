import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authMiddleware, requireEvaluador, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../utils/auditLogger.js';

export const seguridadRouter = Router();

// GET /seguridad/logs - Obtener logs de auditoría y telemetría SGSI conforme a NTP-ISO/IEC 27001:2022
seguridadRouter.get('/logs', authMiddleware, requireEvaluador, (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '50', 10);
  const offset = (page - 1) * limit;
  const search = (req.query.search as string || '').trim();

  let whereClause = '';
  const params: any[] = [];

  if (search) {
    whereClause = `WHERE dni LIKE ? OR ip LIKE ? OR accion LIKE ? OR detalles LIKE ? OR sistema_operativo LIKE ? OR navegador LIKE ?`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  const queryLogs = `
    SELECT 
      id,
      usuario_id,
      dni,
      ip,
      accion,
      detalles,
      sistema_operativo,
      navegador,
      dispositivo,
      ubicacion_aproximada,
      fecha_hora
    FROM log_auditoria
    ${whereClause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  const queryCount = `SELECT COUNT(*) AS total FROM log_auditoria ${whereClause}`;

  db.get(queryCount, params, (countErr, countRow: any) => {
    if (countErr) {
      res.status(500).json({ error: 'Error al consultar total de logs.' });
      return;
    }

    const totalLogs = countRow?.total || 0;

    db.all(queryLogs, [...params, limit, offset], (err, rows: any[]) => {
      if (err) {
        console.error('[DB Error] Logs de seguridad:', err);
        res.status(500).json({ error: 'Error al consultar logs de seguridad SGSI.' });
        return;
      }

      // Obtener resumen de cuentas bloqueadas activas
      db.all(
        `SELECT id, dni, nombres, apellidos, intentos_fallidos, bloqueado_hasta
         FROM postulantes
         WHERE bloqueado_hasta IS NOT NULL AND bloqueado_hasta > CURRENT_TIMESTAMP`,
        [],
        (lockErr, lockedRows: any[]) => {
          logAudit(req, req.user?.id, req.user?.dni, 'ACCESO_AUDITORIA_SGSI', 'Consulta de logs de telemetría e ISO 27001');

          res.status(200).json({
            logs: rows || [],
            paginacion: {
              total: totalLogs,
              pagina: page,
              limite: limit,
              totalPaginas: Math.ceil(totalLogs / limit),
            },
            cuentasBloqueadas: lockedRows || [],
          });
        }
      );
    });
  });
});
