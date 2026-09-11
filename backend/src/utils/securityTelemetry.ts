import { Request } from 'express';

export interface TelemetryInfo {
  ip: string;
  sistemaOperativo: string;
  navegador: string;
  dispositivo: string;
  ubicacionAproximada: string;
}

/**
 * Extrae metadatos de telemetría de seguridad alineados con la norma NTP-ISO/IEC 27001:2022
 */
export function extractTelemetry(req: Request): TelemetryInfo {
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const ip = Array.isArray(rawIp) ? rawIp[0] : String(rawIp);

  const userAgent = req.headers['user-agent'] || '';

  // 1. Detección de Sistema Operativo
  let sistemaOperativo = 'Desconocido';
  if (/windows nt 10\.0/i.test(userAgent)) sistemaOperativo = 'Windows 10 / 11';
  else if (/windows nt 6\.3/i.test(userAgent)) sistemaOperativo = 'Windows 8.1';
  else if (/windows nt 6\.1/i.test(userAgent)) sistemaOperativo = 'Windows 7';
  else if (/mac os x/i.test(userAgent)) sistemaOperativo = 'macOS';
  else if (/android/i.test(userAgent)) sistemaOperativo = 'Android';
  else if (/iphone|ipad|ipod/i.test(userAgent)) sistemaOperativo = 'iOS';
  else if (/linux/i.test(userAgent)) sistemaOperativo = 'Linux';

  // 2. Detección de Navegador
  let navegador = 'Desconocido';
  if (/edg/i.test(userAgent)) navegador = 'Microsoft Edge';
  else if (/chrome|crios/i.test(userAgent)) navegador = 'Google Chrome';
  else if (/firefox|fxios/i.test(userAgent)) navegador = 'Mozilla Firefox';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) navegador = 'Apple Safari';
  else if (/opr\//i.test(userAgent)) navegador = 'Opera';

  // 3. Detección de Dispositivo
  let dispositivo = 'Escritorio (PC/Laptop)';
  if (/mobile/i.test(userAgent)) dispositivo = 'Móvil (Smartphone)';
  else if (/tablet|ipad/i.test(userAgent)) dispositivo = 'Tablet';

  // 4. Ubicación Geográfica Estimada por IP
  let ubicacionAproximada = 'Lima, Perú (Red Institucional)';
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    ubicacionAproximada = 'Servidor Local Institucional / Loopback';
  } else {
    // Si viene cabecera de país por proxy o CDN
    const cfCountry = req.headers['cf-ipcountry'];
    if (cfCountry) {
      ubicacionAproximada = `${cfCountry} (Vía Proxy CDN)`;
    } else {
      ubicacionAproximada = 'Perú (IP Pública Detectada)';
    }
  }

  return {
    ip,
    sistemaOperativo,
    navegador,
    dispositivo,
    ubicacionAproximada,
  };
}
