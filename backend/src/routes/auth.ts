import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sire_cv_secret_key_2026_magisterial';

// POST /auth/registro
authRouter.post('/registro', async (req: Request, res: Response): Promise<void> => {
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

// POST /auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
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
        res.status(401).json({ error: 'Credenciales inválidas. Verifique su DNI y contraseña.' });
        return;
      }

      const match = await bcrypt.compare(password, row.password_hash);
      if (!match) {
        res.status(401).json({ error: 'Credenciales inválidas. Verifique su DNI y contraseña.' });
        return;
      }

      const userPayload = {
        id: row.id,
        dni: row.dni,
        nombres: row.nombres,
        apellidos: row.apellidos,
        email: row.email,
        rol: row.rol || 'POSTULANTE',
      };

      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });

      res.status(200).json({
        token,
        user: userPayload,
      });
    });
  } catch (err: any) {
    res.status(500).json({ error: `Error del servidor: ${err.message}` });
  }
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
