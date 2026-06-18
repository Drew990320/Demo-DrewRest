import { Prisma, TipoProteina } from '@prisma/client';
import {
  prioridadAutomaticaDesdeTipos,
  prioridadCocinaEfectiva,
  tipoProteinaResuelto,
} from './cocina-prioridad';

function categoriaEsBebida(nombreCategoria: string): boolean {
  return nombreCategoria.toLowerCase().includes('bebida');
}

function debeMarcarCocina(
  nombreCategoria: string,
  esEmpacable: boolean,
): boolean {
  return !categoriaEsBebida(nombreCategoria) && !esEmpacable;
}

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

export function detallePendienteRecogerMesero(d: {
  marcar_cocina: boolean;
  enviado_cocina?: boolean;
  listo_cocina?: boolean;
  es_bebida?: boolean;
  es_empacable?: boolean;
}): boolean {
  return (
    d.marcar_cocina &&
    Boolean(d.enviado_cocina) &&
    !d.listo_cocina &&
    !d.es_bebida &&
    !d.es_empacable
  );
}

export function pedidoTieneRecogidaPendiente(
  p: ReturnType<typeof serializarPedidoVistaOperativa>,
): boolean {
  return p.detalles.some(detallePendienteRecogerMesero);
}

export function platosPendientesRecogerPedido(
  p: ReturnType<typeof serializarPedidoVistaOperativa>,
): number {
  return p.detalles
    .filter(detallePendienteRecogerMesero)
    .reduce((acc, d) => acc + d.cantidad, 0);
}
