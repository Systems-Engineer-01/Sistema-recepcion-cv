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
- **Seguridad & Autenticación**: JWT (`jsonwebtoken`) para control de sesiones sin estado y `bcryptjs` (salt rounds 10) para el cifrado unidireccional de contraseñas.
- **Procesamiento de Archivos & Validación PDF**: `multer` (procesamiento en memoria) y `pdf-lib` para inspeccionar metadatos de las páginas PDF y validar dimensiones exactas y **orientación vertical A4 (Portrait)**.
- **Protección**: `cors` y `helmet` para protección de cabeceras HTTP.

### **Base de Datos y Almacenamiento**
- **Base de Datos**: **SQLite 3** (`backend/data/sire_cv.sqlite`).
- **Almacenamiento de Archivos**: Estructura de archivos local cifrada/segura en el servidor (`backend/uploads/postulante_{id}/`).

> **💡 Justificación Técnica / Decisiones de Arquitectura:**
> - **Cumplimiento Normativo (Ley N.º 29733 - Protección de Datos Personales)**: Dado que el expediente contiene datos altamente sensibles (DNI, títulos, certificados de trabajo), se optó por un esquema **On-Premise / Servidor Local Institucional** utilizando SQLite local en lugar de almacenamiento en nube pública.
> - **Inspección en Memoria con `pdf-lib`**: Antes de persistir cualquier archivo en disco, el backend analiza la primera página del PDF en un buffer temporal para verificar que su ancho y alto cumplan la relación de aspecto A4 vertical, previniendo errores de escaneo que descalifican al postulante.

---

## 📂 Estructura del Repositorio

```text
c:\Sistema-recepcion-cv\
├── backend/                  # API REST Express + TypeScript
│   ├── src/
│   │   ├── db/               # Conexión e inicialización de esquemas SQLite
│   │   ├── middleware/       # Middleware de autenticación JWT
│   │   ├── routes/           # Rutas API (/health, /auth, /documentos)
│   │   └── utils/            # Validador de dimensiones y orientación de PDF A4
│   └── uploads/              # Almacenamiento local de expediente por postulante
├── frontend/                 # Aplicación Web Single Page App (React + Vite)
│   ├── src/
│   │   ├── components/       # Componentes Auth (Login/Registro) y Expediente (Slots A-H)
│   │   └── services/         # Cliente HTTP API para comunicación con Backend
│   └── index.html
├── docs/                     # Sustento legal, backlog Scrum, manuales de usuario
└── README.md
```

---

## 🚀 Estado de Desarrollo y Sprints

El proyecto se gestiona mediante metodología **Scrum**:

- [x] **Sprint 0 — Fundación del proyecto**: Configuración inicial de monorepo, entornos de compilación de TypeScript para Backend (Express) y Frontend (React + Vite), endpoint de salud `GET /health` y sistema de diseño base.
- [x] **Sprint 1 — Identidad y carga documental básica**: Modelo de datos de postulantes y documentos en SQLite, autenticación con JWT/Bcrypt, endpoint `POST /documentos/:slot` con validación estricta de PDF vertical A4, y pantalla "Mi expediente" con los 8 slots del checklist (A a H).
- [x] **Sprint 2 — Foliado digital y declaración jurada**: Unificación de expediente en PDF con `pdf-lib`, foliado electrónico en cada hoja (`Folio k de N`), estampa de Código de Verificación Digital (CVD - SHA256) en pie de página y flujo de Declaración Jurada Digital (Art. 49 TUO Ley 27444) con auditoría de IP y timestamp.

- [x] **Sprint 3 — Panel del evaluador y generación de acta**: Roles JWT (`POSTULANTE` y `EVALUADOR`), bandeja de recepción de expedientes, calificación por rubros A-H del perfil Operador Tecnológico, cálculo automático de dictamen `APTO` / `NO APTO` y generación en PDF del **Acta de Evaluación Documental** oficial con `pdf-lib`.

- [ ] **Sprint 4 — Seguridad, almacenamiento institucional y reportería**: Cifrado en reposo, backups automáticos y tablero estadístico de impacto/ahorro de papel.

---

## 💻 Instrucciones para Desarrolladores

### 1. Clonar el repositorio
```bash
git clone https://github.com/Systems-Engineer-01/Sistema-recepcion-cv.git
cd Sistema-recepcion-cv
```

### 2. Levantar el Backend
```bash
cd backend
npm install
npm run dev
```
El servidor backend iniciará en `http://localhost:4000`.

### 3. Levantar el Frontend
En otra ventana de terminal:
```bash
cd frontend
npm install
npm run dev
```
La aplicación web estará disponible en `http://localhost:3000`.

---

## 📄 Licencia y Marco Legal
Desarrollado bajo el marco de Gobierno Digital del Perú y en cumplimiento del TUO de la Ley N.º 27444 (Ley del Procedimiento Administrativo General) y la Ley N.º 29733 (Ley de Protección de Datos Personales).
