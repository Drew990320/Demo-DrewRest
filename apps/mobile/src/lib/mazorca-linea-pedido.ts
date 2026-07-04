import type { EstadoPedido } from './local-api-types';
import {
  NOMBRE_MAZORCA_ACOMPANAMIENTO,
  pedidoUsaLineaMazorca,
} from '@la-reserva/shared-domain/mazorca-pedido';
import {
  cantidadLineaMazorcaInicial,
  planificarSyncMazorca,
} from '@la-reserva/shared-domain/mazorca-linea-pedido';

export { NOMBRE_MAZORCA_ACOMPANAMIENTO, pedidoUsaLineaMazorca };

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

export function idProductoMazorcaLocal(
  productos: ProductoRow[],
  idConfigurado?: number | null,
): number | undefined {
  if (idConfigurado != null) {
    const cfg = productos.find((p) => p.id_producto === idConfigurado);
    if (cfg) return cfg.id_producto;
  }
  return productos.find(
    (p) =>
      p.es_acompanamiento_mazorca ||
      p.nombre === NOMBRE_MAZORCA_ACOMPANAMIENTO,
  )?.id_producto;
}

function lineasMazorca(pedido: PedidoRow, productoId: number): DetalleRow[] {
  return pedido.detalles.filter((d) => d.id_producto === productoId);
}

export function crearLineaMazorcaInicialLocal(
  pedido: PedidoRow,
  mesaNumero: number,
  productoId: number,
  nextDetalleId: () => number,
  mazorcaActiva = true,
): void {
  const cantidad = cantidadLineaMazorcaInicial({
    usa_linea_mazorca: pedidoUsaLineaMazorca(mesaNumero, mazorcaActiva),
    ya_tiene_linea: lineasMazorca(pedido, productoId).length > 0,
    num_comensales: pedido.num_comensales,
  });
  if (cantidad == null) return;

  pedido.detalles.push({
    id_detalle: nextDetalleId(),
    id_producto: productoId,
    cantidad,
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
  productoId: number | undefined,
  nextDetalleId: () => number,
  usaLineaMazorca?: boolean,
  mazorcaActiva = true,
): string | null {
  if (productoId == null) return null;
  const lineas = lineasMazorca(pedido, productoId);
  const plan = planificarSyncMazorca({
    usa_linea_mazorca:
      usaLineaMazorca ??
      pedidoUsaLineaMazorca(mesaNumero, mazorcaActiva),
    num_comensales: pedido.num_comensales,
    lineas: lineas.map((l) => ({
      id_detalle: l.id_detalle,
      cantidad: l.cantidad,
      listo_cocina: l.listo_cocina,
      listo_para_recoger: l.listo_para_recoger,
    })),
  });

  switch (plan.tipo) {
    case 'limpiar':
      pedido.detalles = pedido.detalles.filter((d) => d.id_producto !== productoId);
      return null;
    case 'error':
      return plan.mensaje;
    case 'sin_cambios':
      return null;
    case 'subir':
      if (plan.modo === 'editar') {
        const editable = pedido.detalles.find((d) => d.id_detalle === plan.id_detalle);
        if (
          editable?.enviado_cocina &&
          editable.cantidad < plan.nueva_cantidad
        ) {
          const delta = plan.nueva_cantidad - editable.cantidad;
          pedido.detalles.push({
            id_detalle: nextDetalleId(),
            id_producto: productoId,
            cantidad: delta,
            precio_unitario: 0,
            enviado_cocina: false,
            listo_para_recoger: false,
            listo_cocina: false,
            id_detalle_padre: null,
            nota_cocina: null,
          });
          return null;
        }
        if (editable) editable.cantidad = plan.nueva_cantidad;
        return null;
      }
      pedido.detalles.push({
        id_detalle: nextDetalleId(),
        id_producto: productoId,
        cantidad: plan.cantidad,
        precio_unitario: 0,
        enviado_cocina: false,
        listo_para_recoger: false,
        listo_cocina: false,
        id_detalle_padre: null,
        nota_cocina: null,
      });
      return null;
    case 'bajar':
      for (const id of plan.eliminar) {
        pedido.detalles = pedido.detalles.filter((d) => d.id_detalle !== id);
      }
      for (const row of plan.actualizar) {
        const det = pedido.detalles.find((d) => d.id_detalle === row.id_detalle);
        if (det) det.cantidad = row.nueva_cantidad;
      }
      return null;
  }
}
