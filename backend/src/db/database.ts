import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

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
      // Tabla Postulantes
      db.run(`
        CREATE TABLE IF NOT EXISTS postulantes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          dni TEXT UNIQUE NOT NULL,
          nombres TEXT NOT NULL,
          apellidos TEXT NOT NULL,
          email TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) return reject(err);
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
        resolve();
      });
    });
  });
};
