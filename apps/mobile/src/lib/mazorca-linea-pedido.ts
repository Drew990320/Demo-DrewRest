import type { EstadoPedido } from './local-api-types';
import {
  NOMBRE_MAZORCA_ACOMPANAMIENTO,
  pedidoUsaLineaMazorca,
} from './mazorca-pedido';

type ProductoRow = {
  id_producto: number;
  nombre: string;
  es_acompanamiento_mazorca?: boolean;
};

type DetalleRow = {
  id_detalle: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  enviado_cocina: boolean;
  listo_para_recoger: boolean;
  listo_cocina: boolean;
  id_detalle_padre: number | null;
  nota_cocina: string | null;
};

type PedidoRow = {
  id_pedido: number;
  num_comensales: number;
  estado: EstadoPedido;
  detalles: DetalleRow[];
};

export function idProductoMazorcaLocal(productos: ProductoRow[]): number | undefined {
  return productos.find(
    (p) =>
      p.es_acompanamiento_mazorca ||
      p.nombre === NOMBRE_MAZORCA_ACOMPANAMIENTO,
  )?.id_producto;
}

function lineasMazorca(pedido: PedidoRow, productoId: number): DetalleRow[] {
  return pedido.detalles.filter((d) => d.id_producto === productoId);
}

function cantidadBloqueada(lineas: DetalleRow[]): number {
  return lineas.reduce(
    (s, l) =>
      s + (l.listo_cocina || l.listo_para_recoger ? l.cantidad : 0),
    0,
  );
}

function cantidadTotal(lineas: DetalleRow[]): number {
  return lineas.reduce((s, l) => s + l.cantidad, 0);
}

export function crearLineaMazorcaInicialLocal(
  pedido: PedidoRow,
  mesaNumero: number,
  productoId: number,
  nextDetalleId: () => number,
): void {
  if (!pedidoUsaLineaMazorca(mesaNumero)) return;
  if (lineasMazorca(pedido, productoId).length > 0) return;
  pedido.detalles.push({
    id_detalle: nextDetalleId(),
    id_producto: productoId,
    cantidad: pedido.num_comensales,
    precio_unitario: 0,
    enviado_cocina: false,
    listo_para_recoger: false,
    listo_cocina: false,
    id_detalle_padre: null,
    nota_cocina: null,
  });
}

export function sincronizarLineaMazorcaLocal(
  pedido: PedidoRow,
  mesaNumero: number,
  productoId: number,
  nextDetalleId: () => number,
): string | null {
  if (!pedidoUsaLineaMazorca(mesaNumero)) {
    pedido.detalles = pedido.detalles.filter((d) => d.id_producto !== productoId);
    return null;
  }
  if (pedido.num_comensales < 1) {
    return 'Debe haber al menos 1 comensal';
  }

  const lineas = lineasMazorca(pedido, productoId);
  const total = cantidadTotal(lineas);
  const bloqueada = cantidadBloqueada(lineas);
  if (pedido.num_comensales < bloqueada) {
    return 'No puedes bajar comensales por debajo de las mazorcas ya listas o entregadas';
  }
  if (total === pedido.num_comensales) return null;

  const enviadoNuevo = pedido.estado === 'en_cocina';

  if (total < pedido.num_comensales) {
    const agregar = pedido.num_comensales - total;
    const editable = lineas.find((l) => !l.listo_cocina && !l.listo_para_recoger);
    if (editable) {
      editable.cantidad += agregar;
      return null;
    }
    pedido.detalles.push({
      id_detalle: nextDetalleId(),
      id_producto: productoId,
      cantidad: agregar,
      precio_unitario: 0,
      enviado_cocina: enviadoNuevo,
      listo_para_recoger: false,
      listo_cocina: false,
      id_detalle_padre: null,
      nota_cocina: null,
    });
    return null;
  }

  let quitar = total - pedido.num_comensales;
  const editables = lineas
    .filter((l) => !l.listo_cocina && !l.listo_para_recoger)
    .sort((a, b) => b.id_detalle - a.id_detalle);

  for (const l of editables) {
    if (quitar <= 0) break;
    const resta = Math.min(quitar, l.cantidad);
    quitar -= resta;
    l.cantidad -= resta;
    if (l.cantidad <= 0) {
      pedido.detalles = pedido.detalles.filter((d) => d.id_detalle !== l.id_detalle);
    }
  }

  if (quitar > 0) {
    return 'No se pudo ajustar comensales: hay mazorcas ya listas o en mesa';
  }
  return null;
}
