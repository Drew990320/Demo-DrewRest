import * as os from 'os';
import * as path from 'path';
import {
  resolveRestaurantLogoPath,
  restaurantName,
  restaurantTicketAddress,
  restaurantTicketPhone,
  restaurantMostrarCreditoDrewTech,
} from '../common/restaurant-branding';
import { resolverAssetVisualPath } from '../visual/visual-assets.util';

export const DEFAULT_ESC_POS_WIDTH = 32;

export function ticketNombreLocal(): string {
  return restaurantName();
}

export function ticketTelefono(): string {
  return restaurantTicketPhone();
}

export function ticketDireccion(): string {
  return restaurantTicketAddress();
}
/** Ancho del encabezado en puntos (~58 mm ≈ 384 px, ancho útil de la impresora). */
const TICKET_LOGO_ANCHO_PX = (() => {
  const n = Number(process.env.PRINTER_LOGO_WIDTH_PX ?? 384);
  return Number.isFinite(n) && n >= 80 && n <= 576 ? Math.round(n) : 384;
})();
/** Altura máxima del logo en ticket (evita recorte en impresoras de 58 mm). */
const TICKET_LOGO_MAX_ALTO_PX = (() => {
  const n = Number(process.env.PRINTER_LOGO_MAX_HEIGHT_PX ?? 320);
  return Number.isFinite(n) && n >= 40 && n <= 800 ? Math.round(n) : 320;
})();

const FACTURA_LOGO_MAX_ANCHO = 320;
const FACTURA_LOGO_MAX_ALTO = 120;

export function dimensionesLogoContenidas(
  srcW: number,
  srcH: number,
  maxW: number,
  maxH: number,
): { width: number; height: number } {
  if (srcW <= 0 || srcH <= 0) {
    return { width: maxW, height: Math.min(maxH, 72) };
  }
  const scale = Math.min(maxW / srcW, maxH / srcH);
  return {
    width: Math.max(1, Math.round(srcW * scale)),
    height: Math.max(1, Math.round(srcH * scale)),
  };
}

/** Ancho en píxeles múltiplo de 8 (requisito ESC/POS raster). */
function anchoEscPosPx(width: number, maxWidth: number): number {
  const capped = Math.min(width, maxWidth);
  return Math.max(8, Math.floor(capped / 8) * 8);
}

export const DREWTECH_TELEFONO = '3207964367';
export const DREWTECH_TELEFONO_LABEL = 'Tel: 320 796 4367';
export const DREWTECH_CREDITO_LINEA =
  'Sistema interno del restaurante elaborado por DrewTech POS';

/** Subset de pngjs usado para redimensionar el logo del ticket. */
type PngJs = {
  PNG: {
    new (opts: { width: number; height: number }): {
      width: number;
      height: number;
      data: Buffer;
    };
    sync: {
      read: (buffer: Buffer) => { width: number; height: number; data: Buffer };
      write: (png: { width: number; height: number; data: Buffer }) => Buffer;
    };
  };
};

function sampleRgbaBilinear(
  src: { width: number; height: number; data: Buffer },
  fx: number,
  fy: number,
): [number, number, number, number] {
  const x = Math.min(src.width - 1, Math.max(0, fx));
  const y = Math.min(src.height - 1, Math.max(0, fy));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(src.width - 1, x0 + 1);
  const y1 = Math.min(src.height - 1, y0 + 1);
  const dx = x - x0;
  const dy = y - y0;
  const read = (px: number, py: number) => {
    const i = (py * src.width + px) << 2;
    return [
      src.data[i]!,
      src.data[i + 1]!,
      src.data[i + 2]!,
      src.data[i + 3]!,
    ] as const;
  };
  const c00 = read(x0, y0);
  const c10 = read(x1, y0);
  const c01 = read(x0, y1);
  const c11 = read(x1, y1);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  return [
    Math.round(lerp(lerp(c00[0], c10[0], dx), lerp(c01[0], c11[0], dx), dy)),
    Math.round(lerp(lerp(c00[1], c10[1], dx), lerp(c01[1], c11[1], dx), dy)),
    Math.round(lerp(lerp(c00[2], c10[2], dx), lerp(c01[2], c11[2], dx), dy)),
    Math.round(lerp(lerp(c00[3], c10[3], dx), lerp(c01[3], c11[3], dx), dy)),
  ];
}

