import {
  resolverMesasVirtuales,
  type MesasVirtualesConfig,
} from './mesa-label';

/** Mesas virtuales por defecto: sin línea automática de acompañamiento. */
export { MESA_PARA_LLEVAR_NUMERO as MESA_SIN_LINEA_MAZORCA } from './mesa-label';
export { MESA_PARA_LLEVAR_NUMERO, MESA_MOSTRADOR_NUMERO } from './mesa-label';

export function pedidoUsaLineaMazorca(
  mesaNumero: number,
  mazorcaActiva = false,
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
}): boolean {
  return Boolean(d.es_acompanamiento_mazorca ?? d.esAcompanamientoMazorca);
}
