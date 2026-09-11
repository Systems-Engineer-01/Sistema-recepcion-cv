import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface PostulanteData {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
}

export interface ExpedienteData {
  id: number;
  pdf_consolidado_url?: string;
  hash_cvd?: string;
  total_paginas?: number;
  declaracion_ip?: string;
  declaracion_fecha?: string;
  finalizado_en?: string;
}

export interface EvaluacionDetalleItem {
  rubro_id: number;
  codigo: string;
  nombre: string;
  slot_relacionado: string;
  es_obligatorio: number;
  cumple: number; // 1 or 0
  observacion?: string;
}

export interface EvaluacionData {
  id: number;
  resultado_final: 'APTO' | 'NO_APTO';
  observacion_general?: string;
  evaluado_en: string;
  evaluador_nombres: string;
  evaluador_apellidos: string;
  evaluador_dni: string;
  detalles: EvaluacionDetalleItem[];
}

export async function generateActaEvaluacionPdf(
  postulante: PostulanteData,
  expediente: ExpedienteData,
  evaluacion: EvaluacionData
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Portrait
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colores institucional
  const darkNavy = rgb(0.06, 0.09, 0.16);
  const primaryBlue = rgb(0.15, 0.38, 0.92);
  const textDark = rgb(0.12, 0.16, 0.22);
  const textMuted = rgb(0.4, 0.45, 0.55);
  const successGreen = rgb(0.05, 0.6, 0.38);
  const dangerRed = rgb(0.85, 0.15, 0.22);

  let currentY = height - 45;

  // Header Banner
  page.drawRectangle({
    x: 35,
    y: currentY - 55,
    width: width - 70,
    height: 65,
    color: darkNavy,
  });

  page.drawText('SIRE-CV — GOBIERNO DIGITAL DEL PERÚ', {
    x: 50,
    y: currentY - 20,
    size: 9,
    font: fontBold,
    color: rgb(0.35, 0.65, 0.98),
  });

  page.drawText('ACTA OFICIAL DE EVALUACIÓN DOCUMENTAL', {
    x: 50,
    y: currentY - 36,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('Concurso Magisterial 2026 — Perfil: Operador Tecnológico', {
    x: 50,
    y: currentY - 49,
    size: 8.5,
    font: font,
    color: rgb(0.8, 0.85, 0.95),
  });

  currentY -= 75;

  // Sección 1: Datos del Postulante
  page.drawText('1. DATOS DEL POSTULANTE', {
    x: 35,
    y: currentY,
    size: 10,
    font: fontBold,
    color: primaryBlue,
  });

  currentY -= 15;

  page.drawRectangle({
    x: 35,
    y: currentY - 42,
    width: width - 70,
    height: 48,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.85, 0.88, 0.94),
    borderWidth: 1,
  });

  page.drawText(`Postulante: ${postulante.nombres} ${postulante.apellidos}`, {
    x: 45,
    y: currentY - 14,
    size: 9.5,
    font: fontBold,
    color: textDark,
  });

  page.drawText(`DNI: ${postulante.dni}`, {
    x: 45,
    y: currentY - 28,
    size: 8.5,
    font: font,
    color: textDark,
  });

  page.drawText(`Correo: ${postulante.email}`, {
    x: 230,
    y: currentY - 28,
    size: 8.5,
    font: font,
    color: textDark,
  });

  page.drawText(`Fecha Presentación: ${expediente.finalizado_en ? new Date(expediente.finalizado_en).toLocaleDateString() : 'N/A'}`, {
    x: 390,
    y: currentY - 28,
    size: 8.5,
    font: font,
    color: textDark,
  });

  currentY -= 60;

  // Sección 2: Resumen del Expediente y CVD
  page.drawText('2. VERIFICACIÓN Y TRAZABILIDAD DEL EXPEDIENTE', {
    x: 35,
    y: currentY,
    size: 10,
    font: fontBold,
    color: primaryBlue,
  });

  currentY -= 15;

  page.drawRectangle({
    x: 35,
    y: currentY - 32,
    width: width - 70,
    height: 38,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.85, 0.88, 0.94),
    borderWidth: 1,
  });

  const shortHash = expediente.hash_cvd ? expediente.hash_cvd.substring(0, 24).toUpperCase() : 'N/A';
  page.drawText(`Código CVD (SHA-256): ${shortHash}...`, {
    x: 45,
    y: currentY - 14,
    size: 8.5,
    font: fontBold,
    color: textDark,
  });

  page.drawText(`Total Folios Compilados: ${expediente.total_paginas || 0} hojas (Foliado k/N)`, {
    x: 340,
    y: currentY - 14,
    size: 8.5,
    font: font,
    color: textDark,
  });

  page.drawText(`Firma Digital Art. 49 Ley 27444 | IP: ${expediente.declaracion_ip || 'Localhost'}`, {
    x: 45,
    y: currentY - 26,
    size: 7.5,
    font: font,
    color: textMuted,
  });

  currentY -= 50;

  // Sección 3: Resultado por Rubro
  page.drawText('3. EVALUACIÓN DE CHECKLIST POR RUBRO (OPERADOR TECNOLÓGICO)', {
    x: 35,
    y: currentY,
    size: 10,
    font: fontBold,
    color: primaryBlue,
  });

  currentY -= 15;

  // Table Header
  const tableX = 35;
  const tableWidth = width - 70;
  const col1W = 190;
  const col2W = 90;

  page.drawRectangle({
    x: tableX,
    y: currentY - 16,
    width: tableWidth,
    height: 18,
    color: darkNavy,
  });

  page.drawText('Rubro Evaluado', { x: tableX + 8, y: currentY - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Dictamen', { x: tableX + col1W + 8, y: currentY - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Observaciones', { x: tableX + col1W + col2W + 8, y: currentY - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });

  currentY -= 16;

  // Table Rows
  evaluacion.detalles.forEach((det, idx) => {
    const rowY = currentY - 20;
    const isEven = idx % 2 === 0;

    page.drawRectangle({
      x: tableX,
      y: rowY,
      width: tableWidth,
      height: 20,
      color: isEven ? rgb(1, 1, 1) : rgb(0.97, 0.98, 1),
      borderColor: rgb(0.9, 0.92, 0.96),
      borderWidth: 0.5,
    });

    const isCumple = det.cumple === 1;
    const dictamenText = isCumple ? 'CUMPLE' : 'NO CUMPLE';
    const dictamenColor = isCumple ? successGreen : dangerRed;

    // Nombre Rubro (recortado si es muy largo)
    const rubroText = det.nombre.length > 32 ? det.nombre.substring(0, 32) + '...' : det.nombre;
    page.drawText(rubroText, { x: tableX + 8, y: rowY + 6, size: 8, font: font, color: textDark });

    // Dictamen Badge
    page.drawText(dictamenText, { x: tableX + col1W + 8, y: rowY + 6, size: 8, font: fontBold, color: dictamenColor });

    // Observación
    const obsText = det.observacion ? (det.observacion.length > 35 ? det.observacion.substring(0, 35) + '...' : det.observacion) : 'Sin observaciones';
    page.drawText(obsText, { x: tableX + col1W + col2W + 8, y: rowY + 6, size: 7.5, font: font, color: textMuted });

    currentY -= 20;
  });

  currentY -= 25;

  // Sección 4: Dictamen Final y Firma
  const isApto = evaluacion.resultado_final === 'APTO';

  page.drawRectangle({
    x: 35,
    y: currentY - 50,
    width: width - 70,
    height: 55,
    color: isApto ? rgb(0.92, 0.99, 0.95) : rgb(1, 0.93, 0.94),
    borderColor: isApto ? successGreen : dangerRed,
    borderWidth: 1.5,
  });

  page.drawText('DICTAMEN FINAL DEL EVALUADOR:', {
    x: 50,
    y: currentY - 18,
    size: 10,
    font: fontBold,
    color: textDark,
  });

  page.drawText(isApto ? 'POSTULANTE APTO' : 'POSTULANTE NO APTO', {
    x: 250,
    y: currentY - 20,
    size: 16,
    font: fontBold,
    color: isApto ? successGreen : dangerRed,
  });

  page.drawText(
    isApto
      ? 'El expediente cumple con todos los requisitos obligatorios del perfil de Operador Tecnológico.'
      : 'El expediente no cumple con uno o más requisitos obligatorios del perfil del concurso.',
    {
      x: 50,
      y: currentY - 38,
      size: 8.5,
      font: font,
      color: textDark,
    }
  );

  currentY -= 80;

  // Firma del Evaluador Box
  page.drawRectangle({
    x: 180,
    y: currentY - 45,
    width: 235,
    height: 50,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.8, 0.84, 0.9),
    borderWidth: 1,
  });

  page.drawText('Firma y Sello del Evaluador Responsable', {
    x: 195,
    y: currentY - 14,
    size: 8,
    font: fontBold,
    color: textDark,
  });

  page.drawText(`Evaluador: ${evaluacion.evaluador_nombres} ${evaluacion.evaluador_apellidos}`, {
    x: 195,
    y: currentY - 26,
    size: 7.5,
    font: font,
    color: textMuted,
  });

  page.drawText(`DNI Evaluador: ${evaluacion.evaluador_dni} | Fecha: ${new Date(evaluacion.evaluado_en).toLocaleString()}`, {
    x: 195,
    y: currentY - 38,
    size: 7,
    font: font,
    color: textMuted,
  });

  // Footer institucional
  page.drawLine({ start: { x: 35, y: 30 }, end: { x: width - 35, y: 30 }, thickness: 0.5, color: textMuted });
  page.drawText('SIRE-CV — Documento Oficial de Evaluación del Concurso de Ascenso Magisterial 2026', {
    x: 35,
    y: 18,
    size: 7.5,
    font: font,
    color: textMuted,
  });

  return Buffer.from(await pdfDoc.save());
}
