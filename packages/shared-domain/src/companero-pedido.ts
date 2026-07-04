export type CompaneroModificaPedidoAccion = 'agregado' | 'quitado' | 'reducido';

export type LineaResumenPedido = {
  nombre_producto: string;
  cantidad: number;
};

export function resumenLineasPedido(lineas: LineaResumenPedido[]): string {
  return lineas.map((l) => `${l.cantidad}× ${l.nombre_producto}`).join(', ');
}

export function tituloCompaneroModificoPedido(
  accion: CompaneroModificaPedidoAccion = 'agregado',
): string {
  if (accion === 'quitado') return 'Quitaron ítems de tu mesa';
  if (accion === 'reducido') return 'Redujeron ítems en tu mesa';
  return 'Tu mesa fue actualizada';
}

export function verboCompaneroModificoPedido(
  accion: CompaneroModificaPedidoAccion = 'agregado',
): string {
  if (accion === 'quitado') return 'quitó';
  if (accion === 'reducido') return 'redujo';
  return 'agregó';
}

export function mensajeCompaneroModificoPedido(
  accion: CompaneroModificaPedidoAccion,
  meseroNombre: string,
  lineas: LineaResumenPedido[],
  lugarMesa: string,
  pedidoId: number,
): string {
  const verbo = verboCompaneroModificoPedido(accion);
  return `${meseroNombre} ${verbo} ${resumenLineasPedido(lineas)} en ${lugarMesa} · pedido #${pedidoId}`;
}
