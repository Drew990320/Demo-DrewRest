export const MESA_FORMA_IDS = [
  'rectangular',
  'redonda',
  'cuadrada',
  'barra',
] as const;

export type MesaFormaId = (typeof MESA_FORMA_IDS)[number];

export const MESA_VISTA_IDS = ['cuadricula', 'compacta', 'lista'] as const;

export type MesaVistaId = (typeof MESA_VISTA_IDS)[number];

export const MESA_FORMA_LABELS: Record<MesaFormaId, string> = {
  rectangular: 'Rectangular',
  redonda: 'Redonda',
  cuadrada: 'Cuadrada',
  barra: 'Barra ancha',
};

export const MESA_FORMA_DESCRIPCION: Record<MesaFormaId, string> = {
  rectangular: 'Tarjeta clásica con esquinas suaves.',
  redonda: 'Círculo compacto, ideal para muchas mesas.',
  cuadrada: 'Cuadrado simétrico, fácil de escanear.',
  barra: 'Pastilla horizontal tipo barra o mostrador.',
};

export const MESA_VISTA_LABELS: Record<MesaVistaId, string> = {
  cuadricula: 'Cuadrícula',
  compacta: 'Compacta',
  lista: 'Lista',
};

export const MESA_VISTA_DESCRIPCION: Record<MesaVistaId, string> = {
  cuadricula: 'Rejilla equilibrada (predeterminado).',
  compacta: 'Más columnas y tarjetas más pequeñas.',
  lista: 'Una mesa por fila con número y estado alineados.',
};

export function esMesaFormaValida(id: string | null | undefined): id is MesaFormaId {
  return (
    typeof id === 'string' &&
    (MESA_FORMA_IDS as readonly string[]).includes(id)
  );
}

export function esMesaVistaValida(id: string | null | undefined): id is MesaVistaId {
  return (
    typeof id === 'string' &&
    (MESA_VISTA_IDS as readonly string[]).includes(id)
  );
}

export function resolverMesaForma(guardado?: string | null): MesaFormaId {
  return esMesaFormaValida(guardado) ? guardado : 'rectangular';
}

export function resolverMesaVista(guardado?: string | null): MesaVistaId {
  return esMesaVistaValida(guardado) ? guardado : 'cuadricula';
}
