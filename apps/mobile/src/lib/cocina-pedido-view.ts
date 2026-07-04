import type { DetalleCocinaLike, PedidoCocinaLike } from '@la-reserva/shared-domain/cocina-vista';

export type { DetalleCocinaLike };

export type DetalleCocinaView = DetalleCocinaLike & {
  id_producto?: number;
  id_detalle_padre?: number | null;
  nombre_producto: string;
  nota_cocina: string | null;
  categoria_nombre: string;
  personalizaciones: { id_opcion?: number; descripcion: string; tipo: string }[];
};

export type PedidoCocinaView = Omit<PedidoCocinaLike, 'detalles' | 'mesero'> & {
  id_pedido: number;
  id_mesa: number;
  estado: string;
  num_comensales: number;
  creado_en: string;
  mesero?: {
    id: number;
    nombre: string;
    apellido: string;
    rol: string;
  };
  prioridad_cocina: 'alta' | 'baja';
  prioridad_cocina_origen: 'auto' | 'manual';
  prioridad_cocina_auto: 'alta' | 'baja';
  prioridad_cocina_override: 'alta' | 'baja' | null;
  detalles: DetalleCocinaView[];
};

export function normalizarPedidoCocinaView(p: PedidoCocinaView): PedidoCocinaView {
  return {
    ...p,
    prioridad_cocina: p.prioridad_cocina ?? 'alta',
    prioridad_cocina_origen: p.prioridad_cocina_origen ?? 'auto',
    prioridad_cocina_auto: p.prioridad_cocina_auto ?? 'alta',
    prioridad_cocina_override: p.prioridad_cocina_override ?? null,
  };
}

export {
  agruparLineasCocinaVisibles,
  agruparPlatosPendientes,
  detalleCocinaAviso,
  detallePuedeRecogerMesero,
  detalleVisibleEnCocina,
  etiquetaEstadoLineaMesero,
  etiquetaPlatoPendiente,
  mesasActivasDePedidos,
  nombreMeseroPedido,
  ordenarDetallesCocina,
  ordenarDetallesMesero,
  pedidoActivoEnCocina,
  pedidoTieneRecogidaPendiente,
  platosEsperandoRecogida,
  platosPendientesRecogerPedido,
  platosSinEnviarCocina,
  resumenItemsMesero,
  totalPlatosEsperandoRecogida,
  totalPlatosSinEnviarCocina,
  totalEsperandoRecogidaPorTipo,
  mensajeListosParaRecoger,
  mesasEnOrdenDeLlegada,
  ordenarMesasPorCola,
  ordenarPedidosCocinaPorLlegada,
  porcionesVisiblesEnCocina,
  conteoPorTipoEnCocina,
  textoResumenTiposCocina,
  etiquetaTipoLineaCocina,
  tipoLineaCocina,
  type LineaCocinaGrupo,
  type PlatoPendienteResumen,
  type TipoLineaCocina,
} from '@la-reserva/shared-domain/cocina-vista';

export { ordenarPedidosCocina } from '@la-reserva/shared-domain/cocina-prioridad';

function detalleMapById(
  detalles: DetalleCocinaView[],
): Map<number, DetalleCocinaView> {
  return new Map(detalles.map((d) => [d.id_detalle, d]));
}

export { detalleMapById };
