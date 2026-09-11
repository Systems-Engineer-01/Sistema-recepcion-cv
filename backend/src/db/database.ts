import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'sire_cv.sqlite');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[DB Error] No se pudo conectar a la base de datos SQLite:', err.message);
  } else {
    console.log('[DB] Conectado exitosamente a SQLite local:', dbPath);
  }
});

export const initDb = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabla Postulantes / Usuarios
      db.run(`
        CREATE TABLE IF NOT EXISTS postulantes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          dni TEXT UNIQUE NOT NULL,
          nombres TEXT NOT NULL,
          apellidos TEXT NOT NULL,
          email TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          rol TEXT NOT NULL DEFAULT 'POSTULANTE',
          creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Asegurar columna rol si la tabla ya existía
      db.run(`ALTER TABLE postulantes ADD COLUMN rol TEXT NOT NULL DEFAULT 'POSTULANTE'`, () => {
        // Ignorar error si ya existe
      });

      // Tabla Documentos
      db.run(`
        CREATE TABLE IF NOT EXISTS documentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          postulante_id INTEGER NOT NULL,
          slot TEXT NOT NULL,
          archivo_url TEXT NOT NULL,
          nombre_original TEXT NOT NULL,
          tamano_bytes INTEGER NOT NULL,
          creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(postulante_id, slot),
          FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Tabla Expedientes
      db.run(`
        CREATE TABLE IF NOT EXISTS expedientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          postulante_id INTEGER UNIQUE NOT NULL,
          estado TEXT NOT NULL DEFAULT 'EN_PROCESO',
          pdf_consolidado_url TEXT,
          hash_cvd TEXT,
          total_paginas INTEGER DEFAULT 0,
          declaracion_aceptada INTEGER DEFAULT 0,
          declaracion_ip TEXT,
          declaracion_fecha DATETIME,
          finalizado_en DATETIME,
          FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Tabla Rubros de Evaluación
      db.run(`
        CREATE TABLE IF NOT EXISTS rubros (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo TEXT UNIQUE NOT NULL,
          nombre TEXT NOT NULL,
          descripcion TEXT NOT NULL,
          slot_relacionado TEXT NOT NULL,
          es_obligatorio INTEGER DEFAULT 1
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Tabla Evaluaciones
      db.run(`
        CREATE TABLE IF NOT EXISTS evaluaciones (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          expediente_id INTEGER UNIQUE NOT NULL,
          evaluador_id INTEGER NOT NULL,
          resultado_final TEXT NOT NULL,
          observacion_general TEXT,
          evaluado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE CASCADE,
          FOREIGN KEY (evaluador_id) REFERENCES postulantes(id)
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Tabla Detalles de Evaluación por Rubro
      db.run(`
        CREATE TABLE IF NOT EXISTS evaluacion_detalles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          evaluacion_id INTEGER NOT NULL,
          rubro_id INTEGER NOT NULL,
          cumple INTEGER NOT NULL,
          observacion TEXT,
          FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id) ON DELETE CASCADE,
          FOREIGN KEY (rubro_id) REFERENCES rubros(id)
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Semilla: Usuario Evaluador por defecto
      const defaultEvaluadorDni = '99999999';
      db.get('SELECT id FROM postulantes WHERE dni = ?', [defaultEvaluadorDni], async (err, row) => {
        if (!row) {
          const passHash = await bcrypt.hash('evaluador2026', 10);
          db.run(
            `INSERT INTO postulantes (dni, nombres, apellidos, email, password_hash, rol)
             VALUES (?, ?, ?, ?, ?, 'EVALUADOR')`,
            [defaultEvaluadorDni, 'Evaluador Institucional', 'Comité Magisterial', 'evaluador@sirecv.gob.pe', passHash]
          );
        }
      });

      // Semilla: 8 Rubros del perfil Operador Tecnológico
      const rubrosSeed = [
        { codigo: 'R1', nombre: 'A. Ficha de Inscripción', descripcion: 'Ficha de Inscripción debidamente completada.', slot: 'FICHA_INSCRIPCION', obligatorio: 1 },
        { codigo: 'R2', nombre: 'B. Declaración Jurada', descripcion: 'Declaración jurada según art. 49 TUO Ley 27444.', slot: 'DECLARACION_JURADA', obligatorio: 1 },
        { codigo: 'R3', nombre: 'C. Documento de Identidad', descripcion: 'DNI vigente y legible por ambas caras.', slot: 'DNI', obligatorio: 1 },
        { codigo: 'R4', nombre: 'D. Hoja de Vida', descripcion: 'CV documentado sustentatorio en orden cronológico.', slot: 'HOJA_VIDA', obligatorio: 1 },
        { codigo: 'R5', nombre: 'E. Grado Académico / Título', descripcion: 'Título profesional o grado conforme al perfil de Operador Tecnológico.', slot: 'GRADO_TITULO', obligatorio: 1 },
        { codigo: 'R6', nombre: 'F. Experiencia Laboral', descripcion: 'Constancias/certificados de trabajo acreditando experiencia.', slot: 'CONSTANCIA_TRABAJO', obligatorio: 1 },
        { codigo: 'R7', nombre: 'G. Ficha SUNEDU / Registro', descripcion: 'Constancia de inscripción en registro profesional (si aplica).', slot: 'FICHA_SUNEDU', obligatorio: 0 },
        { codigo: 'R8', nombre: 'H. Otros Documentos', descripcion: 'Documentación adicional exigida en las bases del concurso.', slot: 'OTROS', obligatorio: 0 },
      ];

      rubrosSeed.forEach((r) => {
        db.run(
          `INSERT INTO rubros (codigo, nombre, descripcion, slot_relacionado, es_obligatorio)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(codigo) DO UPDATE SET
             nombre = excluded.nombre,
             descripcion = excluded.descripcion,
             slot_relacionado = excluded.slot_relacionado,
             es_obligatorio = excluded.es_obligatorio`,
          [r.codigo, r.nombre, r.descripcion, r.slot, r.obligatorio]
        );
      });

      resolve();
    });
  });
};
