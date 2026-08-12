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
exports.printEncabezadoDrewRest = exports.DREWTECH_CREDITO_LINEA = exports.DEFAULT_ESC_POS_WIDTH = exports.DREWTECH_TELEFONO_LABEL = exports.DREWTECH_TELEFONO = void 0;
exports.resolveEscPosTicketOpts = resolveEscPosTicketOpts;
exports.applyEscPosFontSize = applyEscPosFontSize;
exports.applyEscPosBeep = applyEscPosBeep;
exports.applyEscPosTicketStart = applyEscPosTicketStart;
exports.applyEscPosTicketEnd = applyEscPosTicketEnd;
exports.ticketNombreLocal = ticketNombreLocal;
exports.ticketTelefono = ticketTelefono;
exports.ticketDireccion = ticketDireccion;
exports.ticketNit = ticketNit;
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
const drewtech_soporte_1 = require("@drewrest/shared-domain/drewtech-soporte");
Object.defineProperty(exports, "DREWTECH_TELEFONO", { enumerable: true, get: function () { return drewtech_soporte_1.DREWTECH_TELEFONO; } });
Object.defineProperty(exports, "DREWTECH_TELEFONO_LABEL", { enumerable: true, get: function () { return drewtech_soporte_1.DREWTECH_TELEFONO_LABEL; } });
const restaurant_branding_1 = require("../common/restaurant-branding");
const visual_assets_util_1 = require("../visual/visual-assets.util");
const impresora_papel_ancho_1 = require("../impresoras-pos/impresora-papel-ancho");
exports.DEFAULT_ESC_POS_WIDTH = 32;
function resolveEscPosTicketOpts(charWidthOrOpts = exports.DEFAULT_ESC_POS_WIDTH) {
    if (typeof charWidthOrOpts === 'number') {
        return {
            charWidth: charWidthOrOpts,
            tamanoFuente: 1,
            margenInicioLineas: 0,
            margenFinLineas: 0,
        };
    }
    const tamano = (0, impresora_papel_ancho_1.normalizarTamanoFuente)(charWidthOrOpts.tamanoFuente, 1);
    let charWidth = Math.round(Number(charWidthOrOpts.charWidth) || exports.DEFAULT_ESC_POS_WIDTH);
    if (tamano <= 0) {
        const factor = (0, impresora_papel_ancho_1.factorColumnasPorTamanoFuente)(tamano);
        charWidth = Math.min(56, Math.max(24, Math.round(charWidth * factor)));
    }
    if (tamano >= 3) {
        charWidth = Math.max(16, Math.floor(charWidth / 2));
    }
    return {
        charWidth,
        tamanoFuente: tamano,
        margenInicioLineas: Math.min(20, Math.max(0, Math.round(Number(charWidthOrOpts.margenInicioLineas) || 0))),
        margenFinLineas: Math.min(20, Math.max(0, Math.round(Number(charWidthOrOpts.margenFinLineas) || 0))),
    };
}
async function applyEscPosFontSize(printer, tamanoFuente) {
    const t = (0, impresora_papel_ancho_1.normalizarTamanoFuente)(tamanoFuente, 1);
    if (t <= 0) {
        if (typeof printer.setTypeFontB === 'function') {
            await printer.setTypeFontB();
        }
        if (typeof printer.setTextNormal === 'function') {
            await printer.setTextNormal();
        }
        return;
    }
    if (typeof printer.setTypeFontA === 'function') {
        await printer.setTypeFontA();
    }
    if (t >= 3 && typeof printer.setTextQuadArea === 'function') {
        await printer.setTextQuadArea();
        return;
    }
    if (t >= 2 && typeof printer.setTextDoubleHeight === 'function') {
        await printer.setTextDoubleHeight();
        return;
    }
    if (typeof printer.setTextNormal === 'function') {
        await printer.setTextNormal();
    }
}
function beepEscPosHabilitado() {
    const raw = String(process.env.PRINTER_BEEP ?? '1').trim().toLowerCase();
    return raw !== '0' && raw !== 'false' && raw !== 'off' && raw !== 'no';
}
function beepEscPosParams() {
    const times = Math.min(9, Math.max(1, Math.round(Number(process.env.PRINTER_BEEP_TIMES) || 2)));
    const length = Math.min(9, Math.max(1, Math.round(Number(process.env.PRINTER_BEEP_LENGTH) || 2)));
    return { times, length };
}
async function applyEscPosBeep(printer) {
    if (!beepEscPosHabilitado())
        return;
    if (typeof printer.beep !== 'function')
        return;
    const { times, length } = beepEscPosParams();
    try {
        await printer.beep(times, length);
    }
    catch {
    }
}
async function applyEscPosTicketStart(printer, opts) {
    await applyEscPosBeep(printer);
    for (let i = 0; i < opts.margenInicioLineas; i++) {
        await printer.newLine();
    }
    await applyEscPosFontSize(printer, opts.tamanoFuente);
}
async function applyEscPosTicketEnd(printer, opts) {
    if (typeof printer.setTextNormal === 'function') {
        await printer.setTextNormal();
    }
    for (let i = 0; i < opts.margenFinLineas; i++) {
        await printer.newLine();
    }
    await printer.cut();
}
function ticketNombreLocal() {
    return (0, restaurant_branding_1.restaurantName)();
}
function ticketTelefono() {
    return (0, restaurant_branding_1.restaurantTicketPhone)();
}
function ticketDireccion() {
    return (0, restaurant_branding_1.restaurantTicketAddress)();
}
function ticketNit() {
    return (0, restaurant_branding_1.restaurantTicketNit)();
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
const LOGO_TICKET_CACHE_TTL_MS = 30 * 60 * 1000;
const logoTicketCache = new Map();
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
async function cargarLogoTicketRedimensionado(sourcePath, maxWidthPx = TICKET_LOGO_ANCHO_PX) {
    const cacheKey = `${sourcePath}|${maxWidthPx}`;
    const hit = logoTicketCache.get(cacheKey);
    if (hit && Date.now() - hit.at < LOGO_TICKET_CACHE_TTL_MS) {
        return hit.buf;
    }
    try {
        const { leerImagenComoPngBuffer } = await Promise.resolve().then(() => __importStar(require('../visual/image-png.util')));
        const pngBuf = await leerImagenComoPngBuffer(sourcePath);
        const buf = redimensionarPngBuffer(pngBuf, maxWidthPx, TICKET_LOGO_MAX_ALTO_PX);
        logoTicketCache.set(cacheKey, { buf, at: Date.now() });
        return buf;
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
async function ticketLogoPngBufferForPreview(charWidth = exports.DEFAULT_ESC_POS_WIDTH) {
    const logoPath = resolveTicketLogoPath();
    if (!logoPath)
        return null;
    const maxW = (0, impresora_papel_ancho_1.logoAnchoPxParaPapelMm)((0, impresora_papel_ancho_1.papelMmDesdeChars)(charWidth));
    return cargarLogoTicketRedimensionado(logoPath, maxW);
}
async function printPieDrewTechFactura(printer, charWidth = exports.DEFAULT_ESC_POS_WIDTH) {
    if (!(0, restaurant_branding_1.restaurantMostrarCreditoDrewTech)())
        return;
    await printer.alignCenter();
    await printer.newLine();
    for (const line of wrapEscPos(exports.DREWTECH_CREDITO_LINEA, charWidth)) {
        await printer.println(line);
    }
    await printer.println(drewtech_soporte_1.DREWTECH_TELEFONO_LABEL);
}
function formatCopEscPos(value) {
    const n = Math.round(Number(value) || 0);
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    const grouped = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${sign}$${grouped}`;
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
    const w = Math.max(8, Math.floor(Number(width) || exports.DEFAULT_ESC_POS_WIDTH));
    const p = precio.length > w ? precio.slice(precio.length - w) : precio;
    if (!etiqueta.trim()) {
        return p.padStart(w);
    }
    const maxLeft = w - p.length - 1;
    if (maxLeft < 1) {
        return p.padStart(w);
    }
    const left = etiqueta.length <= maxLeft ? etiqueta : etiqueta.slice(0, maxLeft);
    const gap = w - left.length - p.length;
    return left + ' '.repeat(Math.max(1, gap)) + p;
}
function createEscPosPrinter(charWidth) {
    const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine, } = require('node-thermal-printer');
    const dummyIface = path.join(os.tmpdir(), `pos-escpos-dummy-${process.pid}.bin`);
    return new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: dummyIface,
        characterSet: CharacterSet.WPC1252,
        removeSpecialCharacters: false,
        lineCharacter: '-',
        width: charWidth,
        breakLine: BreakLine.NONE,
    });
}
async function printEncabezadoRestaurante(printer, charWidth = exports.DEFAULT_ESC_POS_WIDTH) {
    await printer.alignCenter();
    const logoPath = resolveTicketLogoPath();
    const logoMaxW = (0, impresora_papel_ancho_1.logoAnchoPxParaPapelMm)((0, impresora_papel_ancho_1.papelMmDesdeChars)(charWidth));
    let logoOk = false;
    if (logoPath) {
        try {
            const logoBuf = await cargarLogoTicketRedimensionado(logoPath, logoMaxW);
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
    if (ticketNit()) {
        for (const line of wrapEscPos(`NIT: ${ticketNit()}`, charWidth)) {
            await printer.println(line);
        }
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