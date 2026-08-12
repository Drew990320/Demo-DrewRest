"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGananciasPdf = buildGananciasPdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
const BRAND = '#2F6FED';
const INK = '#1F2937';
const MUTED = '#6B7280';
const LINE = '#E5E7EB';
const SOFT = '#F3F4F6';
const DANGER = '#B91C1C';
const OK = '#047857';
function cop(n) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(Math.round(n));
}
function formatFechaEs(ymd) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
    if (!m)
        return ymd;
    const meses = [
        'ene',
        'feb',
        'mar',
        'abr',
        'may',
        'jun',
        'jul',
        'ago',
        'sep',
        'oct',
        'nov',
        'dic',
    ];
    return `${Number(m[3])} ${meses[Number(m[2]) - 1]} ${m[1]}`;
}
function buildGananciasPdf(data) {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({
            size: 'A4',
            margin: 42,
            info: {
                Title: `Ganancias — ${data.periodo_etiqueta}`,
                Author: 'DrewRest',
                Subject: 'Reporte de ganancias',
            },
        });
        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        const pageW = doc.page.width;
        const left = 42;
        const right = pageW - 42;
        const contentW = right - left;
        const r = data.resumen;
        const netaColor = r.ganancia_neta >= 0 ? OK : DANGER;
        doc.rect(0, 0, pageW, 78).fill(BRAND);
        doc
            .fillColor('#FFFFFF')
            .fontSize(20)
            .font('Helvetica-Bold')
            .text('Reporte de ganancias', left, 22, { width: contentW });
        doc
            .fontSize(11)
            .font('Helvetica')
            .text(data.restaurante, left, 48, { width: contentW * 0.55 });
        doc
            .fontSize(10)
            .text(data.periodo_etiqueta, left, 48, {
            width: contentW,
            align: 'right',
        });
        let y = 96;
        doc
            .fillColor(MUTED)
            .fontSize(9)
            .text(`${formatFechaEs(data.fecha_desde)}${data.fecha_desde !== data.fecha_hasta
            ? ` → ${formatFechaEs(data.fecha_hasta)}`
            : ''}  ·  ${data.facturas_count} factura(s)`, left, y, { width: contentW });
        y += 22;
        doc.roundedRect(left, y, contentW, 58, 8).fill(SOFT);
        doc
            .fillColor(MUTED)
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('GANANCIA NETA', left + 16, y + 12);
        doc
            .fillColor(netaColor)
            .fontSize(22)
            .text(cop(r.ganancia_neta), left + 16, y + 28);
        doc
            .fillColor(MUTED)
            .fontSize(10)
            .font('Helvetica')
            .text(r.margen_neto_pct != null ? `Margen neto ${r.margen_neto_pct}%` : '—', left, y + 34, { width: contentW - 16, align: 'right' });
        y += 74;
        const kv = (label, value, bold = false) => {
            if (y > 720) {
                doc.addPage();
                y = 48;
            }
            doc
                .strokeColor(LINE)
                .lineWidth(0.6)
                .moveTo(left, y + 16)
                .lineTo(right, y + 16)
                .stroke();
            doc
                .fillColor(INK)
                .font(bold ? 'Helvetica-Bold' : 'Helvetica')
                .fontSize(10)
                .text(label, left, y, { width: contentW * 0.58 });
            doc.text(value, left, y, { width: contentW, align: 'right' });
            y += 20;
        };
        sectionTitle(doc, 'Resumen operativo', left, y);
        y += 20;
        kv('Ventas', cop(r.ventas));
        kv('Costo de ventas', cop(r.costo_ventas));
        kv('Ganancia bruta', `${cop(r.ganancia_bruta)}${r.margen_bruto_pct != null ? ` (${r.margen_bruto_pct}%)` : ''}`, true);
        kv('Gastos fijos', cop(r.gastos_fijos));
        kv('Gastos extras', cop(r.gastos_extras));
        kv('Pagos a meseros', cop(r.gastos_meseros ?? 0));
        kv('Total gastos', cop(r.gastos_total), true);
        kv('Unidades vendidas', String(r.unidades_vendidas));
        y += 8;
        if (r.productos_sin_costo > 0) {
            doc
                .fillColor('#9A3412')
                .fontSize(9)
                .text(`Aviso: ${r.productos_sin_costo} producto(s) sin costo (${r.unidades_sin_costo} und.).`, left, y, { width: contentW });
            y += 18;
        }
        y = drawTableSection(doc, 'Por producto', ['Producto', 'Cant.', 'Venta', 'Costo', 'Ganancia'], data.por_producto.slice(0, 35).map((p) => [
            p.nombre,
            String(p.cantidad),
            cop(p.venta_total),
            cop(p.costo_total),
            cop(p.ganancia),
        ]), [0.34, 0.1, 0.18, 0.18, 0.2], left, contentW, y, data.por_producto.length === 0 ? 'Sin ventas en el periodo.' : undefined);
        if (data.por_producto.length > 35) {
            doc
                .fillColor(MUTED)
                .fontSize(8)
                .text(`… y ${data.por_producto.length - 35} productos más`, left, y);
            y += 14;
        }
        y = drawTableSection(doc, 'Gastos fijos', ['Concepto', 'Mensual', 'En periodo'], data.gastos_fijos.map((g) => [
            g.usa_fondo_diario ? `${g.nombre} (fondo)` : g.nombre,
            cop(g.monto_mensual),
            cop(g.monto_periodo),
        ]), [0.5, 0.25, 0.25], left, contentW, y, data.gastos_fijos.length === 0 ? 'Ninguno' : undefined);
        y = drawTableSection(doc, 'Gastos extras', ['Fecha', 'Concepto', 'Monto'], data.gastos_extras.map((g) => [
            formatFechaEs(g.fecha),
            g.nombre,
            cop(g.monto),
        ]), [0.22, 0.53, 0.25], left, contentW, y, data.gastos_extras.length === 0 ? 'Ninguno' : undefined);
        y = drawTableSection(doc, 'Pagos a meseros', ['Fecha', 'Mesero', 'Monto'], (data.pagos_meseros ?? []).map((g) => [
            formatFechaEs(g.fecha),
            g.mesero,
            cop(g.monto),
        ]), [0.22, 0.53, 0.25], left, contentW, y, (data.pagos_meseros ?? []).length === 0 ? 'Ninguno' : undefined);
        doc
            .fillColor(MUTED)
            .fontSize(8)
            .text(`Generado por DrewRest · Módulo Ganancias · ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`, left, doc.page.height - 36, { width: contentW, align: 'center' });
        doc.end();
    });
}
function sectionTitle(doc, title, left, y) {
    doc
        .fillColor(BRAND)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(title, left, y);
}
function drawTableSection(doc, title, headers, rows, widths, left, contentW, startY, emptyText) {
    let y = startY + 6;
    if (y > 700) {
        doc.addPage();
        y = 48;
    }
    sectionTitle(doc, title, left, y);
    y += 18;
    if (rows.length === 0) {
        doc
            .fillColor(MUTED)
            .font('Helvetica')
            .fontSize(9)
            .text(emptyText ?? 'Ninguno', left, y);
        return y + 18;
    }
    const cols = widths.map((w) => w * contentW);
    const drawHeader = () => {
        doc.roundedRect(left, y, contentW, 18, 3).fill(SOFT);
        let x = left + 6;
        doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8);
        headers.forEach((h, i) => {
            const align = i === 0 ? 'left' : 'right';
            doc.text(h, x, y + 5, { width: cols[i] - 8, align });
            x += cols[i];
        });
        y += 22;
    };
    drawHeader();
    doc.font('Helvetica').fontSize(8).fillColor(INK);
    for (const row of rows) {
        if (y > 740) {
            doc.addPage();
            y = 48;
            drawHeader();
            doc.font('Helvetica').fontSize(8).fillColor(INK);
        }
        let x = left + 6;
        row.forEach((cell, i) => {
            const align = i === 0 ? 'left' : 'right';
            doc.text(cell, x, y, { width: cols[i] - 8, align });
            x += cols[i];
        });
        y += 14;
        doc
            .strokeColor(LINE)
            .lineWidth(0.4)
            .moveTo(left, y - 2)
            .lineTo(left + contentW, y - 2)
            .stroke();
    }
    return y + 10;
}
//# sourceMappingURL=ganancias-pdf.js.map