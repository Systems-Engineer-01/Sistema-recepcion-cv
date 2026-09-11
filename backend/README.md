# SIRE-CV — Backend API

Servidor backend desarrollado en **Node.js + Express + TypeScript** para la plataforma de Recepción Electrónica de CV.

## 🚀 Requisitos Previos

- Node.js >= 18.0.0
- npm >= 9.0.0

## 📦 Instalación

```bash
cd backend
npm install
```

## 🛠️ Modos de Ejecución

### Desarrollo

Inicia el servidor en modo desarrollo con recarga automática (*hot-reload*):

```bash
npm run dev
```

El servidor estará escuchando en `http://localhost:4000`.

### Verificación de Tipos

```bash
npm run type-check
```

### Compilación para Producción

Compila el código TypeScript a JavaScript en la carpeta `dist/`:

```bash
npm run build
```

### Iniciar en Producción

```bash
npm start
```

## 📍 Endpoints disponibles en Sprint 0

- `GET /health`: Endpoint de diagnóstico que retorna el estado del servicio y timestamp actual.
- `GET /`: Mensaje de bienvenida de la API.
