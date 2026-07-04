export type PendienteCobroPedido = {
  id_pedido: number;
  id_mesa: number;
  mesa_numero: number;
  canal: 'mostrador' | 'para_llevar' | 'mesa';
  mesero: string;
};

export type PendientesCobroResumen = {
  total_pedidos: number;
  pedidos_mostrador: number;
  pedidos_para_llevar: number;
  pedidos_en_mesas: number;
  pedidos: PendienteCobroPedido[];
};

export function mensajePendientesCobro(resumen: PendientesCobroResumen): string {
  const n = resumen.total_pedidos;
  if (n === 0) return '';
  const partes: string[] = [];
  if (resumen.pedidos_en_mesas > 0) {
    partes.push(
      `${resumen.pedidos_en_mesas} en mesa${resumen.pedidos_en_mesas === 1 ? '' : 's'}`,
    );
  }
  if (resumen.pedidos_mostrador > 0) {
    partes.push(
      `${resumen.pedidos_mostrador} en mostrador`,
    );
  }
  if (resumen.pedidos_para_llevar > 0) {
    partes.push(
      `${resumen.pedidos_para_llevar} para llevar`,
    );
  }
  const detalle = partes.length > 0 ? ` (${partes.join(', ')})` : '';
  return `Hay ${n} pedido${n === 1 ? '' : 's'} sin cobrar${detalle}, de cualquier mesero.`;
}
