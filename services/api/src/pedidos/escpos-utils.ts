import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const DEFAULT_ESC_POS_WIDTH = 32;
export const TICKET_NOMBRE_LOCAL = 'LA RESERVA';
/** Ancho del encabezado en puntos (~58 mm ≈ 384 px, ancho útil de la impresora). */
const TICKET_LOGO_ANCHO_PX = (() => {
  const n = Number(process.env.PRINTER_LOGO_WIDTH_PX ?? 384);
  return Number.isFinite(n) && n >= 80 && n <= 384 ? Math.round(n) : 384;
})();
/** Altura del encabezado como fracción de la proporción original (1 = sin aplastar). */
const TICKET_LOGO_ALTO_FRACCION = (() => {
  const n = Number(process.env.PRINTER_LOGO_HEIGHT_FRAC ?? 0.55);
  return Number.isFinite(n) && n > 0 && n <= 1 ? n : 0.55;
})();

export const DREWTECH_TELEFONO = '3207964367';
export const DREWTECH_TELEFONO_LABEL = 'Tel: 320 796 4367';
export const DREWTECH_CREDITO_LINEA =
  'Sistema del restaurante elaborado por DrewTech';

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

function cargarPngRedimensionado(
  sourcePath: string | null,
  targetWidthPx: number,
  heightScale = 1,
): Buffer | null {
  if (!sourcePath) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PNG } = require('pngjs') as PngJs;
    const src = PNG.sync.read(fs.readFileSync(sourcePath));
    const targetW = Math.min(targetWidthPx, src.width);
    if (targetW <= 0) return null;
    const proportionalH = Math.max(
      1,
      Math.round((src.height * targetW) / src.width),
    );
    const targetH = Math.max(1, Math.round(proportionalH * heightScale));
    if (targetW === src.width && targetH === src.height) {
      return fs.readFileSync(sourcePath);
    }
    const dst = new PNG({ width: targetW, height: targetH });
    for (let y = 0; y < targetH; y++) {
      const sy = Math.min(src.height - 1, Math.floor((y * src.height) / targetH));
      for (let x = 0; x < targetW; x++) {
        const sx = Math.min(src.width - 1, Math.floor((x * src.width) / targetW));
        const si = (sy * src.width + sx) << 2;
        const di = (y * targetW + x) << 2;
        dst.data[di] = src.data[si]!;
        dst.data[di + 1] = src.data[si + 1]!;
        dst.data[di + 2] = src.data[si + 2]!;
        dst.data[di + 3] = src.data[si + 3]!;
      }
    }
    return PNG.sync.write(dst);
  } catch {
    return null;
  }
}

function cargarLogoTicketRedimensionado(sourcePath: string): Buffer | null {
  return cargarPngRedimensionado(
    sourcePath,
    TICKET_LOGO_ANCHO_PX,
    TICKET_LOGO_ALTO_FRACCION,
  );
}

function resolveAssetPath(filename: string): string | null {
  const rel = path.join('assets', filename);
  const candidates = [
    path.join(process.cwd(), rel),
    path.join(__dirname, rel),
    path.join(__dirname, '..', '..', rel),
    path.join(__dirname, '..', '..', 'assets', filename),
    path.join(__dirname, '..', '..', filename),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function resolveTicketLogoPath(): string | null {
  return (
    resolveAssetPath('ticket-logo-source.png') ??
    resolveAssetPath('ticket-logo.png') ??
    (() => {
      const fallback = path.join(
        process.cwd(),
        '..',
        '..',
        'apps',
        'mobile',
        'assets',
        'logo.png',
      );
      return fs.existsSync(fallback) ? fallback : null;
    })()
  );
}

/** Crédito DrewTech: solo en factura/recibo que se lleva el cliente. */
export async function printPieDrewTechFactura(
  printer: EscPosPrinter,
  charWidth = DEFAULT_ESC_POS_WIDTH,
): Promise<void> {
  await printer.alignCenter();
  await printer.newLine();
  for (const line of wrapEscPos(DREWTECH_CREDITO_LINEA, charWidth)) {
    await printer.println(line);
  }
  await printer.println(DREWTECH_TELEFONO_LABEL);
}

export function formatCopEscPos(value: number): string {
  const n = Math.round(Number(value) || 0);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
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
      ? path.join(os.tmpdir(), 'lareserva-escpos-dummy.bin')
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

/** Logo del login centrado; si no hay imagen, solo el nombre en texto. */
export async function printEncabezadoLaReserva(
  printer: EscPosPrinter,
): Promise<void> {
  await printer.alignCenter();
  const logoPath = resolveTicketLogoPath();
  let logoOk = false;
  if (logoPath) {
    try {
      const logoBuf = cargarLogoTicketRedimensionado(logoPath);
      if (logoBuf) {
        await printer.printImageBuffer(logoBuf);
      } else {
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
    await printer.println(TICKET_NOMBRE_LOCAL);
    await printer.bold(false);
  }
}

export function bufferFromPrinter(printer: {
  getBuffer: () => Buffer | Uint8Array | string;
}): Buffer {
  const buf = printer.getBuffer();
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
}
