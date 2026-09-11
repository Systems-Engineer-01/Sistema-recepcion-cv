import { Request } from 'express';
import { db } from '../db/database.js';
import { extractTelemetry } from './securityTelemetry.js';

/**
 * Registra un evento de auditoría en la tabla `log_auditoria` con telemetría extendida (NTP-ISO/IEC 27001:2022 y Ley 29733)
 */
export function logAudit(
  req: Request,
  usuarioId: number | null | undefined,
  dni: string | null | undefined,
  accion: string,
  detalles: string = ''
): void {
  const telemetry = extractTelemetry(req);

  db.run(
    `INSERT INTO log_auditoria (
      usuario_id, dni, ip, accion, detalles,
      sistema_operativo, navegador, dispositivo, ubicacion_aproximada
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      usuarioId || null,
      dni || null,
      telemetry.ip,
      accion,
      detalles,
      telemetry.sistemaOperativo,
      telemetry.navegador,
      telemetry.dispositivo,
      telemetry.ubicacionAproximada,
    ],
    (err) => {
      if (err) {
        console.error('[Audit Error] No se pudo guardar el registro de auditoría:', err.message);
      }
    }
  );
}
