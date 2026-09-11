import rateLimit from 'express-rate-limit';

// Rate limiter para endpoints de autenticación (/auth/login, /auth/registro)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15, // Máximo 15 peticiones por IP por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos de autenticación desde esta dirección IP. Por favor intente nuevamente en 15 minutos.',
  },
});

// Rate limiter para endpoints de subida de archivos (/documentos/:slot)
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // Máximo 30 subidas por IP por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes de carga de archivos. Por favor intente nuevamente en unos minutos.',
  },
});

// Rate limiter global defensivo para prevenir ataques DSI/DDoS
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Límite de solicitudes al servidor excedido. Por favor espere un momento.',
  },
});
