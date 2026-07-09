"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.printEncabezadoDrewRest = exports.DREWTECH_CREDITO_LINEA = exports.DREWTECH_TELEFONO_LABEL = exports.DREWTECH_TELEFONO = exports.DEFAULT_ESC_POS_WIDTH = void 0;
exports.ticketNombreLocal = ticketNombreLocal;
exports.ticketTelefono = ticketTelefono;
exports.ticketDireccion = ticketDireccion;
exports.dimensionesLogoContenidas = dimensionesLogoContenidas;
exports.ticketLogoPngBufferForPreview = ticketLogoPngBufferForPreview;
exports.printPieDrewTechFactura = printPieDrewTechFactura;
exports.formatCopEscPos = formatCopEscPos;
exports.wrapEscPos = wrapEscPos;
exports.lineaConPrecio = lineaConPrecio;
exports.createEscPosPrinter = createEscPosPrinter;
exports.printEncabezadoRestaurante = printEncabezadoRestaurante;
exports.bufferFromPrinter = bufferFromPrinter;
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const restaurant_branding_1 = require("../common/restaurant-branding");
const visual_assets_util_1 = require("../visual/visual-assets.util");
exports.DEFAULT_ESC_POS_WIDTH = 32;
function ticketNombreLocal() {
    return (0, restaurant_branding_1.restaurantName)();
}
function ticketTelefono() {
    return (0, restaurant_branding_1.restaurantTicketPhone)();
}
function ticketDireccion() {
    return (0, restaurant_branding_1.restaurantTicketAddress)();
}
const TICKET_LOGO_ANCHO_PX = (() => {
    const n = Number(process.env.PRINTER_LOGO_WIDTH_PX ?? 384);
    return Number.isFinite(n) && n >= 80 && n <= 576 ? Math.round(n) : 384;
})();
const TICKET_LOGO_MAX_ALTO_PX = (() => {
    const n = Number(process.env.PRINTER_LOGO_MAX_HEIGHT_PX ?? 320);
    return Number.isFinite(n) && n >= 40 && n <= 800 ? Math.round(n) : 320;
})();
const FACTURA_LOGO_MAX_ANCHO = 320;
const FACTURA_LOGO_MAX_ALTO = 120;
function dimensionesLogoContenidas(srcW, srcH, maxW, maxH) {
    if (srcW <= 0 || srcH <= 0) {
        return { width: maxW, height: Math.min(maxH, 72) };
    }
    const scale = Math.min(maxW / srcW, maxH / srcH);
    return {
        width: Math.max(1, Math.round(srcW * scale)),
        height: Math.max(1, Math.round(srcH * scale)),
    };
}
function anchoEscPosPx(width, maxWidth) {
    const capped = Math.min(width, maxWidth);
    return Math.max(8, Math.floor(capped / 8) * 8);
}
exports.DREWTECH_TELEFONO = '3207964367';
exports.DREWTECH_TELEFONO_LABEL = 'Tel: 320 796 4367';
exports.DREWTECH_CREDITO_LINEA = 'Sistema interno del restaurante elaborado por DrewTech POS';
function sampleRgbaBilinear(src, fx, fy) {
    const x = Math.min(src.width - 1, Math.max(0, fx));
    const y = Math.min(src.height - 1, Math.max(0, fy));
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(src.width - 1, x0 + 1);
    const y1 = Math.min(src.height - 1, y0 + 1);
    const dx = x - x0;
    const dy = y - y0;
    const read = (px, py) => {
        const i = (py * src.width + px) << 2;
        return [
            src.data[i],
            src.data[i + 1],
            src.data[i + 2],
            src.data[i + 3],
        ];
    };
    const c00 = read(x0, y0);
    const c10 = read(x1, y0);
    const c01 = read(x0, y1);
    const c11 = read(x1, y1);
    const lerp = (a, b, t) => a + (b - a) * t;
    return [
        Math.round(lerp(lerp(c00[0], c10[0], dx), lerp(c01[0], c11[0], dx), dy)),
        Math.round(lerp(lerp(c00[1], c10[1], dx), lerp(c01[1], c11[1], dx), dy)),
        Math.round(lerp(lerp(c00[2], c10[2], dx), lerp(c01[2], c11[2], dx), dy)),
        Math.round(lerp(lerp(c00[3], c10[3], dx), lerp(c01[3], c11[3], dx), dy)),
    ];
}
function redimensionarPngBuffer(pngBuffer, maxWidthPx, maxHeightPx) {
    try {
        const { PNG } = require('pngjs');
        const src = PNG.sync.read(pngBuffer);
        const fitted = dimensionesLogoContenidas(src.width, src.height, maxWidthPx, maxHeightPx);
        let targetW = anchoEscPosPx(fitted.width, maxWidthPx);
        let targetH = Math.max(1, Math.round((src.height / src.width) * targetW));
        if (targetH > maxHeightPx) {
            targetH = maxHeightPx;
            targetW = anchoEscPosPx(Math.round((src.width / src.height) * targetH), maxWidthPx);
        }
        if (targetW <= 0)
            return null;
        if (targetW === src.width && targetH === src.height) {
            return pngBuffer;
        }
        const dst = new PNG({ width: targetW, height: targetH });
        const scaleX = src.width / targetW;
        const scaleY = src.height / targetH;
        for (let y = 0; y < targetH; y++) {
            const fy = (y + 0.5) * scaleY - 0.5;
            for (let x = 0; x < targetW; x++) {
                const fx = (x + 0.5) * scaleX - 0.5;
                const [r, g, b, a] = sampleRgbaBilinear(src, fx, fy);
                const di = (y * targetW + x) << 2;
                dst.data[di] = r;
                dst.data[di + 1] = g;
                dst.data[di + 2] = b;
                dst.data[di + 3] = a;
            }
        }
        return PNG.sync.write(dst);
    }
    catch {
        return null;
    }
}
async function cargarLogoTicketRedimensionado(sourcePath) {
    try {
        const { leerImagenComoPngBuffer } = await Promise.resolve().then(() => __importStar(require('../visual/image-png.util')));
        const pngBuf = await leerImagenComoPngBuffer(sourcePath);
        return redimensionarPngBuffer(pngBuf, TICKET_LOGO_ANCHO_PX, TICKET_LOGO_MAX_ALTO_PX);
    }
    catch {
        return null;
    }
}
function resolveTicketLogoPath() {
    return ((0, visual_assets_util_1.resolverAssetVisualPath)('ticket', null) ??
        (0, visual_assets_util_1.resolverAssetVisualPath)('factura', null) ??
        (0, visual_assets_util_1.resolverAssetVisualPath)('login', null) ??
        (0, restaurant_branding_1.resolveRestaurantLogoPath)());
}
async function ticketLogoPngBufferForPreview() {
    const logoPath = resolveTicketLogoPath();
    if (!logoPath)
        return null;
    return cargarLogoTicketRedimensionado(logoPath);
}
async function printPieDrewTechFactura(printer, charWidth = exports.DEFAULT_ESC_POS_WIDTH) {
    if (!(0, restaurant_branding_1.restaurantMostrarCreditoDrewTech)())
        return;
    await printer.alignCenter();
    await printer.newLine();
    for (const line of wrapEscPos(exports.DREWTECH_CREDITO_LINEA, charWidth)) {
        await printer.println(line);
    }
    await printer.println(exports.DREWTECH_TELEFONO_LABEL);
}
function formatCopEscPos(value) {
    const n = Math.round(Number(value) || 0);
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    const grouped = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${sign}$ ${grouped}`;
}
function wrapEscPos(text, width) {
    const words = text.replace(/\s+/g, ' ').trim().split(' ');
    const lines = [];
    let cur = '';
    for (const word of words) {
        const next = cur ? `${cur} ${word}` : word;
        if (next.length <= width) {
            cur = next;
        }
        else {
            if (cur)
                lines.push(cur);
            cur = word.length > width ? word.slice(0, width) : word;
        }
    }
    if (cur)
        lines.push(cur);
    return lines.length ? lines : [''];
}
function lineaConPrecio(etiqueta, precio, width) {
    if (!etiqueta.trim()) {
        return precio.padStart(width);
    }
    const gap = width - etiqueta.length - precio.length;
    if (gap >= 1) {
        return etiqueta + ' '.repeat(gap) + precio;
    }
    return `${etiqueta.slice(0, Math.max(1, width - precio.length - 1))} ${precio}`;
}
function createEscPosPrinter(charWidth) {
    const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
    const dummyIface = path.join(os.tmpdir(), `pos-escpos-dummy-${process.pid}.bin`);
    return new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: dummyIface,
        characterSet: CharacterSet.WPC1252,
        removeSpecialCharacters: false,
        lineCharacter: '-',
        width: charWidth,
    });
}
async function printEncabezadoRestaurante(printer, charWidth = exports.DEFAULT_ESC_POS_WIDTH) {
    await printer.alignCenter();
    const logoPath = resolveTicketLogoPath();
    let logoOk = false;
    if (logoPath) {
        try {
            const logoBuf = await cargarLogoTicketRedimensionado(logoPath);
            if (logoBuf) {
                await printer.printImageBuffer(logoBuf);
            }
            else if (logoPath.toLowerCase().endsWith('.png')) {
                await printer.printImage(logoPath);
            }
            await printer.newLine();
            logoOk = true;
        }
        catch {
        }
    }
    if (!logoOk) {
        await printer.bold(true);
        await printer.println((0, restaurant_branding_1.restaurantName)().toUpperCase());
        await printer.bold(false);
    }
    if (ticketTelefono()) {
        for (const line of wrapEscPos(`Tel: ${ticketTelefono()}`, charWidth)) {
            await printer.println(line);
        }
    }
    if (ticketDireccion()) {
        for (const line of wrapEscPos(ticketDireccion(), charWidth)) {
            await printer.println(line);
        }
    }
    await printer.newLine();
}
exports.printEncabezadoDrewRest = printEncabezadoRestaurante;
function bufferFromPrinter(printer) {
    const buf = printer.getBuffer();
    return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
}
//# sourceMappingURL=escpos-utils.js.map