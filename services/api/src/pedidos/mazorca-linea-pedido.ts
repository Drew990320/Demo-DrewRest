import { BadRequestException } from '@nestjs/common';
import type { EstadoPedido, Prisma } from '@prisma/client';
import { MESA_PARA_LLEVAR_NUMERO } from '../mesas/mesas.service';

const NOMBRE_PRODUCTO_MAZORCA = 'Mazorca (acompañamiento)';

/** Mesa 98 (para llevar): comensales solo referencia; sin línea de mazorca. */
export function pedidoUsaLineaMazorca(mesaNumero: number): boolean {
  return mesaNumero !== MESA_PARA_LLEVAR_NUMERO;
}

export function esDetalleMazorcaAcompanamiento(producto: {
  esAcompanamientoMazorca: boolean;
}): boolean {
  return producto.esAcompanamientoMazorca;
}

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

type LineaMazorca = {
  idDetalle: number;
  cantidad: number;
  enviadoCocina: boolean;
  listoParaRecoger: boolean;
  listoCocina: boolean;
};

function cantidadBloqueada(lineas: LineaMazorca[]): number {
  return lineas.reduce(
    (s, l) =>
      s + (l.listoCocina || l.listoParaRecoger ? l.cantidad : 0),
    0,
  );
}

function cantidadTotal(lineas: LineaMazorca[]): number {
  return lineas.reduce((s, l) => s + l.cantidad, 0);
}

function lineaEditable(lineas: LineaMazorca[]): LineaMazorca | undefined {
  return lineas.find((l) => !l.listoCocina && !l.listoParaRecoger);
}

/** Sincroniza la línea automática de mazorca con el número de comensales. */
export async function sincronizarLineaMazorcaAcompanamiento(
  tx: Prisma.TransactionClient,
  params: {
    idPedido: number;
    numComensales: number;
    mesaNumero: number;
    estadoPedido: EstadoPedido;
  },
): Promise<void> {
  const productoId = await idProductoMazorcaAcompanamiento(tx);

  if (!pedidoUsaLineaMazorca(params.mesaNumero)) {
    await tx.detallePedido.deleteMany({
      where: { idPedido: params.idPedido, idProducto: productoId },
    });
    return;
  }

  if (params.numComensales < 1) {
    throw new BadRequestException('Debe haber al menos 1 comensal');
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

  const total = cantidadTotal(lineas);
  const bloqueada = cantidadBloqueada(lineas);

  if (params.numComensales < bloqueada) {
    throw new BadRequestException(
      'No puedes bajar comensales por debajo de las mazorcas ya listas o entregadas',
    );
  }

  if (total === params.numComensales) {
    return;
  }

  const enviadoNuevo = params.estadoPedido === 'en_cocina';

  if (total < params.numComensales) {
    const agregar = params.numComensales - total;
    const editable = lineaEditable(lineas);
    if (editable) {
      await tx.detallePedido.update({
        where: { idDetalle: editable.idDetalle },
        data: { cantidad: editable.cantidad + agregar },
      });
      return;
    }
    await tx.detallePedido.create({
      data: {
        idPedido: params.idPedido,
        idProducto: productoId,
        cantidad: agregar,
        precioUnitario: 0,
        enviadoCocina: enviadoNuevo,
      },
    });
    return;
  }

  let quitar = total - params.numComensales;
  const editables = lineas
    .filter((l) => !l.listoCocina && !l.listoParaRecoger)
    .sort((a, b) => b.idDetalle - a.idDetalle);

  for (const l of editables) {
    if (quitar <= 0) break;
    const resta = Math.min(quitar, l.cantidad);
    quitar -= resta;
    if (l.cantidad === resta) {
      await tx.detallePedido.delete({ where: { idDetalle: l.idDetalle } });
    } else {
      await tx.detallePedido.update({
        where: { idDetalle: l.idDetalle },
        data: { cantidad: l.cantidad - resta },
      });
    }
  }

  if (quitar > 0) {
    throw new BadRequestException(
      'No se pudo ajustar comensales: hay mazorcas ya listas o en mesa',
    );
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
  if (!pedidoUsaLineaMazorca(params.mesaNumero)) return;
  const productoId = await idProductoMazorcaAcompanamiento(tx);
  const existe = await tx.detallePedido.findFirst({
    where: { idPedido: params.idPedido, idProducto: productoId },
    select: { idDetalle: true },
  });
  if (existe) return;
  await tx.detallePedido.create({
    data: {
      idPedido: params.idPedido,
      idProducto: productoId,
      cantidad: params.numComensales,
      precioUnitario: 0,
      enviadoCocina: false,
    },
  });
}

export { NOMBRE_PRODUCTO_MAZORCA };
