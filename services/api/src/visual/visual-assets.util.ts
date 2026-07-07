import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';
import { resolveImagesDir } from '../common/restaurant-branding';
import { mimeFromLogoPath } from '../restaurante/logo-upload.util';
import { invalidateAssetFileCache } from './asset-file-cache';

export type VisualAssetTipo =
  | 'login'
  | 'factura'
  | 'ticket'
  | 'favicon'
  | 'navbar-fondo';

const ASSET_BASENAMES: Record<VisualAssetTipo, string[]> = {
  login: ['logo-login.png', 'logo-login.jpg', 'logo-login.webp'],
  factura: ['logo-factura.png', 'logo-factura.jpg', 'logo-factura.webp'],
  ticket: ['logo-ticket.png', 'logo-ticket.jpg', 'logo-ticket.webp'],
  favicon: ['favicon.png', 'favicon.ico', 'favicon.webp'],
  'navbar-fondo': [
    'navbar-fondo.png',
    'navbar-fondo.jpg',
    'navbar-fondo.webp',
  ],
};

const ASSET_OUTPUT: Record<VisualAssetTipo, string> = {
  login: 'logo-login',
  factura: 'logo-factura',
  ticket: 'logo-ticket',
  favicon: 'favicon',
  'navbar-fondo': 'navbar-fondo',
};

const MAX_ASSET_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
};

function inferirMimeAsset(mime: string, originalName?: string): string {
  const normalized = mime?.toLowerCase().split(';')[0]?.trim() ?? '';
  if (MIME_TO_EXT[normalized]) return normalized;
  const ext = path.extname(originalName ?? '').toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.ico') return 'image/x-icon';
  return '';
}

export function guardarAssetVisual(
  tipo: VisualAssetTipo,
  buffer: Buffer,
  mime: string,
  originalName?: string,
): { archivo: string; ruta: string } {
  if (!buffer?.length) {
    throw new BadRequestException('El archivo está vacío');
  }
  if (buffer.length > MAX_ASSET_BYTES) {
    throw new BadRequestException('El archivo no puede superar 5 MB');
  }

  const normalizedMime = inferirMimeAsset(mime, originalName);
  const ext = MIME_TO_EXT[normalizedMime];
  if (!ext) {
    throw new BadRequestException(
      'Formato no admitido. Usa PNG, JPEG, WebP o ICO (favicon).',
    );
  }

  const dir = resolveImagesDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const archivo = `${ASSET_OUTPUT[tipo]}.${ext}`;
  const ruta = path.join(dir, archivo);
  fs.writeFileSync(ruta, buffer);

  for (const old of ASSET_BASENAMES[tipo]) {
    if (old === archivo) continue;
    try {
      fs.unlinkSync(path.join(dir, old));
    } catch {
      /* ignore */
    }
  }

  return { archivo, ruta };
}

/** Limpia caché en memoria de todas las variantes de extensión de un asset. */
export function invalidarCacheAssetsTipo(tipo: VisualAssetTipo): void {
  const dir = resolveImagesDir();
  for (const name of ASSET_BASENAMES[tipo]) {
    invalidateAssetFileCache(path.join(dir, name));
  }
}

/** Solo archivos registrados en config (evita huérfanos en disco). */
export function assetVisualConfigurado(
  archivoConfigurado?: string | null,
): string | null {
  const archivo = archivoConfigurado?.trim();
  if (!archivo) return null;
  const full = path.join(resolveImagesDir(), archivo);
  try {
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  } catch {
    /* ignore */
  }
  return null;
}

export function resolverAssetVisualPath(
  tipo: VisualAssetTipo,
  archivoConfigurado?: string | null,
): string | null {
  const dir = resolveImagesDir();
  const candidatos = [
    ...(archivoConfigurado?.trim() ? [archivoConfigurado.trim()] : []),
    ...ASSET_BASENAMES[tipo],
  ];
  for (const name of candidatos) {
    const full = path.join(dir, name);
    try {
      if (fs.existsSync(full) && fs.statSync(full).isFile()) {
        return full;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function mimeFromAssetPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.ico') return 'image/x-icon';
  return mimeFromLogoPath(filePath);
}

export function campoArchivoPorTipo(tipo: VisualAssetTipo): string {
  switch (tipo) {
    case 'login':
      return 'logoLoginArchivo';
    case 'factura':
      return 'logoFacturaArchivo';
    case 'ticket':
      return 'logoTicketArchivo';
    case 'favicon':
      return 'faviconArchivo';
    case 'navbar-fondo':
      return 'navbarFondoArchivo';
  }
}

/** Elimina del disco los archivos de logos e imágenes visuales. */
export function eliminarTodosAssetsVisuales(): void {
  const dir = resolveImagesDir();
  const vistos = new Set<string>();
  for (const basenames of Object.values(ASSET_BASENAMES)) {
    for (const name of basenames) {
      if (vistos.has(name)) continue;
      vistos.add(name);
      try {
        fs.unlinkSync(path.join(dir, name));
      } catch {
        /* ignore */
      }
    }
  }
}
