/** Mesa virtual para pedidos para llevar (no mesas 1–15). */
export const MESA_PARA_LLEVAR_NUMERO = 98;

/** Mesa virtual para ventas en mostrador. */
export const MESA_MOSTRADOR_NUMERO = 99;

export function esMesaVirtualNumero(numero: number): boolean {
  return (
    numero === MESA_PARA_LLEVAR_NUMERO || numero === MESA_MOSTRADOR_NUMERO
  );
}

/** Texto para UI (pantallas de mesero/cocina). */
export function tituloLugarMesa(numero: number): string {
  if (numero === MESA_PARA_LLEVAR_NUMERO) return 'Pedidos para llevar';
  if (numero === MESA_MOSTRADOR_NUMERO) return 'Mostrador';
  return `Mesa ${numero}`;
}

/** Etiqueta corta para la grilla de mesas. */
export function etiquetaMesaNumero(numero: number): string {
  if (numero === MESA_PARA_LLEVAR_NUMERO) return 'Pedidos para llevar';
  if (numero === MESA_MOSTRADOR_NUMERO) return 'Mostrador';
  return String(numero);
}

/** Etiqueta en ticket de comanda impreso (más breve). */
export function etiquetaMesaComanda(numero: number): string {
  if (numero === MESA_PARA_LLEVAR_NUMERO) return 'Para llevar';
  if (numero === MESA_MOSTRADOR_NUMERO) return 'Mostrador';
  return `Mesa ${numero}`;
}

/** Título en admin de mesas (mesas virtuales con descripción entre paréntesis). */
export function tituloMesaAdmin(numero: number): string {
  if (numero === MESA_PARA_LLEVAR_NUMERO) {
    return 'Mesa 98 (Pedidos para llevar)';
  }
  if (numero === MESA_MOSTRADOR_NUMERO) {
    return 'Mesa 99 (Mostrador)';
  }
  return `Mesa ${numero}`;
}
