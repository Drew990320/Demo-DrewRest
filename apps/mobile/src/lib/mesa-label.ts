/**
 * Texto para mostrar en UI en lugar del número de mesa (mesas virtuales).
 */
export function tituloLugarMesa(numero: number): string {
  if (numero === 98) return 'Pedidos para llevar';
  if (numero === 99) return 'Mostrador';
  return `Mesa ${numero}`;
}

/** Solo el número o etiqueta corta para la grilla de mesas (mismas virtuales que `tituloLugarMesa`). */
export function etiquetaMesaNumero(numero: number): string {
  if (numero === 98) return 'Pedidos para llevar';
  if (numero === 99) return 'Mostrador';
  return String(numero);
}