function redimensionarPngBuffer(
  pngBuffer: Buffer,
  maxWidthPx: number,
  maxHeightPx: number,
): Buffer | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PNG } = require('pngjs') as PngJs;
    const src = PNG.sync.read(pngBuffer);
    const fitted = dimensionesLogoContenidas(
      src.width,
      src.height,
      maxWidthPx,
      maxHeightPx,
    );
    let targetW = anchoEscPosPx(fitted.width, maxWidthPx);
    let targetH = Math.max(
      1,
      Math.round((src.height / src.width) * targetW),
    );
    if (targetH > maxHeightPx) {
      targetH = maxHeightPx;
      targetW = anchoEscPosPx(
        Math.round((src.width / src.height) * targetH),
        maxWidthPx,
      );
    }
    if (targetW <= 0) return null;
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
  } catch {
    return null;
  }
}

async function cargarLogoTicketRedimensionado(
  sourcePath: string,
): Promise<Buffer | null> {
  try {
    const { leerImagenComoPngBuffer } = await import('../visual/image-png.util');
    const pngBuf = await leerImagenComoPngBuffer(sourcePath);
    return redimensionarPngBuffer(
      pngBuf,
      TICKET_LOGO_ANCHO_PX,
      TICKET_LOGO_MAX_ALTO_PX,
    );
  } catch {
    return null;
  }
}

function resolveTicketLogoPath(): string | null {
  return (
    resolverAssetVisualPath('ticket', null) ??
    resolverAssetVisualPath('factura', null) ??
    resolverAssetVisualPath('login', null) ??
    resolveRestaurantLogoPath()
  );
}

/** Crédito DrewTech al pie: solo factura / pre-cuenta que ve el cliente (misma regla que el logo). */
export async function printPieDrewTechFactura(
  printer: EscPosPrinter,
  charWidth = DEFAULT_ESC_POS_WIDTH,
): Promise<void> {
  if (!restaurantMostrarCreditoDrewTech()) return;
  await printer.alignCenter();
  await printer.newLine();
  for (const line of wrapEscPos(DREWTECH_CREDITO_LINEA, charWidth)) {
    await printer.println(line);
  }
  await printer.println(DREWTECH_TELEFONO_LABEL);
}

/** Monto COP solo ASCII (evita ? en impresoras ESC/POS por espacios Unicode). */
export function formatCopEscPos(value: number): string {
  const n = Math.round(Number(value) || 0);
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const grouped = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}$ ${grouped}`;
}

export function wrapEscPos(text: string, width: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (next.length <= width) {
      cur = next;
    } else {
      if (cur) lines.push(cur);
      cur = word.length > width ? word.slice(0, width) : word;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

/** Línea con texto a la izquierda y monto alineado a la derecha (58 mm). */
export function lineaConPrecio(
  etiqueta: string,
  precio: string,
  width: number,
): string {
  if (!etiqueta.trim()) {
    return precio.padStart(width);
  }
  const gap = width - etiqueta.length - precio.length;
  if (gap >= 1) {
    return etiqueta + ' '.repeat(gap) + precio;
  }
  return `${etiqueta.slice(0, Math.max(1, width - precio.length - 1))} ${precio}`;
}

export function createEscPosPrinter(charWidth: number) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ThermalPrinter, PrinterTypes, CharacterSet } = require(
    'node-thermal-printer',
  ) as typeof import('node-thermal-printer');

  const dummyIface =
    process.platform === 'win32'
      ? path.join(os.tmpdir(), 'pos-escpos-dummy.bin')
      : '/dev/null';

  return new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: dummyIface,
    characterSet: CharacterSet.WPC1252,
    removeSpecialCharacters: false,
    lineCharacter: '-',
    width: charWidth,
  });
}

export type EscPosPrinter = ReturnType<typeof createEscPosPrinter>;

/** Logo a ancho completo; solo tickets que ve el cliente (factura / pre-cuenta). */
export async function printEncabezadoRestaurante(
  printer: EscPosPrinter,
  charWidth = DEFAULT_ESC_POS_WIDTH,
): Promise<void> {
  await printer.alignCenter();
  const logoPath = resolveTicketLogoPath();
  let logoOk = false;
  if (logoPath) {
    try {
      const logoBuf = await cargarLogoTicketRedimensionado(logoPath);
      if (logoBuf) {
        await printer.printImageBuffer(logoBuf);
      } else if (logoPath.toLowerCase().endsWith('.png')) {
        await printer.printImage(logoPath);
      }
      await printer.newLine();
      logoOk = true;
    } catch {
      /* sin logo: solo texto */
    }
  }
  if (!logoOk) {
    await printer.bold(true);
    await printer.println(restaurantName().toUpperCase());
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

/** @deprecated Usar printEncabezadoRestaurante */
export const printEncabezadoLaReserva = printEncabezadoRestaurante;

export function bufferFromPrinter(printer: {
  getBuffer: () => Buffer | Uint8Array | string;
}): Buffer {
  const buf = printer.getBuffer();
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
}
