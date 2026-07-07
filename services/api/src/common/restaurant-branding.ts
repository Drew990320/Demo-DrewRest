import * as fs from 'fs';
import * as path from 'path';
import { getCachedConfigRestaurante } from '../restaurante/config-restaurante-cache';

const LOGO_CANDIDATE_NAMES = [
  'logo.png',
  'ticket-logo.png',
  'ticket-logo-source.png',
] as const;

function rowOrNull() {
  return getCachedConfigRestaurante();
}

/** Nombre comercial del restaurante (tickets, correo, app). */
export function restaurantName(): string {
  const row = rowOrNull();
  if (row?.nombreComercial?.trim()) return row.nombreComercial.trim();
  const raw = process.env.RESTAURANT_NAME?.trim();
  return raw || 'Restaurante';
}

export function restaurantTicketPhone(): string {
  const row = rowOrNull();
  if (row?.telefono?.trim()) return row.telefono.trim();
  return process.env.RESTAURANT_TICKET_PHONE?.trim() || '';
}

export function restaurantTicketAddress(): string {
  const row = rowOrNull();
  if (row?.direccion?.trim()) return row.direccion.trim();
  return process.env.RESTAURANT_TICKET_ADDRESS?.trim() || '';
}

/** Dominio para correos internos de staff (sin @). */
export function restaurantEmailDomain(): string {
  const row = rowOrNull();
  if (row?.dominioEmailInterno?.trim()) {
    return row.dominioEmailInterno.trim().replace(/^@/, '');
  }
  const raw = process.env.RESTAURANT_EMAIL_DOMAIN?.trim();
  return raw?.replace(/^@/, '') || 'restaurant.local';
}

export function restaurantEmailSuffix(): string {
  return `@${restaurantEmailDomain()}`;
}

export function restaurantTextoGraciasTicket(): string {
  const row = rowOrNull();
  return row?.textoGraciasTicket?.trim() || 'Gracias por su visita';
}

export function restaurantTextoPropinaTicket(): string {
  const row = rowOrNull();
  return row?.textoPropinaTicket?.trim() || '*** PROPINA VOLUNTARIA ***';
}

export function restaurantTextoAvisoNoDian(): string {
  const row = rowOrNull();
  return (
    row?.textoAvisoNoDian?.trim() ||
    'No constituye factura electrónica DIAN'
  );
}

export function restaurantTextoPieCorreo(): string | null {
  const row = rowOrNull();
  return row?.textoPieCorreo?.trim() || null;
}

export function restaurantPrefijoAsuntoCorreo(): string | null {
  const row = rowOrNull();
  return row?.prefijoAsuntoCorreo?.trim() || null;
}

export function restaurantMostrarCreditoDrewTech(): boolean {
  const row = rowOrNull();
  if (row) return row.mostrarCreditoDrewTech;
  return true;
}

export function restaurantModuloEnvioCorreoActivo(): boolean {
  const row = rowOrNull();
  if (row) return row.moduloEnvioCorreoActivo;
  const env = process.env.MODULO_ENVIO_CORREO_ACTIVO?.trim();
  return env === 'true' || env === '1';
}

export function restaurantModuloResumenDiarioActivo(): boolean {
  const row = rowOrNull();
  if (row) return row.moduloResumenDiarioActivo;
  return true;
}

export function restaurantModuloMeserosOperativosActivo(): boolean {
  const row = rowOrNull();
  if (row) return row.moduloMeserosOperativosActivo;
  return true;
}

export function restaurantModuloInventarioActivo(): boolean {
  const row = rowOrNull();
  if (row) return row.moduloInventarioActivo;
  return false;
}

/** Carpeta `images/` del despliegue (junto al API o en la raíz del monorepo). */
export function resolveImagesDir(): string {
  const envDir = process.env.RESTAURANT_IMAGES_DIR?.trim();
  if (envDir) {
    try {
      if (fs.existsSync(envDir)) return path.resolve(envDir);
    } catch {
      /* ignore */
    }
  }

  const candidates = [
    path.join(process.cwd(), '..', '..', 'Images'),
    path.join(process.cwd(), '..', '..', 'images'),
    path.join(process.cwd(), 'images'),
    path.join(process.cwd(), '..', 'images'),
    path.join(__dirname, '..', '..', 'images'),
    path.join(__dirname, '..', '..', '..', 'images'),
    path.join(__dirname, '..', '..', '..', '..', 'images'),
  ];

  for (const dir of candidates) {
    try {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        return path.resolve(dir);
      }
    } catch {
      /* ignore */
    }
  }

  return path.resolve(process.cwd(), 'images');
}

function logoCandidatesFromConfig(): string[] {
  const row = rowOrNull();
  const configured = row?.logoArchivo?.trim();
  if (configured) return [configured, ...LOGO_CANDIDATE_NAMES];
  return [...LOGO_CANDIDATE_NAMES];
}

export function resolveRestaurantLogoPath(): string | null {
  const dir = resolveImagesDir();
  for (const name of logoCandidatesFromConfig()) {
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

export function restaurantHasLogo(): boolean {
  return resolveRestaurantLogoPath() != null;
}
