import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { authMiddleware, requireEvaluador, AuthRequest } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { logAudit } from '../utils/auditLogger.js';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sire_cv_secret_key_2026_magisterial';

// POST /auth/registro
authRouter.post('/registro', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { dni, nombres, apellidos, email, password } = req.body;

    if (!dni || !nombres || !apellidos || !email || !password) {
      res.status(400).json({ error: 'Todos los campos son obligatorios (DNI, nombres, apellidos, email, contraseña).' });
      return;
    }

    if (!/^\d{8}$/.test(dni)) {
      res.status(400).json({ error: 'El DNI debe contener exactamente 8 dígitos numéricos.' });
      return;
    }

    // Verificar si el DNI ya existe
    db.get('SELECT id FROM postulantes WHERE dni = ?', [dni], async (err, row) => {
      if (err) {
        res.status(500).json({ error: 'Error al consultar la base de datos.' });
        return;
      }

      if (row) {
        logAudit(req, null, dni, 'REGISTRO_FALLIDO', 'DNI ya registrado previamente');
        res.status(409).json({ error: 'El DNI ingresado ya se encuentra registrado en el sistema.' });
        return;
      }

      const password_hash = await bcrypt.hash(password, 10);
      const rol = 'POSTULANTE';

      db.run(
        `INSERT INTO postulantes (dni, nombres, apellidos, email, password_hash, rol) VALUES (?, ?, ?, ?, ?, ?)`,
        [dni, nombres, apellidos, email, password_hash, rol],
        function (insertErr) {
          if (insertErr) {
            res.status(500).json({ error: 'Error al registrar el postulante.' });
            return;
          }

          const newId = this.lastID;
          const userPayload = { id: newId, dni, nombres, apellidos, email, rol };
          const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });

          logAudit(req, newId, dni, 'REGISTRO', 'Registro exitoso de postulante');

          res.status(201).json({
            message: 'Registro de postulante completado con éxito.',
            token,
            user: userPayload,
          });
        }
      );
    });
  } catch (err: any) {
    res.status(500).json({ error: `Error del servidor: ${err.message}` });
  }
});

// POST /auth/login (Con protección contra Fuerza Bruta - NTP-ISO/IEC 27001:2022 A.8.5)
authRouter.post('/login', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { dni, password } = req.body;

    if (!dni || !password) {
      res.status(400).json({ error: 'Debe ingresar el DNI y la contraseña.' });
      return;
    }

    db.get('SELECT * FROM postulantes WHERE dni = ?', [dni], async (err, row: any) => {
      if (err) {
        res.status(500).json({ error: 'Error al consultar la base de datos.' });
        return;
      }

      if (!row) {
        logAudit(req, null, dni, 'LOGIN_FALLIDO', 'DNI no encontrado');
        res.status(401).json({ error: 'Credenciales inválidas. Verifique su DNI y contraseña.' });
        return;
      }

      // Verificar si la cuenta se encuentra actualmente bloqueada por seguridad
      if (row.bloqueado_hasta) {
        const lockTime = new Date(row.bloqueado_hasta).getTime();
        const nowTime = Date.now();

        if (lockTime > nowTime) {
          const remainingMinutes = Math.ceil((lockTime - nowTime) / (60 * 1000));
          logAudit(req, row.id, dni, 'ACCESO_DENEGADO_BLOQUEADO', `Intento de acceso durante bloqueo. Restante: ${remainingMinutes} min`);
          res.status(429).json({
            error: `Cuenta bloqueada temporalmente por seguridad (NTP-ISO/IEC 27001:2022). Demasiados intentos fallidos. Intente nuevamente en ${remainingMinutes} minuto(s).`,
            bloqueado: true,
            minutosRestantes: remainingMinutes,
          });
          return;
        }
      }

      const match = await bcrypt.compare(password, row.password_hash);
      if (!match) {
        const newAttempts = (row.intentos_fallidos || 0) + 1;

        if (newAttempts >= 5) {
          // Bloquear por 15 minutos
          const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          db.run(
            'UPDATE postulantes SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?',
            [newAttempts, lockUntil, row.id]
          );

          logAudit(req, row.id, dni, 'CUENTA_BLOQUEADA', 'Bloqueo defensivo activado por 15 minutos (5 intentos fallidos)');

          res.status(429).json({
            error: 'Cuenta bloqueada temporalmente por 15 minutos debido a 5 intentos fallidos consecutivos de contraseña (NTP-ISO/IEC 27001:2022).',
            bloqueado: true,
            minutosRestantes: 15,
          });
          return;
        } else {
          db.run(
            'UPDATE postulantes SET intentos_fallidos = ? WHERE id = ?',
            [newAttempts, row.id]
          );

          logAudit(req, row.id, dni, 'LOGIN_FALLIDO', `Contraseña incorrecta (Intento ${newAttempts}/5)`);

          res.status(401).json({
            error: `Credenciales inválidas. Verifique su contraseña. (Intento ${newAttempts} de 5 antes del bloqueo por seguridad).`,
            intentosRestantes: 5 - newAttempts,
          });
          return;
        }
      }

      // Login exitoso: Resetear contador de fallos y remover bloqueo
      db.run('UPDATE postulantes SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?', [row.id]);

      const userPayload = {
        id: row.id,
        dni: row.dni,
        nombres: row.nombres,
        apellidos: row.apellidos,
        email: row.email,
        rol: row.rol || 'POSTULANTE',
      };

      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });

      logAudit(req, row.id, row.dni, 'LOGIN', `Inicio de sesión exitoso (${row.rol})`);

      res.status(200).json({
        token,
        user: userPayload,
      });
    });
  } catch (err: any) {
    res.status(500).json({ error: `Error del servidor: ${err.message}` });
  }
});

// POST /auth/desbloquear - Desbloquear una cuenta bloqueada (Solo Evaluadores/Admins)
authRouter.post('/desbloquear', authMiddleware, requireEvaluador, (req: AuthRequest, res: Response): void => {
  const { dni } = req.body;
  if (!dni) {
    res.status(400).json({ error: 'Debe especificar el DNI del usuario a desbloquear.' });
    return;
  }

  db.run(
    'UPDATE postulantes SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE dni = ?',
    [dni],
    function (err) {
      if (err) {
        res.status(500).json({ error: 'Error al desbloquear la cuenta.' });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: 'No se encontró un usuario con el DNI especificado.' });
        return;
      }

      logAudit(req, req.user?.id, req.user?.dni, 'DESBLOQUEO_MANUAL', `Cuenta DNI ${dni} desbloqueada manualmente`);

      res.status(200).json({ message: `La cuenta con DNI ${dni} ha sido desbloqueada correctamente.` });
    }
  );
});

// GET /auth/me
authRouter.get('/me', authMiddleware, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  db.get(
    'SELECT id, dni, nombres, apellidos, email, rol, creado_en FROM postulantes WHERE id = ?',
    [req.user.id],
    (err, row) => {
      if (err || !row) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      res.json({ user: row });
    }
  );
});
