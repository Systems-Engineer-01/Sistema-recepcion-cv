import { Router, Response } from 'express';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import ExcelJS from 'exceljs';
import { db } from '../db/database.js';
import { authMiddleware, requireEvaluador, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../utils/auditLogger.js';

export const reportesRouter = Router();

// GET /reportes/postulantes - Cuadro cuantitativo general de postulantes y expedientes
reportesRouter.get('/postulantes', authMiddleware, requireEvaluador, (req: AuthRequest, res: Response): void => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM postulantes WHERE rol = 'POSTULANTE') AS total_postulantes,
      (SELECT COUNT(*) FROM expedientes WHERE estado = 'FINALIZADO') AS expedientes_completos,
      (SELECT COUNT(*) FROM evaluaciones) AS expedientes_evaluados,
      (SELECT COUNT(*) FROM evaluaciones WHERE resultado_final = 'APTO') AS aptos,
      (SELECT COUNT(*) FROM evaluaciones WHERE resultado_final = 'NO_APTO') AS no_aptos
  `;

  db.get(query, [], (err, summaryRow: any) => {
    if (err) {
      console.error('[DB Error] Reporte postulantes:', err);
      res.status(500).json({ error: 'Error al consultar resumen de postulantes.' });
      return;
    }

    // Consultar desglose por slot
    db.all(
      `SELECT slot, COUNT(*) AS cantidad FROM documentos GROUP BY slot`,
      [],
      (slotErr, slotRows: any[]) => {
        if (slotErr) {
          res.status(500).json({ error: 'Error al consultar desglose de documentos.' });
          return;
        }

        const desglose: Record<string, number> = {};
        if (slotRows) {
          slotRows.forEach((r) => {
            desglose[r.slot] = r.cantidad;
          });
        }

        logAudit(req, req.user?.id, req.user?.dni, 'ACCESO_REPORTES', 'Consulta de resumen de postulantes');

        res.status(200).json({
          resumen: {
            total_postulantes: summaryRow.total_postulantes || 0,
            expedientes_completos: summaryRow.expedientes_completos || 0,
            expedientes_evaluados: summaryRow.expedientes_evaluados || 0,
            aptos: summaryRow.aptos || 0,
            no_aptos: summaryRow.no_aptos || 0,
            pendientes_evaluar: (summaryRow.expedientes_completos || 0) - (summaryRow.expedientes_evaluados || 0),
          },
          desglose_slots: desglose,
        });
      }
    );
  });
});

// GET /reportes/impacto-ambiental - Estimación de ahorro de papel, traslados y CO2 (Sustento INEI)
reportesRouter.get('/impacto-ambiental', authMiddleware, requireEvaluador, (req: AuthRequest, res: Response): void => {
  const hojasPorExpedienteParam = parseFloat(req.query.hojasPorExpediente as string) || 25;
  const costoTrasladoParam = parseFloat(req.query.costoTraslado as string) || 15.0;

  const query = `
    SELECT 
      COUNT(DISTINCT e.id) AS expedientes_completos,
      COALESCE(SUM(e.total_paginas), 0) AS total_paginas_reales
    FROM expedientes e
    WHERE e.estado = 'FINALIZADO'
  `;

  db.get(query, [], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: 'Error al calcular impacto ambiental.' });
      return;
    }

    const expedientesCompletos = row.expedientes_completos || 0;
    const paginasReales = row.total_paginas_reales || 0;

    // Si existen páginas reales de PDFs consolidados se usan; sino se aplica la media paramétrica
    const hojasAhorradas = paginasReales > 0 ? paginasReales : expedientesCompletos * hojasPorExpedienteParam;
    
    // Cada expediente en físico requería al menos 1 o 2 viajes del postulante a la sede institucional
    const trasladosEvitados = expedientesCompletos;
    const ahorroEconomicoPen = trasladosEvitados * costoTrasladoParam;
    
    // Estimación ecológica: 4.5g CO2 por hoja A4 fabricada/impresa, y 2.3kg CO2 por viaje urbano promedio
    const co2HojasKg = (hojasAhorradas * 4.5) / 1000;
    const co2TrasladosKg = trasladosEvitados * 2.3;
    const co2TotalEvitadoKg = co2HojasKg + co2TrasladosKg;

    logAudit(req, req.user?.id, req.user?.dni, 'ACCESO_REPORTES', 'Consulta de impacto ambiental para INEI');

    res.status(200).json({
      parametros: {
        hojasPorExpediente: hojasPorExpedienteParam,
        costoTrasladoPen: costoTrasladoParam,
      },
      impacto: {
        expedientes_digitalizados: expedientesCompletos,
        hojas_papel_ahorradas: hojasAhorradas,
        traslados_evitados: trasladosEvitados,
        ahorro_economico_pen: parseFloat(ahorroEconomicoPen.toFixed(2)),
        co2_evitado_kg: parseFloat(co2TotalEvitadoKg.toFixed(2)),
      },
    });
  });
});

// GET /reportes/exportar?formato=xlsx|pdf - Exportar reporte consolidado
reportesRouter.get('/exportar', authMiddleware, requireEvaluador, (req: AuthRequest, res: Response): void => {
  const formato = (req.query.formato as string || 'pdf').toLowerCase();

  const queryDetail = `
    SELECT 
      p.dni,
      p.nombres,
      p.apellidos,
      p.email,
      COALESCE(e.estado, 'SIN_INICIAR') AS estado_expediente,
      COALESCE(e.total_paginas, 0) AS total_paginas,
      COALESCE(e.hash_cvd, '-') AS hash_cvd,
      COALESCE(ev.resultado_final, 'PENDIENTE') AS resultado_evaluacion,
      e.finalizado_en,
      ev.evaluado_en
    FROM postulantes p
    LEFT JOIN expedientes e ON e.postulante_id = p.id
    LEFT JOIN evaluaciones ev ON ev.expediente_id = e.id
    WHERE p.rol = 'POSTULANTE'
    ORDER BY p.apellidos ASC, p.nombres ASC
  `;

  db.all(queryDetail, [], async (err, rows: any[]) => {
    if (err) {
      console.error('[DB Error] Exportación reportes:', err);
      res.status(500).json({ error: 'Error al consultar datos para la exportación.' });
      return;
    }

    logAudit(req, req.user?.id, req.user?.dni, 'EXPORTAR_REPORTE', `Formato: ${formato.toUpperCase()}`);

    if (formato === 'xlsx') {
      try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'SIRE-CV - Sistema Integrado de Recepción Electrónica de CV';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Reporte de Postulantes');

        // Título y encabezados
        sheet.mergeCells('A1:H1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = 'SISTEMA INTEGRADO DE RECEPCIÓN ELECTRÓNICA DE CV (SIRE-CV)';
        titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        sheet.mergeCells('A2:H2');
        const subtitleCell = sheet.getCell('A2');
        subtitleCell.value = `REPORTE CONSOLIDADO DE POSTULANTES Y EVALUACIÓN - ${new Date().toLocaleDateString('es-PE')}`;
        subtitleCell.font = { name: 'Arial', size: 11, italic: true };
        subtitleCell.alignment = { horizontal: 'center' };

        sheet.addRow([]);

        // Encabezados de tabla
        const headerRow = sheet.addRow([
          'N°',
          'DNI',
          'Apellidos y Nombres',
          'Correo Electrónico',
          'Estado Expediente',
          'Páginas',
          'Dictamen Evaluador',
          'Fecha Finalización',
        ]);

        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        rows.forEach((r, idx) => {
          const row = sheet.addRow([
            idx + 1,
            r.dni,
            `${r.apellidos}, ${r.nombres}`,
            r.email,
            r.estado_expediente,
            r.total_paginas,
            r.resultado_evaluacion,
            r.finalizado_en ? new Date(r.finalizado_en).toLocaleString('es-PE') : '-',
          ]);

          // Estilar columna de dictamen
          const dictamenCell = row.getCell(7);
          if (r.resultado_evaluacion === 'APTO') {
            dictamenCell.font = { bold: true, color: { argb: 'FF15803D' } };
          } else if (r.resultado_evaluacion === 'NO_APTO') {
            dictamenCell.font = { bold: true, color: { argb: 'FFB91C1C' } };
          }
        });

        // Ajustar ancho de columnas automáticamente
        sheet.columns.forEach((column) => {
          let maxLength = 12;
          column.eachCell?.({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? String(cell.value).length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = Math.min(maxLength + 4, 40);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="reporte_postulantes_${Date.now()}.xlsx"`);
        res.status(200).send(Buffer.from(buffer));
      } catch (xlsxErr: any) {
        console.error('[Excel Error]:', xlsxErr);
        res.status(500).json({ error: 'Error al generar el archivo Excel.' });
      }
    } else {
      // Exportación en formato PDF
      try {
        const pdfDoc = await PDFDocument.create();
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
        const { width, height } = page.getSize();

        // Cabecera institucional
        page.drawRectangle({
          x: 0,
          y: height - 60,
          width,
          height: 60,
          color: rgb(0.12, 0.23, 0.54),
        });

        page.drawText('SIRE-CV — REPORTE DE EVALUACIÓN DE POSTULANTES', {
          x: 20,
          y: height - 38,
          size: 14,
          font: fontBold,
          color: rgb(1, 1, 1),
        });

        page.drawText('Documento Institucional Oficial para Sustentación ante el INEI', {
          x: 20,
          y: height - 52,
          size: 9,
          font: fontRegular,
          color: rgb(0.9, 0.9, 0.9),
        });

        let y = height - 90;

        // Fecha de emisión
        page.drawText(`Fecha de Emisión: ${new Date().toLocaleString('es-PE')}`, {
          x: 30,
          y,
          size: 10,
          font: fontRegular,
          color: rgb(0.3, 0.3, 0.3),
        });

        y -= 25;

        // Tabla de postulantes en PDF
        page.drawText('LISTADO GENERAL DE EXPEDIENTES', {
          x: 30,
          y,
          size: 11,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        y -= 15;

        // Encabezados de tabla
        page.drawRectangle({
          x: 30,
          y: y - 18,
          width: 535,
          height: 20,
          color: rgb(0.93, 0.95, 0.98),
        });

        page.drawText('DNI', { x: 35, y: y - 12, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
        page.drawText('APELLIDOS Y NOMBRES', { x: 100, y: y - 12, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
        page.drawText('ESTADO', { x: 320, y: y - 12, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
        page.drawText('PÁGS', { x: 410, y: y - 12, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
        page.drawText('DICTAMEN', { x: 470, y: y - 12, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

        y -= 25;

        rows.forEach((r) => {
          if (y < 60) return; // Limitar a 1 página para demo o continuar si se expande

          page.drawText(r.dni, { x: 35, y, size: 8, font: fontRegular });
          const nombreCompleto = `${r.apellidos}, ${r.nombres}`;
          page.drawText(nombreCompleto.length > 35 ? nombreCompleto.slice(0, 33) + '...' : nombreCompleto, {
            x: 100,
            y,
            size: 8,
            font: fontRegular,
          });
          page.drawText(r.estado_expediente, { x: 320, y, size: 8, font: fontRegular });
          page.drawText(String(r.total_paginas), { x: 410, y, size: 8, font: fontRegular });

          const dictamenColor =
            r.resultado_evaluacion === 'APTO'
              ? rgb(0.08, 0.5, 0.24)
              : r.resultado_evaluacion === 'NO_APTO'
              ? rgb(0.72, 0.11, 0.11)
              : rgb(0.4, 0.4, 0.4);

          page.drawText(r.resultado_evaluacion, {
            x: 470,
            y,
            size: 8,
            font: fontBold,
            color: dictamenColor,
          });

          y -= 16;
        });

        // Pie de página de verificación
        page.drawText('Sistema SIRE-CV — Almacenamiento local seguro conforme a la Ley 29733 (No Nube Pública)', {
          x: 30,
          y: 25,
          size: 8,
          font: fontRegular,
          color: rgb(0.5, 0.5, 0.5),
        });

        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="reporte_postulantes_${Date.now()}.pdf"`);
        res.status(200).send(Buffer.from(pdfBytes));
      } catch (pdfErr: any) {
        console.error('[PDF Export Error]:', pdfErr);
        res.status(500).json({ error: 'Error al generar el PDF del reporte.' });
      }
    }
  });
});
