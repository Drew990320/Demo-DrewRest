import * as fs from 'fs';
import * as path from 'path';

/** Logos que la impresora ESC/POS debe poder rasterizar (solo PNG). */
export const LOGO_TIPOS_IMPRESION = new Set(['login', 'factura', 'ticket']);

async function sharpModule(): Promise<typeof import('sharp')> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('sharp') as typeof import('sharp');
}

/** Convierte JPEG/WebP (u otro formato admitido por sharp) a PNG para impresión y almacenamiento. */
export async function normalizarBufferLogoPng(
  buffer: Buffer,
  mime: string,
): Promise<Buffer> {
  const normalized = mime?.toLowerCase().split(';')[0]?.trim() ?? '';
  if (normalized === 'image/png') return buffer;
  const sharp = await sharpModule();
  return sharp(buffer).png().toBuffer();
}

/** Lee un archivo de imagen del disco y devuelve un buffer PNG. */
export async function leerImagenComoPngBuffer(sourcePath: string): Promise<Buffer> {
  const ext = path.extname(sourcePath).toLowerCase();
  if (ext === '.png') {
    return fs.readFileSync(sourcePath);
  }
  const sharp = await sharpModule();
  return sharp(sourcePath).png().toBuffer();
}
