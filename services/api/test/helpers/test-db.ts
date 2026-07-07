import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const ALL_DAYS = {
  disponibleLunes: true,
  disponibleMartes: true,
  disponibleMiercoles: true,
  disponibleJueves: true,
  disponibleViernes: true,
  disponibleSabado: true,
  disponibleDomingo: true,
};

/** Mesa reservada para e2e (no interfiere con mesas 1–15 del restaurante). */
export const MESA_E2E_NUMERO = 97;

export type E2eFixture = {
  prisma: PrismaClient;
  idMesaE2e: number;
  idMesaParaLlevar: number;
  idProductoVendible: number;
  idProductoMazorca: number;
  pedidoIds: number[];
};

export async function isDatabaseAvailable(): Promise<boolean> {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

export async function ensureMeseroSeed(prisma: PrismaClient): Promise<void> {
  const exists = await prisma.usuario.findUnique({
    where: { email: 'mesero@restaurant.local' },
  });
  if (exists) return;

  let rol = await prisma.rol.findUnique({ where: { nombre: 'mesero' } });
  if (!rol) {
    rol = await prisma.rol.create({
      data: { nombre: 'mesero', descripcion: 'Toma pedidos (e2e)' },
    });
  }

  await prisma.usuario.create({
    data: {
      idRol: rol.idRol,
      nombre: 'Mesero',
      apellido: 'Demo',
      email: 'mesero@restaurant.local',
      passwordHash: bcrypt.hashSync('mesero123', 10),
    },
  });
}

async function ensureMesaE2e(prisma: PrismaClient): Promise<number> {
  let mesa = await prisma.mesa.findUnique({ where: { numero: MESA_E2E_NUMERO } });
  if (!mesa) {
    mesa = await prisma.mesa.create({
      data: {
        numero: MESA_E2E_NUMERO,
        capacidad: 4,
        estado: 'libre',
        ...ALL_DAYS,
      },
    });
  }
  return mesa.idMesa;
}

async function ensureMesaParaLlevar(prisma: PrismaClient): Promise<number> {
  const mesa = await prisma.mesa.findFirst({ where: { numero: 98 } });
  if (!mesa) {
    throw new Error(
      'Mesa 98 (para llevar) no existe. Ejecuta prisma:seed antes de los e2e.',
    );
  }
  return mesa.idMesa;
}

async function ensureProductoVendible(prisma: PrismaClient): Promise<number> {
  const producto = await prisma.producto.findFirst({
    where: {
      activo: true,
      esAcompanamientoMazorca: false,
      esEmpacable: false,
      precio: { gt: 0 },
    },
    orderBy: { idProducto: 'asc' },
  });
  if (producto) return producto.idProducto;

  const cat = await prisma.categoria.create({
    data: { nombre: `E2E Cat ${Date.now()}`, ...ALL_DAYS },
  });
  const creado = await prisma.producto.create({
    data: {
      idCategoria: cat.idCategoria,
      nombre: 'Plato e2e',
      precio: 15000,
      activo: true,
      esPlatoPrincipal: true,
    },
  });
  return creado.idProducto;
}

async function ensureProductoMazorca(prisma: PrismaClient): Promise<number> {
  const producto = await prisma.producto.findFirst({
    where: { esAcompanamientoMazorca: true, activo: true },
  });
  if (producto) return producto.idProducto;

  const cat = await prisma.categoria.findFirst();
  if (!cat) {
    throw new Error('No hay categorías en BD. Ejecuta prisma:seed.');
  }

  const creado = await prisma.producto.create({
    data: {
      idCategoria: cat.idCategoria,
      nombre: 'Acompañamiento e2e',
      precio: 0,
      activo: true,
      esAcompanamientoMazorca: true,
    },
  });
  return creado.idProducto;
}

export async function createE2eFixture(): Promise<E2eFixture> {
  const prisma = new PrismaClient();
  await prisma.$connect();
  await ensureMeseroSeed(prisma);

  const idMesaE2e = await ensureMesaE2e(prisma);
  const idMesaParaLlevar = await ensureMesaParaLlevar(prisma);
  const idProductoVendible = await ensureProductoVendible(prisma);
  const idProductoMazorca = await ensureProductoMazorca(prisma);

  return {
    prisma,
    idMesaE2e,
    idMesaParaLlevar,
    idProductoVendible,
    idProductoMazorca,
    pedidoIds: [],
  };
}

export async function resetMesaE2e(prisma: PrismaClient, idMesa: number): Promise<void> {
  const pedidos = await prisma.pedido.findMany({
    where: { idMesa },
    select: { idPedido: true },
  });
  for (const p of pedidos) {
    await cleanupPedido(prisma, p.idPedido);
  }
  await prisma.mesa.update({
    where: { idMesa },
    data: { estado: 'libre' },
  });
}

export async function cleanupPedido(
  prisma: PrismaClient,
  idPedido: number,
): Promise<void> {
  await prisma.detPersonalizacion.deleteMany({
    where: { detalle: { idPedido } },
  });
  await prisma.pedidoHistorial.deleteMany({ where: { idPedido } });
  await prisma.detallePedido.deleteMany({ where: { idPedido } });
  await prisma.factura.deleteMany({ where: { idPedido } });
  await prisma.movInventario.deleteMany({ where: { idPedido } });
  await prisma.pedido.deleteMany({ where: { idPedido } });
}

export async function destroyE2eFixture(fixture: E2eFixture): Promise<void> {
  for (const id of fixture.pedidoIds) {
    await cleanupPedido(fixture.prisma, id);
  }
  await resetMesaE2e(fixture.prisma, fixture.idMesaE2e);
  await fixture.prisma.$disconnect();
}
