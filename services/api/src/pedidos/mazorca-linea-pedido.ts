import { BadRequestException } from '@nestjs/common';
import type { EstadoPedido, Prisma } from '@prisma/client';
import {
  pedidoUsaLineaMazorca,
  esDetalleMazorcaAcompanamiento,
} from '@la-reserva/shared-domain/mazorca-pedido';
import {
  cantidadLineaMazorcaInicial,
  planificarSyncMazorca,
  type LineaMazorcaSync,
} from '@la-reserva/shared-domain/mazorca-linea-pedido';

export { pedidoUsaLineaMazorca, esDetalleMazorcaAcompanamiento };

let cachedMazorcaProductId: number | null = null;

export function invalidateMazorcaProductIdCache(): void {
  cachedMazorcaProductId = null;
}

export async function idProductoMazorcaAcompanamiento(
  prisma: Pick<Prisma.TransactionClient, 'producto'>,
  idConfigurado?: number | null,
): Promise<number> {
  if (idConfigurado != null) {
    const p = await prisma.producto.findUnique({
      where: { idProducto: idConfigurado },
      select: { idProducto: true, activo: true },
    });
    if (!p) {
      throw new BadRequestException(
        'El producto de acompañamiento por comensal configurado ya no existe',
      );
    }
    cachedMazorcaProductId = p.idProducto;
    return p.idProducto;
  }

  if (cachedMazorcaProductId != null) {
    return cachedMazorcaProductId;
  }

  const porFlag = await prisma.producto.findFirst({
    where: { esAcompanamientoMazorca: true, activo: true },
    orderBy: { idProducto: 'asc' },
    select: { idProducto: true },
  });
  if (porFlag) {
    cachedMazorcaProductId = porFlag.idProducto;
    return porFlag.idProducto;
  }

  throw new BadRequestException(
    'Producto de acompañamiento por comensal no configurado. Márcalo en el menú o elige uno en Configuración.',
  );
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
    /** Si no se indica, depende de mesa y mazorcaActiva en configuración. */
    usaLineaMazorca?: boolean;
    mazorcaActiva?: boolean;
    idProductoMazorca?: number | null;
  },
): Promise<void> {
  const usaLinea =
    params.usaLineaMazorca ??
    pedidoUsaLineaMazorca(params.mesaNumero, params.mazorcaActiva ?? false);

  if (!usaLinea) {
    await tx.detallePedido.deleteMany({
      where: {
        idPedido: params.idPedido,
        producto: { esAcompanamientoMazorca: true },
      },
    });
    return;
  }

  let productoId: number;
  try {
    productoId = await idProductoMazorcaAcompanamiento(
      tx,
      params.idProductoMazorca,
    );
  } catch (e) {
    if (
      e instanceof BadRequestException &&
      params.idProductoMazorca == null
    ) {
      return;
    }
    throw e;
  }

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
    mazorcaActiva?: boolean;
    idProductoMazorca?: number | null;
  },
): Promise<void> {
  const usaLinea = pedidoUsaLineaMazorca(
    params.mesaNumero,
    params.mazorcaActiva ?? false,
  );
  if (!usaLinea) return;

  let productoId: number;
  try {
    productoId = await idProductoMazorcaAcompanamiento(
      tx,
      params.idProductoMazorca,
    );
  } catch (e) {
    if (
      e instanceof BadRequestException &&
      params.idProductoMazorca == null
    ) {
      return;
    }
    throw e;
  }
  const existe = await tx.detallePedido.findFirst({
    where: { idPedido: params.idPedido, idProducto: productoId },
    select: { idDetalle: true },
  });
  const cantidad = cantidadLineaMazorcaInicial({
    usa_linea_mazorca: usaLinea,
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
