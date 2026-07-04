import {
  resolverMesasVirtuales,
  type MesasVirtualesConfig,
} from './mesa-label';

/** Mesas virtuales por defecto: sin línea automática de mazorca. */
export { MESA_PARA_LLEVAR_NUMERO as MESA_SIN_LINEA_MAZORCA } from './mesa-label';
export { MESA_PARA_LLEVAR_NUMERO, MESA_MOSTRADOR_NUMERO } from './mesa-label';

export const NOMBRE_MAZORCA_ACOMPANAMIENTO = 'Mazorca (acompañamiento)';

/** Alias usado en el API / seed. */
export const NOMBRE_PRODUCTO_MAZORCA = NOMBRE_MAZORCA_ACOMPANAMIENTO;

export function pedidoUsaLineaMazorca(
  mesaNumero: number,
  mazorcaActiva = true,
  mesasVirtuales?: MesasVirtualesConfig | null,
): boolean {
  if (!mazorcaActiva) return false;
  const r = resolverMesasVirtuales(mesasVirtuales);
  return (
    mesaNumero !== r.numero_mesa_para_llevar &&
    mesaNumero !== r.numero_mesa_mostrador
  );
}

export function esMesaSinLineaMazorca(
  mesaNumero: number,
  mesasVirtuales?: MesasVirtualesConfig | null,
): boolean {
  return !pedidoUsaLineaMazorca(mesaNumero, true, mesasVirtuales);
}

export function esDetalleMazorcaAcompanamiento(d: {
  es_acompanamiento_mazorca?: boolean;
  esAcompanamientoMazorca?: boolean;
  nombre_producto?: string;
}): boolean {
  return (
    Boolean(d.es_acompanamiento_mazorca ?? d.esAcompanamientoMazorca) ||
    d.nombre_producto === NOMBRE_MAZORCA_ACOMPANAMIENTO
  );
}
