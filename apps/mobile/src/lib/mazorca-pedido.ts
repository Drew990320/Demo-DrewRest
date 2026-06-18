/** Mesa 98 (para llevar): comensales solo referencia; sin línea de mazorca. */
export const MESA_SIN_LINEA_MAZORCA = 98;

export const NOMBRE_MAZORCA_ACOMPANAMIENTO = 'Mazorca (acompañamiento)';

export function pedidoUsaLineaMazorca(mesaNumero: number): boolean {
  return mesaNumero !== MESA_SIN_LINEA_MAZORCA;
}

/** @deprecated usar pedidoUsaLineaMazorca */
export const pedidoUsaControlMazorcas = pedidoUsaLineaMazorca;

export function esDetalleMazorcaAcompanamiento(d: {
  es_acompanamiento_mazorca?: boolean;
  nombre_producto?: string;
}): boolean {
  return (
    Boolean(d.es_acompanamiento_mazorca) ||
    d.nombre_producto === NOMBRE_MAZORCA_ACOMPANAMIENTO
  );
}
