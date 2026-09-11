# Backlog de Producto y Plan de Sprints — SIRE-CV

**Product Owner:** (tú) · **Scrum Master / Gestor de Proyecto:** Claude · **Equipo de desarrollo:** Antigravity + Gemini 3 Pro (High)
**Duración de sprint sugerida:** 2–3 días (dado el plazo de entrega de documentos: 27/ago–14/set/2026)
**Regla de cierre de sprint:** ningún sprint se da por cerrado sin `git commit` + `git push` al repositorio y sin actualizar `docs/Manual_de_Usuario.md` con lo que ya es usable.

---

## Visión del producto
Reemplazar el flujo físico (folder manila, firma y foliado manual, entrega presencial) del checklist A–H del comunicado por un flujo digital con el mismo orden documental, la misma trazabilidad (folio/CVD) y validez jurídica equivalente, verificable por el evaluador sin gasto de papel ni traslado del postulante.

## Épicas (Product Backlog)

| # | Épica | Historias clave |
|---|---|---|
| E1 | Identidad y acceso | Registro con DNI, login, recuperación de clave |
| E2 | Carga documental ordenada | Un slot por documento (A–H), validaciones de formato/orientación |
| E3 | Foliado y firma digital equivalente | CVD por documento, orden descendente 1/n…n/n automático |
| E4 | Declaración jurada digital | Checkbox + registro IP/fecha/hora + texto legal (art. 49 TUO 27444) |
| E5 | Panel del evaluador | Ver expediente ordenado, marcar cumple/no cumple, generar acta |
| E6 | Almacenamiento y seguridad | Cifrado, backup, alojamiento en servidor local/institucional |
| E7 | Reportería | Cuadro de postulantes, exportar Excel/PDF, estadística de papel/CO2 ahorrado |

---

## Sprint 0 — Fundación del proyecto *(hoy)*
**Objetivo:** repositorio listo, arquitectura definida, backlog aprobado.

- [x] Crear repositorio en GitHub (`sire-cv`) con estructura `backend/ frontend/ docs/`.
- [x] Redactar sustento legal (`docs/Sustento_Legal_y_Propuesta.docx`).
- [x] Redactar este backlog.
- [x] Definir stack técnico definitivo (Node.js/Express + TypeScript en backend; React/Vite + TypeScript en frontend).
- [x] Andamiaje base de repositorio y estructura inicial creada.


**Prompt para Antigravity/Gemini 3 Pro (High) — Sprint 0:**
```
Actúa como ingeniero de software senior. Crea el andamiaje inicial de un
monorepo llamado sire-cv con carpetas backend/ (Node.js + Express + TypeScript)
y frontend/ (React + Vite + TypeScript). El backend debe exponer un endpoint
de salud GET /health. El frontend debe tener una pantalla de login vacía.
No implementes lógica de negocio todavía. Incluye README de cada carpeta
explicando cómo correr `npm install` y `npm run dev`. Al terminar, deja el
proyecto listo para `git add . && git commit -m "sprint0: fundación del
proyecto"`.
```

---

## Sprint 1 — Identidad y carga documental básica (E1 + E2)
**Objetivo:** un postulante puede registrarse, iniciar sesión y subir cada uno de los 8 documentos del checklist (A–H) en su propio slot.

- [x] Registro y Login de postulante por DNI con JWT y bcrypt (Backend + Frontend).
- [x] Gestión de los 8 slots documentales (A a H) con verificación de PDF vertical A4 (`pdf-lib`) y peso <= 10MB.
- [x] Persistencia SQLite local en servidor institucional sin nube pública.



**Prompt para Antigravity/Gemini 3 Pro (High) — Sprint 1:**
```
Sobre el repo sire-cv del sprint anterior, implementa:
1. Backend: modelo Postulante (dni, nombres, apellidos, email, password_hash),
   endpoints POST /auth/registro, POST /auth/login (JWT), y modelo Documento
   con campos: postulante_id, slot (enum: FICHA_INSCRIPCION, DECLARACION_JURADA,
   DNI, HOJA_VIDA, GRADO_TITULO, CONSTANCIA_TRABAJO, FICHA_SUNEDU, OTROS),
   archivo_url, creado_en. Endpoint POST /documentos/:slot que reciba un PDF,
   valide que sea PDF, tamaño <= 10MB, y que la primera página esté en
   orientación vertical A4 (usar pdf-lib para leer dimensiones).
2. Frontend: pantalla de login/registro y una pantalla "Mi expediente" con
   los 8 slots listados en el orden A-H, cada uno con botón de subir/reemplazar
   y un estado (pendiente/cargado).
Al terminar: git commit -m "sprint1: identidad y carga documental por slot"
y push a la rama main.
```

---

- [x] Job de consolidación de PDF con `pdf-lib` y foliado automático en formato `Folio k/N` (numeral 6.3).
- [x] Estampa de Código de Verificación Digital (CVD) SHA-256 + timestamp en pie de página de cada hoja.
- [x] Flujo de Declaración Jurada Digital (Art. 49 TUO Ley 27444) con registro auditado de IP, fecha/hora y hash en SQLite.



**Prompt (resumen para Antigravity):**
```
Añade al backend un job que, cuando el postulante marca su expediente como
"completo", genere un PDF consolidado ordenando los documentos como
Ficha de Inscripción (posición 1 desde adelante) ... Ficha SUNEDU (posición 1
desde atrás), asigne folio "k/n" a cada documento y estampe un Código de
Verificación Digital (hash SHA-256 + timestamp) en el pie de página de cada
uno, replicando el numeral 6.3 del comunicado pero de forma automática.
Agrega el flujo de Declaración Jurada: checkbox obligatorio con el texto del
art. 49 del TUO de la Ley 27444, que registre IP, fecha/hora y hash del
expediente al momento de la firma. git commit -m "sprint2: foliado digital y
declaración jurada" y push.
```

---

## Sprint 3 — Panel del evaluador (E5)
**Objetivo:** quien recepciona ve el expediente ya ordenado y foliado, marca cumple/no cumple por rubro contra el perfil de Operador Tecnológico, y el sistema genera el acta.

---

## Sprint 4 — Seguridad, almacenamiento institucional y reportería (E6 + E7)
**Objetivo:** despliegue en servidor local/institucional (no nube pública), cifrado en reposo, backups, y tablero con ahorro estimado de papel/traslados para el argumento ante el INEI.

---

## Definición de "Terminado" (Definition of Done) por sprint
1. Código con `npm test` en verde (si aplica).
2. Commit descriptivo + push al repositorio.
3. `docs/Manual_de_Usuario.md` actualizado con lo nuevo que el usuario ya puede hacer.
4. Captura o demo funcional adjunta al PR/commit.
