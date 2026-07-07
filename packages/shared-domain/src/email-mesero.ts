const DOMINIO_MESERO_DEFAULT = 'restaurant.local';

function dominioMeseroLocal(): string {
  try {
    const g = globalThis as {
      process?: { env?: Record<string, string | undefined> };
    };
    const raw = g.process?.env?.RESTAURANT_EMAIL_DOMAIN?.trim();
    const domain = raw?.replace(/^@/, '') || DOMINIO_MESERO_DEFAULT;
    return `@${domain}`;
  } catch {
    return `@${DOMINIO_MESERO_DEFAULT}`;
  }
}

/** Primera palabra del nombre → usuario local (sin acentos, minúsculas). */
export function usuarioLocalDesdeNombre(nombre: string): string {
  const primera = nombre.trim().split(/\s+/)[0] ?? '';
  const sinAcentos = primera
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
  const limpio = sinAcentos.replace(/[^a-z0-9]/g, '');
  return limpio || 'mesero';
}

export function emailMeseroDesdeNombre(nombre: string, sufijo = ''): string {
  const local = usuarioLocalDesdeNombre(nombre) + sufijo;
  return `${local}${dominioMeseroLocal()}`;
}

export const DOMINIO_MESERO = dominioMeseroLocal();
