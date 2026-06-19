import { MESA_MOSTRADOR_NUMERO, MESA_PARA_LLEVAR_NUMERO } from './mesa-label';

/** Mesas 98 (para llevar) y 99 (mostrador): sin línea automática de mazorca. */
export { MESA_PARA_LLEVAR_NUMERO as MESA_SIN_LINEA_MAZORCA } from './mesa-label';

export const NOMBRE_MAZORCA_ACOMPANAMIENTO = 'Mazorca (acompañamiento)';

/** Alias usado en el API / seed. */
export const NOMBRE_PRODUCTO_MAZORCA = NOMBRE_MAZORCA_ACOMPANAMIENTO;

export function pedidoUsaLineaMazorca(mesaNumero: number): boolean {
  return (
    mesaNumero !== MESA_PARA_LLEVAR_NUMERO &&
    mesaNumero !== MESA_MOSTRADOR_NUMERO
  );
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
