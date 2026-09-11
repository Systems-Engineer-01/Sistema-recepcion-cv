# SIRE-CV — Backend API

Servidor backend desarrollado en **Node.js + Express + TypeScript** para la plataforma de Recepción Electrónica de CV.

---

## 🔒 NOTA DE CUMPLIMIENTO LEGAL (Ley N.º 29733 - Protección de Datos Personales)

> **IMPORTANTE**: En cumplimiento estricto de la **Ley N.º 29733 (Ley de Protección de Datos Personales del Perú)**:
> - **NINGÚN** archivo PDF cargado ni dato del expediente es enviado a servicios de nube pública (AWS S3, Google Cloud Storage, Azure Blob, etc.).
> - Todos los archivos son almacenados exclusivamente en el disco local/institucional (`STORAGE_PATH`), cifrados en reposo con el algoritmo **AES-256-CBC**.
> - Cada acceso, lectura, subida o descarga queda registrado en la tabla `log_auditoria` con la IP, fecha/hora y DNI del usuario.

---

## ⚙️ Variables de Entorno

Puede configurar un archivo `.env` en la raíz de `backend/`:

```env
PORT=4000
JWT_SECRET=sire_cv_secret_key_2026_magisterial
ENCRYPTION_KEY=clave_secreta_aes256_institucional_32bytes
STORAGE_PATH=./uploads
BACKUP_PATH=./backups
```

---

## 📦 Instalación y Ejecución

```bash
cd backend
npm install

# Desarrollo
npm run dev

# Verificación de tipos TypeScript
npm run type-check

# Compilación a Producción
npm run build

# Iniciar Servidor en Producción
npm start

# Ejecutar Copia de Seguridad (Backup)
npm run backup
```

---

## 🔄 Job de Copia de Seguridad Diario (Backup)

### Script CLI
```bash
npm run backup
```
Copia la carpeta de almacenamiento cifrado (`STORAGE_PATH`) y la base de datos SQLite (`data/sire_cv.sqlite`) hacia `BACKUP_PATH/backup_YYYY-MM-DD_timestamp/`.

### Configuración con Cron (Linux / Servidor Institucional)
Para ejecutar automáticamente la copia de seguridad diariamente a las 02:00 AM:

```cron
0 2 * * * cd /ruta/al/proyecto/backend && /usr/bin/npm run backup >> /var/log/sire_cv_backup.log 2>&1
```

---

## 📍 Endpoints del API

### Diagnóstico y Autenticación (Rate Limited: 15 req / 15 min)
- `GET /health`: Estado del servicio.
- `POST /auth/registro`: Registro de postulante con DNI (8 dígitos).
- `POST /auth/login`: Autenticación y emisión de JWT (incluye rol `POSTULANTE` o `EVALUADOR`).
- `GET /auth/me`: Perfil del usuario autenticado.

### Documentos del Postulante (Rate Limited: 30 req / 15 min)
- `GET /documentos`: Lista de documentos subidos.
- `POST /documentos/:slot`: Carga de PDF (validación estricta A4 vertical con `pdf-lib` y cifrado AES-256 al guardar).

### Expedientes y Declaración Jurada Digital
- `GET /expediente`: Estado del expediente y declaración jurada.
- `POST /expediente/finalizar`: Consolidación, foliado electrónico `k/N`, generación de CVD (SHA256) y firma digital (Art. 49 Ley 27444).

### Panel del Evaluador (Rol `EVALUADOR`)
- `GET /evaluador/expedientes`: Bandeja de expedientes finalizados.
- `GET /evaluador/expedientes/:id`: Detalle y documentos A-H para revisión.
- `POST /evaluador/expedientes/:id/evaluacion`: Registro de evaluación y dictamen `APTO` / `NO APTO`.
- `GET /evaluador/expedientes/:id/acta`: Descarga del PDF del Acta Oficial de Evaluación Documental.

### Reportería e Impacto Ambiental (INEI)
- `GET /reportes/postulantes`: Resumen cuantitativo de postulantes, evaluados, aptos y no aptos.
- `GET /reportes/impacto-ambiental`: Estimación paramétrica de hojas A4 ahorradas, traslados evitados, costo en pasajes y kg de CO2.
- `GET /reportes/exportar?formato=xlsx|pdf`: Exportación en Excel o PDF institucional.
