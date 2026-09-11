# SIRE-CV · Sistema Integrado de Recepción Electrónica de Currículum Vitae

Plataforma web de arquitectura modular para digitalizar la recepción, ordenamiento y verificación de expedientes (CV) de postulantes a procesos de selección de personal en el sector público (piloto: **Operador Tecnológico** — Concurso de Ascenso de Escala Magisterial 2026), eliminando la exigencia de presentación física en folder manila.

---

## 🛠️ Arquitectura y Stack Tecnológico

El proyecto está diseñado como un **Monorepo** con separación clara entre la capa de presentación (Frontend SPA) y la capa de servicios de dominio (Backend REST API).

### **Frontend**
- **Core**: React 19 + TypeScript.
- **Tooling & Build**: Vite (servidor de desarrollo HMR ultrarrápido y empaquetado de producción optimizado).
- **Estilos**: Vanilla CSS con variables CSS3, paleta de colores slate/navy, diseño responsivo y efectos *glassmorphic*.
- **Iconografía**: `lucide-react`.

### **Backend**
- **Runtime & Framework**: Node.js + Express + TypeScript.
- **Seguridad & Autenticación**: JWT (`jsonwebtoken`) para control de sesiones sin estado, `bcryptjs` (salt rounds 10) para el cifrado de contraseñas, y **Rate Limiting** (`express-rate-limit`) en endpoints de autenticación y carga de archivos.
- **Cifrado en Reposo (AES-256-CBC)**: Cifrado transparente con `crypto` de Node.js para todos los archivos PDF almacenados en el disco del servidor (`STORAGE_PATH`).
- **Procesamiento de Archivos & Validación PDF**: `multer` (procesamiento en memoria) y `pdf-lib` para inspeccionar metadatos de las páginas PDF, validar dimensiones exactas, **orientación vertical A4 (Portrait)**, consolidación, foliado electrónico y generación de Actas en PDF.
- **Exportación & Reportería**: `exceljs` para generación de hojas de cálculo Excel (`.xlsx`) y `pdf-lib` para reportes institucionales en PDF.
- **Protección**: `cors` y `helmet` para protección de cabeceras HTTP.

### **Base de Datos y Almacenamiento Institucional (Ley N.º 29733)**
- **Base de Datos**: **SQLite 3** (`backend/data/sire_cv.sqlite`).
- **Almacenamiento de Archivos**: Estructura de archivos local cifrada en el servidor local (`STORAGE_PATH`, por defecto `backend/uploads/postulante_{id}/`).
- **Auditoría Estricta**: Tabla `log_auditoria` que registra usuario, IP, fecha/hora y detalle de cada acceso, subida o descarga de documentos.
- **Copia de Seguridad**: Job de backup automático diario (`npm run backup`) que resguarda la carpeta cifrada y la base de datos a `BACKUP_PATH`.

> **🔒 NOTA EXPLÍCITA DE CUMPLIMIENTO LEGAL (Ley N.º 29733 - Protección de Datos Personales):**
> **Ningún archivo PDF cargado ni dato del expediente es enviado a servicios de nube pública (AWS S3, Google Cloud Storage, Azure Blob, etc.).** Todo el almacenamiento y procesamiento se realiza en servidores locales / institucionales bajo estricta soberanía de datos y cifrado en reposo AES-256.

---

## 📂 Estructura del Repositorio

