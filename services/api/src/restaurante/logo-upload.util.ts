import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';
import { resolveImagesDir } from '../common/restaurant-branding';

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const LOGO_BASENAMES = ['logo.png', 'logo.jpg', 'logo.jpeg', 'logo.webp'] as const;

function inferirMimeLogo(mime: string, originalName?: string): string {
  const normalized = mime?.toLowerCase().split(';')[0]?.trim() ?? '';
  if (MIME_TO_EXT[normalized]) return normalized;

  const ext = path.extname(originalName ?? '').toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return '';
}

export function mimeFromLogoPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'image/png';
}

export function guardarArchivoLogoRestaurante(
  buffer: Buffer,
  mime: string,
  originalName?: string,
): { archivo: string; ruta: string } {
  if (!buffer?.length) {
    throw new BadRequestException('El archivo está vacío');
  }
  if (buffer.length > MAX_LOGO_BYTES) {
    throw new BadRequestException('El logo no puede superar 5 MB');
  }

  const normalizedMime = inferirMimeLogo(mime, originalName);
  const ext = MIME_TO_EXT[normalizedMime];
  if (!ext) {
    throw new BadRequestException(
      'Formato no admitido. Usa PNG, JPEG o WebP.',
    );
  }

  const dir = resolveImagesDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const archivo = `logo.${ext}`;
  const ruta = path.join(dir, archivo);
  fs.writeFileSync(ruta, buffer);

  for (const old of LOGO_BASENAMES) {
    if (old === archivo) continue;
    try {
      fs.unlinkSync(path.join(dir, old));
    } catch {
      /* ignore */
    }
  }

  return { archivo, ruta };
}

/** Quita logos del restaurante en la carpeta de imágenes del despliegue. */
export function eliminarLogoRestaurante(): void {
  const dir = resolveImagesDir();
  for (const name of LOGO_BASENAMES) {
    try {
      fs.unlinkSync(path.join(dir, name));
    } catch {
      /* ignore */
    }
  }
}

/** Copia el logo DrewRest de fábrica del API a la carpeta de despliegue. */
export function copiarLogoFabricaRestaurante(): string | null {
  const bundled = path.join(__dirname, '..', '..', 'images', 'logo.png');
  if (!fs.existsSync(bundled)) return null;

  const dir = resolveImagesDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  eliminarLogoRestaurante();
  const dest = path.join(dir, 'logo.png');
  fs.copyFileSync(bundled, dest);
  return 'logo.png';
}
