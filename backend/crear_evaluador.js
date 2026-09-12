import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configura los datos del nuevo evaluador aquí:
const nuevoEvaluador = {
  dni: '88888888', // DNI del nuevo evaluador
  nombres: 'Ana Lucía', // Nombres
  apellidos: 'García Pérez', // Apellidos
  email: 'ana.garcia@sirecv.gob.pe', // Correo
  password_plain: 'secreto123', // Contraseña (se encriptará automáticamente)
};

const dbPath = path.resolve(__dirname, './data/sire_cv.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
    process.exit(1);
  }
});

async function crearEvaluador() {
  try {
    // 1. Verificar si el evaluador ya existe
    db.get('SELECT id FROM postulantes WHERE dni = ?', [nuevoEvaluador.dni], async (err, row) => {
      if (err) {
        console.error('Error al consultar la base de datos:', err);
        process.exit(1);
      }
      
      if (row) {
        console.log(`El evaluador con DNI ${nuevoEvaluador.dni} ya existe en la base de datos.`);
        process.exit(0);
      }

      // 2. Encriptar la contraseña usando bcrypt
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(nuevoEvaluador.password_plain, salt);

      // 3. Insertar el evaluador con el rol 'EVALUADOR'
      const query = `
        INSERT INTO postulantes (dni, nombres, apellidos, email, password_hash, rol)
        VALUES (?, ?, ?, ?, ?, 'EVALUADOR')
      `;

      db.run(
        query,
        [
          nuevoEvaluador.dni,
          nuevoEvaluador.nombres,
          nuevoEvaluador.apellidos,
          nuevoEvaluador.email,
          passwordHash
        ],
        function (err) {
          if (err) {
            console.error('Error al crear el evaluador:', err.message);
          } else {
            console.log('\n✅ ¡Evaluador creado exitosamente!');
            console.log('-----------------------------------');
            console.log(`DNI: ${nuevoEvaluador.dni}`);
            console.log(`Nombre: ${nuevoEvaluador.nombres} ${nuevoEvaluador.apellidos}`);
            console.log(`Rol: EVALUADOR`);
            console.log(`Contraseña: ${nuevoEvaluador.password_plain}`);
          }
          process.exit(0);
        }
      );
    });
  } catch (error) {
    console.error('Error inesperado:', error);
    process.exit(1);
  }
}

crearEvaluador();
