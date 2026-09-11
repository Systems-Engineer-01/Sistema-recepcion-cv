# Manual de Usuario — SIRE-CV
*(Documento vivo: se actualiza al cierre de cada sprint. Versión actual: **Sprint 1 — Identidad y Carga Documental**)*

## 1. ¿Qué es SIRE-CV?
Sistema para presentar tu Currículum Vitae documentado de forma digital, respetando el mismo orden y checklist (A–H) del comunicado oficial, sin necesidad de folder manila, firma física ni traslado presencial.

## 2. Requisitos previos
- DNI vigente (8 dígitos).
- Cada documento en formato **PDF**, tamaño **A4**, orientación **vertical (Portrait)** y peso máximo de **10 MB**.
- Correo electrónico activo.

## 3. Registro e inicio de sesión
1. **Registro**:
   - Ingrese al portal web `http://localhost:3000`.
   - Seleccione la pestaña **Registrarse**.
   - Ingrese su DNI de 8 dígitos, nombres, apellidos, correo electrónico y una contraseña segura.
   - Presione el botón **Crear Cuenta e Ingresar**.

2. **Inicio de Sesión**:
   - Ingrese su número de DNI y su contraseña en la pestaña **Iniciar Sesión**.
   - Al autenticarse correctamente, el sistema cargará su panel personal **"Mi Expediente"**.

## 4. Cómo subir tu expediente (checklist A–H)
Al ingresar a **Mi Expediente**, visualizará los 8 slots documentales del checklist obligatorio:

| Slot | Código | Documento | Descripción / Requisito |
|---|---|---|---|
| A | `FICHA_INSCRIPCION` | Ficha de Inscripción | Formulario oficial de inscripción del postulante. |
| B | `DECLARACION_JURADA` | Declaración Jurada | Declaración jurada según art. 49 TUO Ley 27444. |
| C | `DNI` | Documento Nacional de Identidad | Copia legible del DNI vigente por ambas caras. |
| D | `HOJA_VIDA` | Hoja de Vida / CV | Curriculum Vitae documentado en orden cronológico. |
| E | `GRADO_TITULO` | Grado Académico / Título | Título profesional o grado universitario/técnico. |
| F | `CONSTANCIA_TRABAJO` | Constancias de Trabajo | Certificados o constancias de desempeño profesional. |
| G | `FICHA_SUNEDU` | Ficha SUNEDU / Registro | Constancia de inscripción en SUNEDU o Colegio Profesional. |
| H | `OTROS` | Otros Documentos | Documentación complementaria sustentatoria. |

### Pasos para subir un documento:
1. Ubique el slot correspondiente (ej. *C. Documento Nacional de Identidad*).
2. Presione el botón **Subir Documento (PDF A4)**.
3. Seleccione el archivo PDF de su equipo.
4. El sistema verificará automáticamente:
   - Que sea un archivo PDF válido.
   - Que no supere los 10MB.
   - **Que la primera página esté orientada en formato vertical A4**.
5. Si el archivo es válido, se marcará el estado como **CARGADO** (color verde) y se mostrará el nombre del archivo, fecha y enlace para previsualizar.
6. Si el archivo no cumple los requisitos (por ejemplo, si escaneó una hoja en horizontal), el sistema mostrará un mensaje de rechazo explicativo para que corrija la orientación antes de subirlo.

## 5. Firma y foliado digital (Código de Verificación Digital)
*(Se documentará al cierre del Sprint 2.)*

## 6. Declaración jurada digital
*(Se documentará al cierre del Sprint 2.)*

## 7. Para el personal que recepciona (panel del evaluador)
*(Se documentará al cierre del Sprint 3.)*

## 8. Preguntas frecuentes
- **¿Qué ocurre si subo un archivo en orientación horizontal (Landscape)?**
  *El sistema rechazará automáticamente la carga indicándole que el reglamento del concurso exige el formato A4 vertical. Deberá rotar la página a vertical y volver a intentar.*
- **¿Puedo reemplazar un documento ya cargado?**
  *Sí, en cualquier momento puede hacer clic en "Reemplazar Documento PDF" dentro del slot deseado para actualizar el archivo.*
