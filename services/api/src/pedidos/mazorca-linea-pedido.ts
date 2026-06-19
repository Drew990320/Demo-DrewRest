import { BadRequestException } from '@nestjs/common';
import type { EstadoPedido, Prisma } from '@prisma/client';
import {
  NOMBRE_PRODUCTO_MAZORCA,
  pedidoUsaLineaMazorca,
  esDetalleMazorcaAcompanamiento,
} from '@la-reserva/shared-domain/mazorca-pedido';
import {
  cantidadLineaMazorcaInicial,
  planificarSyncMazorca,
  type LineaMazorcaSync,
} from '@la-reserva/shared-domain/mazorca-linea-pedido';

export {
  NOMBRE_PRODUCTO_MAZORCA,
  pedidoUsaLineaMazorca,
  esDetalleMazorcaAcompanamiento,
};

let cachedMazorcaProductId: number | null = null;

export async function idProductoMazorcaAcompanamiento(
  prisma: Pick<Prisma.TransactionClient, 'producto'>,
): Promise<number> {
  if (cachedMazorcaProductId != null) {
    return cachedMazorcaProductId;
  }
  const p = await prisma.producto.findFirst({
    where: { nombre: NOMBRE_PRODUCTO_MAZORCA, activo: true },
    select: { idProducto: true },
  });
  if (!p) {
    throw new BadRequestException(
      'Producto de mazorca (acompañamiento) no configurado en el sistema',
    );
  }
  cachedMazorcaProductId = p.idProducto;
  return p.idProducto;
}

function toLineasSync(
  lineas: {
    idDetalle: number;
    cantidad: number;
    listoCocina: boolean;
    listoParaRecoger: boolean;
  }[],
): LineaMazorcaSync[] {
  return lineas.map((l) => ({
    id_detalle: l.idDetalle,
    cantidad: l.cantidad,
    listo_cocina: l.listoCocina,
    listo_para_recoger: l.listoParaRecoger,
  }));
}

/** Sincroniza la línea automática de mazorca con el número de comensales. */
export async function sincronizarLineaMazorcaAcompanamiento(
  tx: Prisma.TransactionClient,
  params: {
    idPedido: number;
    numComensales: number;
    mesaNumero: number;
    estadoPedido: EstadoPedido;
    /** Si no se indica, depende del número de mesa (no en 98/99). */
    usaLineaMazorca?: boolean;
  },
): Promise<void> {
  const productoId = await idProductoMazorcaAcompanamiento(tx);

  const lineas = await tx.detallePedido.findMany({
    where: { idPedido: params.idPedido, idProducto: productoId },
    orderBy: { idDetalle: 'asc' },
    select: {
      idDetalle: true,
      cantidad: true,
      enviadoCocina: true,
      listoParaRecoger: true,
      listoCocina: true,
    },
  });

  const usaLinea =
    params.usaLineaMazorca ?? pedidoUsaLineaMazorca(params.mesaNumero);

  const plan = planificarSyncMazorca({
    usa_linea_mazorca: usaLinea,
    num_comensales: params.numComensales,
    lineas: toLineasSync(lineas),
  });

  switch (plan.tipo) {
    case 'limpiar':
      await tx.detallePedido.deleteMany({
        where: { idPedido: params.idPedido, idProducto: productoId },
      });
      return;
    case 'error':
      throw new BadRequestException(plan.mensaje);
    case 'sin_cambios':
      return;
    case 'subir':
      if (plan.modo === 'editar') {
        const linea = lineas.find((l) => l.idDetalle === plan.id_detalle);
        if (
          linea?.enviadoCocina &&
          plan.nueva_cantidad > linea.cantidad
        ) {
          const delta = plan.nueva_cantidad - linea.cantidad;
          await tx.detallePedido.create({
            data: {
              idPedido: params.idPedido,
              idProducto: productoId,
              cantidad: delta,
              precioUnitario: 0,
              enviadoCocina: false,
            },
          });
          return;
        }
        await tx.detallePedido.update({
          where: { idDetalle: plan.id_detalle },
          data: { cantidad: plan.nueva_cantidad },
        });
        return;
      }
      await tx.detallePedido.create({
        data: {
          idPedido: params.idPedido,
          idProducto: productoId,
          cantidad: plan.cantidad,
          precioUnitario: 0,
          enviadoCocina: false,
        },
      });
      return;
    case 'bajar':
      for (const id of plan.eliminar) {
        await tx.detallePedido.delete({ where: { idDetalle: id } });
      }
      for (const row of plan.actualizar) {
        await tx.detallePedido.update({
          where: { idDetalle: row.id_detalle },
          data: { cantidad: row.nueva_cantidad },
        });
      }
      return;
  }
}

/** Crea la línea inicial al abrir pedido. */
export async function crearLineaMazorcaInicial(
  tx: Prisma.TransactionClient,
  params: {
    idPedido: number;
    numComensales: number;
    mesaNumero: number;
  },
): Promise<void> {
  const productoId = await idProductoMazorcaAcompanamiento(tx);
  const existe = await tx.detallePedido.findFirst({
    where: { idPedido: params.idPedido, idProducto: productoId },
    select: { idDetalle: true },
  });
  const cantidad = cantidadLineaMazorcaInicial({
    usa_linea_mazorca: pedidoUsaLineaMazorca(params.mesaNumero),
    ya_tiene_linea: Boolean(existe),
    num_comensales: params.numComensales,
  });
  if (cantidad == null) return;

  await tx.detallePedido.create({
    data: {
      idPedido: params.idPedido,
      idProducto: productoId,
      cantidad,
      precioUnitario: 0,
      enviadoCocina: false,
    },
  });
}
