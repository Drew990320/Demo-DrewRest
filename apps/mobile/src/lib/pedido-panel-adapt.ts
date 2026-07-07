import type { PedidoCocinaView } from './cocina-pedido-view';
import type { PedidoVirtualDetalle } from '../components/PanelPedidoVirtualActivo';

/** Vista resumida de mis-activos → panel (sin esperar GET /pedidos/:id). */
export function pedidoCocinaAPanel(p: PedidoCocinaView): PedidoVirtualDetalle {
  return {
    id_pedido: p.id_pedido,
    creado_en: p.creado_en,
    estado: p.estado,
    modo_servicio: p.modo_servicio,
    detalles: p.detalles.map((d) => ({
      id_detalle: d.id_detalle,
      id_detalle_padre: d.id_detalle_padre ?? null,
      nombre_producto: d.nombre_producto ?? 'Ítem',
      cantidad: d.cantidad,
      subtotal_linea: 0,
      nota_cocina: d.nota_cocina ?? null,
      marcar_cocina: d.marcar_cocina,
      enviado_cocina: d.enviado_cocina,
      es_acompanamiento_mazorca: d.es_acompanamiento_mazorca,
      es_empacable: d.es_empacable,
      es_plato_principal: d.es_plato_principal,
      categoria_nombre: d.categoria_nombre,
      personalizaciones: (d.personalizaciones ?? []).map((x) => ({
        descripcion: x.descripcion,
      })),
    })),
  };
}