```text
c:\Sistema-recepcion-cv\
├── backend/                  # API REST Express + TypeScript
│   ├── src/
│   │   ├── db/               # Conexión e inicialización de esquemas SQLite + log_auditoria
│   │   ├── middleware/       # Autenticación JWT, roles y Rate Limiting
│   │   ├── routes/           # Rutas API (/health, /auth, /documentos, /expediente, /evaluador, /reportes)
│   │   ├── scripts/          # Script ejecutable de copia de seguridad (backup.ts)
│   │   └── utils/            # Validador A4, consolidador PDF, cifrador AES-256 y auditoría
│   └── uploads/              # Almacenamiento local de expediente cifrado (AES-256 en reposo)
├── frontend/                 # Aplicación Web Single Page App (React + Vite)
│   ├── src/
│   │   ├── components/       # Auth, Expediente (A-H), Evaluador (Bandeja/Detalle) y Reportería (INEI)
│   │   └── services/         # Cliente HTTP API para comunicación con Backend
│   └── index.html
├── docs/                     # Sustento legal, backlog Scrum, manuales de usuario
├── test_sprint4.mjs          # Script de prueba e integración del Sprint 4
└── README.md
```

---

## 🚀 Estado de Desarrollo y Sprints

El proyecto se gestiona mediante metodología **Scrum**:

- [x] **Sprint 0 — Fundación del proyecto**: Configuración inicial de monorepo, entornos de compilación de TypeScript para Backend (Express) y Frontend (React + Vite), endpoint de salud `GET /health` y sistema de diseño base.
- [x] **Sprint 1 — Identidad y carga documental básica**: Modelo de datos de postulantes y documentos en SQLite, autenticación con JWT/Bcrypt, endpoint `POST /documentos/:slot` con validación estricta de PDF vertical A4, y pantalla "Mi expediente" con los 8 slots del checklist (A a H).
- [x] **Sprint 2 — Foliado digital y declaración jurada**: Unificación de expediente en PDF con `pdf-lib`, foliado electrónico en cada hoja (`Folio k de N`), estampa de Código de Verificación Digital (CVD - SHA256) en pie de página y flujo de Declaración Jurada Digital (Art. 49 TUO Ley 27444) con auditoría de IP y timestamp.
- [x] **Sprint 3 — Panel del evaluador y generación de acta**: Roles JWT (`POSTULANTE` y `EVALUADOR`), bandeja de recepción de expedientes, calificación por rubros A-H del perfil Operador Tecnológico, cálculo automático de dictamen `APTO` / `NO APTO` y generación en PDF del **Acta de Evaluación Documental** oficial con `pdf-lib`.
- [x] **Sprint 4 — Seguridad, almacenamiento institucional y reportería (E6 + E7)**: Cifrado en reposo AES-256 en disco local (cumplimiento Ley 29733 sin nube pública), job de backup diario (`npm run backup`), rate limiting en autenticación/uploads, tabla `log_auditoria`, endpoints de reportería cuantitativa y exportación (XLSX/PDF), y tablero de **Ahorro de Papel, Traslados y CO2 para el INEI**.

---

## 💻 Instrucciones para Desarrolladores

### 1. Clonar el repositorio
```bash
git clone https://github.com/Systems-Engineer-01/Sistema-recepcion-cv.git
cd Sistema-recepcion-cv
```

### 2. Variables de Entorno (Opcional en Desarrollo)
En `backend/.env`:
```env
PORT=4000
JWT_SECRET=sire_cv_secret_key_2026_magisterial
ENCRYPTION_KEY=clave_secreta_aes256_institucional_32bytes
STORAGE_PATH=./uploads
BACKUP_PATH=./backups
```

### 3. Levantar el Backend
```bash
cd backend
npm install
npm run dev
```
El servidor backend iniciará en `http://localhost:4000`.

### 4. Levantar el Frontend
En otra ventana de terminal:
```bash
cd frontend
npm install
npm run dev
```
La aplicación web estará disponible en `http://localhost:3000`.

### 5. Ejecutar Copia de Seguridad (Backup)
```bash
cd backend
npm run backup
```

---

## 📄 Licencia y Marco Legal
Desarrollado bajo el marco de Gobierno Digital del Perú y en cumplimiento del TUO de la Ley N.º 27444 (Ley del Procedimiento Administrativo General) y la Ley N.º 29733 (Ley de Protección de Datos Personales).
