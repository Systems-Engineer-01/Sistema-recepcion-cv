# Manual de Usuario — SIRE-CV
*(Documento vivo: se actualiza al cierre de cada sprint. Versión actual: **Sprint 5 — Integración Pública y Flujo de Subsanación**)*

## 1. ¿Qué es SIRE-CV?
Sistema para presentar tu Currículum Vitae documentado de forma digital, respetando el mismo orden y checklist (A–H) del comunicado oficial, sin necesidad de folder manila, firma física ni traslado presencial.

## 2. Requisitos previos
- DNI vigente (8 dígitos).
- Cada documento en formato **PDF**, tamaño **A4**, orientación **vertical (Portrait)** y peso máximo de **10 MB**.
- Correo electrónico activo.

## 3. Registro e inicio de sesión
1. **Registro (Postulante)**:
   - Ingrese al portal web (ej. `http://localhost:3000` o enlace público).
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

## 6. Flujo de Subsanación (Expedientes Observados)
Si el comité evaluador detecta algún error subsanable en sus documentos (por ejemplo, documento ilegible o adjunto erróneo), no rechazará su expediente de inmediato, sino que lo marcará como **OBSERVADO**.
1. Al ingresar a **Mi Expediente**, visualizará un banner amarillo indicando: **"Expediente Observado - Subsanación Requerida"**.
2. Debajo, podrá leer el motivo exacto de la observación (ej. *"Subió el DNI en el slot de Constancia de Trabajo"*).
3. Podrá reemplazar únicamente el archivo que motivó la observación, sin tener que volver a cargar todo su expediente.
4. Una vez reemplazado el archivo, deberá marcar nuevamente la Declaración Jurada y presionar en **"Volver a Enviar Expediente (Subsanación)"** para consolidar su nuevo PDF foliado.

## 7. Declaración jurada digital
La firma de la Declaración Jurada Digital se ampara en el **Art. 49 del TUO de la Ley N.º 27444 (Ley del Procedimiento Administrativo General)**:
- Registrarla en el sistema equivale a una declaración bajo juramento sobre la autenticidad y veracidad de toda la documentación presentada.
- En el momento de la firma, el sistema registra de forma inmutable en la base de datos la **dirección IP del usuario**, la **fecha y hora exacta**, y el **Hash SHA-256** del expediente compilado.

## 8. Para el personal que recepciona (panel del evaluador)
El personal encargado de la recepción y verificación documental dispone de un módulo exclusivo:
1. **Acceso al Panel de Evaluación**:
   - Inicie sesión con el DNI asignado al comité evaluador (ej. `99999999`).
2. **Bandeja de Expedientes Recibidos**:
   - Muestra la lista cronológica de todos los expedientes marcados como **FINALIZADO** por los postulantes.
   - Permite filtrar por DNI o nombre del postulante y clasificar por estado (*Pendientes, Aptos, No Aptos, Observados*).
3. **Evaluación por Checklist de Rubros (Perfil Operador Tecnológico)**:
   - Al hacer clic en **"Evaluar Expediente"**, se abrirá la vista detallada con el resumen del postulante, folios compilados, el enlace al expediente PDF unificado y los slots A-H.
   - Para cada rubro del perfil de Operador Tecnológico (R1 a R8), marque **Cumple** o **No Cumple** e ingrese observaciones si corresponde.
   - **Cálculo Automático**: 
     - **APTO**: Todos los rubros obligatorios cumplen.
     - **NO APTO**: Algún rubro obligatorio no cumple de forma definitiva.
     - **OBSERVADO**: Requiere subsanación. Deberá escribir el motivo en el cuadro inferior.
4. **Emisión de Acta Oficial**:
   - Presione **"Registrar Dictamen y Emitir Acta"**.
   - El sistema registrará el resultado en la base de datos y generará el PDF del **Acta Oficial de Evaluación Documental** firmado digitalmente con el código CVD del expediente y los datos del evaluador.
   - Haga clic en **"Descargar Acta de Evaluación (.pdf)"** para archivar o imprimir el documento.

## 9. Módulo de Reportería e Impacto Ambiental para el INEI
En el menú superior del Evaluador/Administrador, haga clic en la pestaña **"Reportería & INEI"**:
1. **Cuadro Cuantitativo de Postulantes**:
   - Muestra tarjetas en tiempo real con el total de postulantes registrados, expedientes finalizados, pendientes de evaluación, aptos y no aptos.
2. **Exportación de Reportes**:
   - **Boton "Exportar Excel (.xlsx)"**: Descarga una hoja de cálculo profesional con el detalle de postulantes, estados, dictámenes y folios.
   - **Boton "Exportar PDF (.pdf)"**: Descarga un informe institucional formateado en A4 listo para presentación.
3. **Bloque de Impacto Ambiental & Ecoeficiencia (Argumento INEI)**:
   - Simula y cuantifica el impacto del reemplazo del papel físico:
     - **Hojas de Papel Ahorradas**, **Traslados Evitados**, **Ahorro Económico (S/.)**, y **CO2 Evitado**.

## 10. Seguridad, Almacenamiento Institucional y Backup
1. **Cumplimiento de la Ley N.º 29733 (Sin Nube Pública)**:
   - Todos los PDFs residen en el disco local del servidor institucional (`STORAGE_PATH`).
2. **Cifrado en Reposo (AES-256-CBC)**:
   - Los archivos en disco se almacenan cifrados con clave secreta administrada por variable de entorno `ENCRYPTION_KEY`.
3. **Log de Auditoría Estricta**:
   - Cada acción queda registrada en la tabla `log_auditoria` con IP, fecha/hora y DNI.
4. **Copias de Seguridad (Backups)**:
   - Ejecutar: `cd backend && npm run backup`.

## 11. Acceso Público a través de ngrok
Dado que el servidor local no cuenta con una IP pública estática, se integra **ngrok** para exponer el puerto donde corre la aplicación a internet:
1. En la máquina donde está ejecutando el Frontend y Backend, descargue e instale [ngrok](https://ngrok.com/).
2. Autentique su cuenta de ngrok en la terminal.
3. Para exponer el portal de recepción, levante el frontend (y backend en los puertos correspondientes), y en otra terminal corra:
   ```bash
   ngrok http 4000
   ```
4. Copie la URL proporcionada (ej. `https://xxxx-xxx.ngrok.app`) y compártala con los postulantes en la convocatoria.
5. El proxy del frontend enrutará correctamente las solicitudes web de `ngrok` hacia el Backend (puerto `4000`).

## 12. Preguntas frecuentes
- **¿Quién puede descargar el Acta de Evaluación en PDF?**
  *Tanto el Evaluador como el propio Postulante pueden descargar y verificar su Acta de Evaluación desde el sistema una vez emitido el dictamen.*
- **¿Dónde se guardan los archivos subidos?**
  *Se almacenan en disco local en la carpeta configurable `STORAGE_PATH`, cifrados con AES-256 en reposo, garantizando el cumplimiento de la Ley 29733.*

## 13. Referencias y Citación
Si deseas referenciar este sistema de software en documentos académicos, informes técnicos o tesis bajo el formato **IEEE**, utiliza la siguiente estructura de citación:

> [1] E. L. Nazario Roa, "Sistema-recepcion-cv (SIRE-CV) - Sistema Integrado de Recepción Electrónica", GitHub repository, 2026. [Online]. Available: https://github.com/Systems-Engineer-01/Sistema-recepcion-cv
