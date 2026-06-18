const DOMINIO_MESERO = '@lareserva.local';

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
  return `${usuarioLocalDesdeNombre(nombre)}${sufijo}${DOMINIO_MESERO}`;
}
