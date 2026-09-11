import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import crypto from 'crypto';

export interface DocumentToConsolidate {
  slot: string;
  buffer: Buffer;
  nombreOriginal: string;
}

export interface ConsolidationResult {
  pdfBuffer: Buffer;
  hashCvd: string;
  shortHashCvd: string;
  totalPaginas: number;
  timestamp: string;
}

export async function consolidateAndFolioExpediente(
  documentos: DocumentToConsolidate[]
): Promise<ConsolidationResult> {
  const mergedPdf = await PDFDocument.create();

  // 1. Unificar todos los documentos en el orden A -> H
  for (const docInfo of documentos) {
    try {
      const srcPdf = await PDFDocument.load(docInfo.buffer, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } catch (err: any) {
      throw new Error(`Error procesando PDF del slot ${docInfo.slot} (${docInfo.nombreOriginal}): ${err.message}`);
    }
  }

  const totalPaginas = mergedPdf.getPageCount();
  if (totalPaginas === 0) {
    throw new Error('El expediente no contiene ninguna página para consolidar.');
  }

  // 2. Calcular Hash SHA-256 inicial del documento unificado
  const tempBuffer = Buffer.from(await mergedPdf.save());
  const hashCvd = crypto.createHash('sha256').update(tempBuffer).digest('hex');
  const shortHashCvd = hashCvd.substring(0, 16).toUpperCase();
  const timestamp = new Date().toISOString();

  // 3. Estampar pie de página con CVD, Foliado y marca institucional
  const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

  const pages = mergedPdf.getPages();

  for (let i = 0; i < totalPaginas; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    // Folio número (1-indexed)
    const pageNum = i + 1;

    const lineY = 32;
    const textY = 18;

    // Línea sutil de separación
    page.drawLine({
      start: { x: 30, y: lineY },
      end: { x: width - 30, y: lineY },
      thickness: 0.75,
      color: rgb(0.15, 0.38, 0.92), // Azul institucional
      opacity: 0.6,
    });

    // Texto de Verificación Digital (Izquierda)
    const cvdText = `CVD: ${shortHashCvd} | SIRE-CV Validez Legal Art. 49 Ley 27444 | ${timestamp.substring(0, 10)}`;
    page.drawText(cvdText, {
      x: 30,
      y: textY,
      size: 7.5,
      font: font,
      color: rgb(0.3, 0.35, 0.45),
    });

    // Foliado Digital (Derecha) - Formato "Folio k de N"
    const folioText = `Folio ${pageNum} de ${totalPaginas}`;
    const folioWidth = fontBold.widthOfTextAtSize(folioText, 8.5);

    page.drawText(folioText, {
      x: width - 30 - folioWidth,
      y: textY,
      size: 8.5,
      font: fontBold,
      color: rgb(0.1, 0.25, 0.7),
    });
  }

  const finalPdfBuffer = Buffer.from(await mergedPdf.save());

  return {
    pdfBuffer: finalPdfBuffer,
    hashCvd,
    shortHashCvd,
    totalPaginas,
    timestamp,
  };
}
