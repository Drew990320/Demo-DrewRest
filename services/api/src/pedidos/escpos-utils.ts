import * as os from 'os';
import * as path from 'path';

export const DEFAULT_ESC_POS_WIDTH = 32;

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

export function bufferFromPrinter(printer: {
  getBuffer: () => Buffer | Uint8Array | string;
}): Buffer {
  const buf = printer.getBuffer();
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
}
