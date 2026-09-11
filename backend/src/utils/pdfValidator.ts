import { PDFDocument } from 'pdf-lib';

export interface PDFValidationResult {
  isValid: boolean;
  error?: string;
  pageCount?: number;
  width?: number;
  height?: number;
  isPortrait?: boolean;
}

export async function validatePdfA4Portrait(buffer: Buffer): Promise<PDFValidationResult> {
  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    if (pageCount === 0) {
      return { isValid: false, error: 'El documento PDF no contiene páginas.' };
    }

    const firstPage = pdfDoc.getPage(0);
    const { width, height } = firstPage.getSize();

    // Orientación: La altura debe ser mayor que el ancho para ser vertical
    const isPortrait = height > width;

    if (!isPortrait) {
      return {
        isValid: false,
        error: `El documento está en orientación horizontal (Landscape: ${Math.round(width)}x${Math.round(height)} pt). El reglamento exige formato vertical (Portrait).`,
        pageCount,
        width,
        height,
        isPortrait: false,
      };
    }

    // Tolerancia razonable para A4 (A4 estándar: 595.28 x 841.89 pt)
    // Rango A4 común: Ancho 570 - 620 pt, Alto 810 - 870 pt
    const isA4Width = width >= 560 && width <= 630;
    const isA4Height = height >= 800 && height <= 880;

    // Si difiere drásticamente de A4 (ej. Oficio gigante o Letter)
    if (!isA4Width || !isA4Height) {
      // También verificamos si la proporción es cercana al aspecto A4 (sqrt(2) ≈ 1.414)
      const ratio = height / width;
      const isA4Ratio = ratio >= 1.30 && ratio <= 1.55;

      if (!isA4Ratio) {
        return {
          isValid: false,
          error: `El tamaño del documento (${Math.round(width)}x${Math.round(height)} pt) no corresponde a la dimensión A4 requerida (595x842 pt).`,
          pageCount,
          width,
          height,
          isPortrait,
        };
      }
    }

    return {
      isValid: true,
      pageCount,
      width,
      height,
      isPortrait: true,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Error al procesar la estructura del archivo PDF: ${err.message || 'Archivo dañado o no es un PDF válido.'}`,
    };
  }
}
