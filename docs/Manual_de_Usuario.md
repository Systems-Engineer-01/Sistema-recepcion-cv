# Manual de Usuario — SIRE-CV
*(Documento vivo: se actualiza al cierre de cada sprint. Versión actual: **Sprint 3 — Panel del Evaluador y Generación de Actas**)*

## 1. ¿Qué es SIRE-CV?
Sistema para presentar tu Currículum Vitae documentado de forma digital, respetando el mismo orden y checklist (A–H) del comunicado oficial, sin necesidad de folder manila, firma física ni traslado presencial.

## 2. Requisitos previos
- DNI vigente (8 dígitos).
- Cada documento en formato **PDF**, tamaño **A4**, orientación **vertical (Portrait)** y peso máximo de **10 MB**.
- Correo electrónico activo.

## 3. Registro e inicio de sesión
1. **Registro (Postulante)**:
   - Ingrese al portal web `http://localhost:3000`.
   - Seleccione la pestaña **Registro Postulante**.
   - Ingrese su DNI de 8 dígitos, nombres, apellidos, correo electrónico y una contraseña segura.
   - Presione el botón **Crear Cuenta e Ingresar**.

2. **Inicio de Sesión**:
   - Ingrese su número de DNI y contraseña en la pestaña **Iniciar Sesión**.
   - Para el rol de Evaluador, puede acceder con las credenciales asignadas o presionar en **"Acceso Evaluador (DNI: 99999999)"**.

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

## 5. Firma y foliado digital (Código de Verificación Digital - CVD)
Al haber cargado los documentos requeridos:
1. Diríjase a la sección **"Declaración Jurada Digital y Foliado Electrónico"** al final de la página.
2. Marque la casilla de verificación obligatoria del Art. 49 del TUO de la Ley N.º 27444.
3. Haga clic en el botón **"Finalizar y Foliar Expediente Digital"**.
4. El sistema compilará todos los archivos PDF en el orden legal estricto A $\rightarrow$ H y estampará en el pie de página de cada hoja:
   - **Código de Verificación Digital (CVD)**: Hash criptográfico SHA-256 del documento.
   - **Foliado Digital Equivalente**: Numeración estandarizada `Folio k de N` (donde $N$ es el total de hojas del expediente).
   - **Marca Temporal de Servidor**: Fecha y hora de generación.
5. Al finalizar, el sistema mostrará la tarjeta de **Certificado CVD** con el resumen auditado y habilitará el botón **"Descargar Expediente Consolidado (.pdf)"**.

## 6. Declaración jurada digital
La firma de la Declaración Jurada Digital se ampara en el **Art. 49 del TUO de la Ley N.º 27444 (Ley del Procedimiento Administrativo General)**:
- Registrarla en el sistema equivale a una declaración bajo juramento sobre la autenticidad y veracidad de toda la documentación presentada.
- En el momento de la firma, el sistema registra de forma inmutable en la base de datos la **dirección IP del usuario**, la **fecha y hora exacta**, y el **Hash SHA-256** del expediente compilado.

## 7. Para el personal que recepciona (panel del evaluador)
El personal encargado de la recepción y verificación documental dispone de un módulo exclusivo:
1. **Acceso al Panel de Evaluación**:
   - Inicie sesión con el DNI asignado al comité evaluador (ej. `99999999`).
2. **Bandeja de Expedientes Recibidos**:
   - Muestra la lista cronológica de todos los expedientes marcados como **FINALIZADO** por los postulantes.
   - Permite filtrar por DNI o nombre del postulante y clasificar por estado (*Pendientes, Aptos, No Aptos*).
3. **Evaluación por Checklist de Rubros (Perfil Operador Tecnológico)**:
   - Al hacer clic en **"Evaluar Expediente"**, se abrirá la vista detallada con el resumen del postulante, folios compilados, el enlace al expediente PDF unificado y los slots A-H.
   - Para cada rubro del perfil de Operador Tecnológico (R1 a R8), marque **Cumple** o **No Cumple** e ingrese observaciones si corresponde.
   - **Cálculo Automático**: Si todos los rubros obligatorios cumplen, el dictamen proyectado será **POSTULANTE APTO**. Si algún rubro obligatorio falla, el dictamen será **POSTULANTE NO APTO**.
4. **Emisión de Acta Oficial**:
   - Presione **"Registrar Dictamen y Emitir Acta"**.
   - El sistema registrará el resultado en la base de datos y generará el PDF del **Acta Oficial de Evaluación Documental** firmado digitalmente con el código CVD del expediente y los datos del evaluador.
   - Haga clic en **"Descargar Acta de Evaluación (.pdf)"** para archivar o imprimir el documento.

## 8. Preguntas frecuentes
- **¿Quién puede descargar el Acta de Evaluación en PDF?**
  *Tanto el Evaluador como el propio Postulante pueden descargar y verificar su Acta de Evaluación desde el sistema una vez emitido el dictamen.*
- **¿Qué sucede si se re-evalúa un expediente?**
  *El evaluador puede actualizar la calificación de los rubros en cualquier momento; al guardar los cambios, se emitirá una versión actualizada del Acta PDF.*
