import { Prisma, TipoProteina } from '@prisma/client';
import {
  categoriaEsBebida,
  debeMarcarCocina,
} from '@la-reserva/shared-domain/cocina-producto';
import {
  detallePendienteRecogerMesero,
  platosPendientesRecogerPedido,
  pedidoTieneRecogidaPendiente,
} from '@la-reserva/shared-domain/cocina-vista';
import {
  prioridadAutomaticaDesdeTipos,
  prioridadCocinaEfectiva,
  tipoProteinaResuelto,
} from './cocina-prioridad';

export {
  detallePendienteRecogerMesero,
  pedidoTieneRecogidaPendiente,
  platosPendientesRecogerPedido,
};

/** Include mínimo para cocina y mis-pedidos (sin precios ni facturas). */
export const pedidoVistaOperativaInclude = {
  mesa: { select: { numero: true } },
  usuario: {
    select: {
      idUsuario: true,
      nombre: true,
      apellido: true,
      rol: { select: { nombre: true } },
    },
  },
  detalles: {
    select: {
      idDetalle: true,
      idProducto: true,
      idDetallePadre: true,
      cantidad: true,
      notaCocina: true,
      enviadoCocina: true,
      listoParaRecoger: true,
      listoCocina: true,
      producto: {
        select: {
          nombre: true,
          esEmpacable: true,
          esAcompanamientoMazorca: true,
          tipoProteina: true,
          categoria: { select: { nombre: true } },
        },
      },
      personalizaciones: {
        select: {
          opcion: {
            select: { idOpcion: true, tipo: true, descripcion: true },
          },
        },
      },
    },
    orderBy: { idDetalle: 'asc' as const },
  },
} as const;

export type PedidoVistaOperativaRow = Prisma.PedidoGetPayload<{
  include: typeof pedidoVistaOperativaInclude;
}>;

/** Serializa pedido para UI operativa (cocina / mesero) sin datos de cobro. */
export function serializarPedidoVistaOperativa(p: PedidoVistaOperativaRow) {
  const tiposEnCocina: TipoProteina[] = [];
  const detalles = p.detalles.map((d) => {
    const cat = d.producto.categoria.nombre;
    const marcar = debeMarcarCocina(cat, d.producto.esEmpacable);
    const tipoProteina = tipoProteinaResuelto(
      d.producto.tipoProteina,
      cat,
      d.producto.nombre,
    );
    if (marcar) {
      tiposEnCocina.push(tipoProteina);
    }
    return {
      id_detalle: d.idDetalle,
      id_producto: d.idProducto,
      id_detalle_padre: d.idDetallePadre,
      nombre_producto: d.producto.nombre,
      categoria_nombre: cat,
      tipo_proteina: tipoProteina,
      es_bebida: categoriaEsBebida(cat),
      es_empacable: d.producto.esEmpacable,
      es_acompanamiento_mazorca: d.producto.esAcompanamientoMazorca,
      marcar_cocina: marcar,
      enviado_cocina: d.enviadoCocina,
      listo_para_recoger: d.listoParaRecoger,
      listo_cocina: d.listoCocina,
      cantidad: d.cantidad,
      nota_cocina: d.notaCocina,
      personalizaciones: d.personalizaciones.map((dp) => ({
        id_opcion: dp.opcion.idOpcion,
        tipo: dp.opcion.tipo,
        descripcion: dp.opcion.descripcion,
      })),
    };
  });
  const prioridadAuto = prioridadAutomaticaDesdeTipos(tiposEnCocina);
  const override = p.prioridadCocinaOverride ?? null;
  const { nivel: prioridadCocina, origen: prioridadCocinaOrigen } =
    prioridadCocinaEfectiva(prioridadAuto, override);

  return {
    id_pedido: p.idPedido,
    id_mesa: p.idMesa,
    mesa_numero: p.mesa.numero,
    estado: p.estado,
    num_comensales: p.numComensales,
    creado_en: p.creadoEn,
    prioridad_cocina: prioridadCocina,
    prioridad_cocina_origen: prioridadCocinaOrigen,
    prioridad_cocina_auto: prioridadAuto,
    prioridad_cocina_override: override === null ? null : override,
    mesero: {
      id: p.usuario.idUsuario,
      nombre: p.usuario.nombre,
      apellido: p.usuario.apellido,
      rol: p.usuario.rol.nombre,
    },
    detalles,
  };
}
