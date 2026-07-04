import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  NOMBRE_PRODUCTO_CUOTA_PENDIENTE,
  formatCuotaPendienteNota,
} from '@la-reserva/shared-domain/cuota-pendiente-reparto';
import { inferirReglasCategoriaDesdeNombre } from '@la-reserva/shared-domain/categoria-reglas';

let cachedCuotaPendienteProductId: number | null = null;

export function invalidateCuotaPendienteProductIdCache(): void {
  cachedCuotaPendienteProductId = null;
}

export async function idProductoCuotaPendienteReparto(
  prisma: Pick<
    Prisma.TransactionClient,
    'producto' | 'categoria' | 'configOperativa'
  >,
  idConfigurado?: number | null,
): Promise<number> {
  if (idConfigurado != null) {
    const p = await prisma.producto.findUnique({
      where: { idProducto: idConfigurado },
      select: { idProducto: true },
    });
    if (!p) {
      throw new BadRequestException(
        'El producto de cuota pendiente configurado ya no existe',
      );
    }
    cachedCuotaPendienteProductId = p.idProducto;
    return p.idProducto;
  }

  if (cachedCuotaPendienteProductId != null) {
    return cachedCuotaPendienteProductId;
  }

  const porFlag = await prisma.producto.findFirst({
    where: { esCuotaPendienteReparto: true, activo: true },
    orderBy: { idProducto: 'asc' },
    select: { idProducto: true },
  });
  if (porFlag) {
    cachedCuotaPendienteProductId = porFlag.idProducto;
    return porFlag.idProducto;
  }

  const porNombre = await prisma.producto.findFirst({
    where: { nombre: NOMBRE_PRODUCTO_CUOTA_PENDIENTE, activo: true },
    orderBy: { idProducto: 'asc' },
    select: { idProducto: true },
  });
  if (porNombre) {
    await prisma.producto.update({
      where: { idProducto: porNombre.idProducto },
      data: { esCuotaPendienteReparto: true },
    });
    cachedCuotaPendienteProductId = porNombre.idProducto;
    return porNombre.idProducto;
  }

  const reglas = inferirReglasCategoriaDesdeNombre('Ajustes');
  let categoria = await prisma.categoria.findFirst({
    where: { nombre: 'Ajustes' },
    select: { idCategoria: true },
  });
  if (!categoria) {
    categoria = await prisma.categoria.create({
      data: {
        nombre: 'Ajustes',
        esBebida: reglas.es_bebida,
        esLineaEmpaque: reglas.es_linea_empaque,
        visibleEnMostrador: false,
        participaDescuentoSopas: false,
        tipoLineaCocinaDefault: 'adicional',
        esPlatoPrincipalDefault: false,
        disponibleLunes: false,
        disponibleMartes: false,
        disponibleMiercoles: false,
        disponibleJueves: false,
        disponibleViernes: false,
        disponibleSabado: false,
        disponibleDomingo: false,
      },
      select: { idCategoria: true },
    });
  }

  const created = await prisma.producto.create({
    data: {
      idCategoria: categoria.idCategoria,
      nombre: NOMBRE_PRODUCTO_CUOTA_PENDIENTE,
      descripcion: 'Cuota omitida en reparto por personas o combinado',
      precio: 0,
      activo: true,
      esPlatoPrincipal: false,
      esEmpacable: false,
      esAcompanamientoMazorca: false,
      esCuotaPendienteReparto: true,
    },
    select: { idProducto: true },
  });

  await prisma.configOperativa.updateMany({
    where: { id: 1 },
    data: { idProductoCuotaPendiente: created.idProducto },
  });

  cachedCuotaPendienteProductId = created.idProducto;
  return created.idProducto;
}

export { formatCuotaPendienteNota, NOMBRE_PRODUCTO_CUOTA_PENDIENTE };
