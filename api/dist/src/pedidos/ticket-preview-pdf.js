"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escposBufferToPdf = escposBufferToPdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
const escpos_buffer_decode_1 = require("./escpos-buffer-decode");
const escpos_utils_1 = require("./escpos-utils");
const MM_TO_PT = 72 / 25.4;
const TICKET_WIDTH_MM = 58;
const PAGE_WIDTH_PT = TICKET_WIDTH_MM * MM_TO_PT;
const PAD_PT = 5;
const CONTENT_W_PT = PAGE_WIDTH_PT - PAD_PT * 2;
const BASE_FONT_SIZE = 7.2;
const LINE_HEIGHT = BASE_FONT_SIZE * 1.28;
function pickFont(bold) {
    return bold ? 'Courier-Bold' : 'Courier';
}
function renderSegments(doc, segments, logoPng, subtitle) {
    let y = PAD_PT;
    const ensureSpace = (h) => {
        const maxY = doc.page.height - PAD_PT;
        if (y + h > maxY) {
            doc.addPage({
                size: [PAGE_WIDTH_PT, 720],
                margins: { top: PAD_PT, bottom: PAD_PT, left: PAD_PT, right: PAD_PT },
            });
            y = PAD_PT;
        }
    };
    if (subtitle?.trim()) {
        doc
            .font('Helvetica')
            .fontSize(5.5)
            .fillColor('#666666')
            .text(subtitle.trim(), PAD_PT, y, { width: CONTENT_W_PT, align: 'center' });
        y += 9;
    }
    for (const seg of segments) {
        if (seg.kind === 'logo') {
            if (logoPng) {
                ensureSpace(56);
                try {
                    doc.image(logoPng, PAD_PT, y, { width: CONTENT_W_PT });
                    y += 52;
                }
                catch {
                }
            }
            continue;
        }
        if (seg.kind === 'rule') {
            ensureSpace(LINE_HEIGHT);
            doc
                .moveTo(PAD_PT, y + LINE_HEIGHT * 0.45)
                .lineTo(PAGE_WIDTH_PT - PAD_PT, y + LINE_HEIGHT * 0.45)
                .strokeColor('#999999')
                .lineWidth(0.5)
                .stroke();
            y += LINE_HEIGHT;
            continue;
        }
        const { line } = seg;
        const size = BASE_FONT_SIZE *
            (line.doubleHeight ? 1.3 : 1) *
            (line.doubleWidth ? 1.05 : 1);
        const h = LINE_HEIGHT * (line.doubleHeight ? 1.25 : 1);
        ensureSpace(h);
        doc
            .font(pickFont(line.bold))
            .fontSize(size)
            .fillColor('#111111')
            .text(line.text || ' ', PAD_PT, y, {
            width: CONTENT_W_PT,
            align: line.align,
            lineBreak: false,
        });
        y += h;
    }
}
function escposBufferToPdf(buffer, opts) {
    const segments = (0, escpos_buffer_decode_1.decodeEscPosBuffer)(buffer, opts?.charWidth ?? escpos_utils_1.DEFAULT_ESC_POS_WIDTH);
    return new Promise((resolve, reject) => {
        const chunks = [];
        const doc = new pdfkit_1.default({
            size: [PAGE_WIDTH_PT, 720],
            margins: { top: PAD_PT, bottom: PAD_PT, left: PAD_PT, right: PAD_PT },
            autoFirstPage: true,
            info: {
                Title: 'Vista previa ticket POS 58 mm',
                Producer: 'DrewRest',
            },
        });
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        renderSegments(doc, segments, opts?.logoPng, opts?.subtitle);
        doc.end();
    });
}
//# sourceMappingURL=ticket-preview-pdf.js.map