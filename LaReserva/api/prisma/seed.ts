import { PrismaClient, TipoPersonalizacion } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { inferirTipoProteina } from '../src/pedidos/cocina-prioridad';

const prisma = new PrismaClient();

const ALL = {
  disponibleLunes: true,
  disponibleMartes: true,
  disponibleMiercoles: true,
  disponibleJueves: true,
  disponibleViernes: true,
  disponibleSabado: true,
  disponibleDomingo: true,
};

const PARA_COMPARTIR = {
  disponibleLunes: false,
  disponibleMartes: false,
  disponibleMiercoles: true,
  disponibleJueves: true,
  disponibleViernes: true,
  disponibleSabado: true,
  disponibleDomingo: false,
};

const SOLO_DOMINGO = {
  disponibleLunes: false,
  disponibleMartes: false,
  disponibleMiercoles: false,
  disponibleJueves: false,
  disponibleViernes: false,
  disponibleSabado: false,
  disponibleDomingo: true,
};

async function main() {
  await prisma.detPersonalizacion.deleteMany();
  await prisma.detallePedido.deleteMany();
  await prisma.factura.deleteMany();
  await prisma.movInventario.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.personalizacionOpcion.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.mesa.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.rol.deleteMany();

  await prisma.rol.createMany({
    data: [
      { nombre: 'mesero', descripcion: 'Toma pedidos y factura' },
      { nombre: 'chef', descripcion: 'Vista cocina' },
      { nombre: 'admin', descripcion: 'Administración' },
    ],
  });
  const rolMesero = await prisma.rol.findFirstOrThrow({ where: { nombre: 'mesero' } });
  const rolChef = await prisma.rol.findFirstOrThrow({ where: { nombre: 'chef' } });
  const rolAdmin = await prisma.rol.findFirstOrThrow({ where: { nombre: 'admin' } });

  const hash = (p: string) => bcrypt.hashSync(p, 10);
  await prisma.usuario.createMany({
    data: [
      {
        idRol: rolMesero.idRol,
        nombre: 'Mesero',
        apellido: 'Demo',
        email: 'mesero@lareserva.local',
        passwordHash: hash('mesero123'),
      },
      {
        idRol: rolChef.idRol,
        nombre: 'Chef',
        apellido: 'Demo',
        email: 'chef@lareserva.local',
        passwordHash: hash('chef123'),
      },
      {
        idRol: rolAdmin.idRol,
        nombre: 'Administrador',
        apellido: '',
        email: 'admin@lareserva.local',
        passwordHash: hash('admin123'),
      },
    ],
  });

  for (let n = 1; n <= 15; n++) {
    await prisma.mesa.create({
      data: {
        numero: n,
        capacidad: 4,
        estado: 'libre',
      },
    });
  }

  /** Para llevar: no aparece en la grilla de mesas 1–15. */
  await prisma.mesa.create({
    data: {
      numero: 98,
      capacidad: 1,
      estado: 'libre',
    },
  });

  /** Venta rápida (solo bebidas, sin mesa 1–15). No aparece en la grilla de mesas. */
  await prisma.mesa.create({
    data: {
      numero: 99,
      capacidad: 1,
      estado: 'libre',
    },
  });

  type CatInput = {
    nombre: string;
    dias: typeof ALL;
    productos: { nombre: string; precio: number; desc?: string }[];
  };

  const categoriasData: CatInput[] = [
    {
      nombre: 'Platos fuertes - Cerdo',
      dias: ALL,
      productos: [
        { nombre: 'Ribs de costillas al barril', precio: 32000 },
        { nombre: 'Bondiola al barril', precio: 30000 },
        { nombre: 'Lomo al barril', precio: 28000 },
        {
          nombre: 'Milanesa de cerdo (cubierta de jamón y queso)',
          precio: 32000,
        },
        { nombre: 'Solomito de cerdo', precio: 36000 },
      ],
    },
    {
      nombre: 'Platos fuertes - Pollo',
      dias: ALL,
      productos: [
        { nombre: 'Pechuga a la plancha', precio: 26000 },
        { nombre: 'Pollo apanado (filete de pechuga apanado)', precio: 28000 },
        {
          nombre: 'Milanesa de pollo (filete apanado, cubierto con jamón y queso)',
          precio: 32000,
        },
      ],
    },
    {
      nombre: 'Platos fuertes - Res / Mixto',
      dias: ALL,
      productos: [
        { nombre: 'Chata a la plancha', precio: 32000 },
        {
          nombre: 'Parrillada mixta (cortes de lomo, costilla y chorizo)',
          precio: 33000,
        },
      ],
    },
    {
      nombre: 'Menú infantil',
      dias: ALL,
      productos: [
        {
          nombre: 'Nuggets de pollo (trozos apanados + papas a la francesa)',
          precio: 17000,
        },
      ],
    },
    {
      nombre: 'Para compartir',
      dias: PARA_COMPARTIR,
      productos: [
        { nombre: 'Picada de la casa 250g', precio: 40000 },
        { nombre: 'Picada de la casa 500g', precio: 70000 },
      ],
    },
    {
      nombre: 'Entradas y adicionales',
      dias: ALL,
      productos: [
        { nombre: 'Entrada de chorizo', precio: 6000 },
        { nombre: 'Mazorca para dos', precio: 3000 },
        { nombre: 'Papas a la francesa', precio: 6000 },
        { nombre: 'Ensalada', precio: 3000 },
        { nombre: 'Porción de papa al vapor', precio: 1000 },
        { nombre: 'Porción de yuca al vapor', precio: 1000 },
        { nombre: 'Adicional de chorizo', precio: 6000 },
      ],
    },
    {
      nombre: 'Sopa del día',
      dias: SOLO_DOMINGO,
      productos: [{ nombre: 'Sopa del día', precio: 10000 }],
    },
    {
      nombre: 'Bebidas sin alcohol',
      dias: ALL,
      productos: [
        { nombre: 'Agua', precio: 2000 },
        { nombre: 'Jugos Hit 500 ml', precio: 4000 },
        { nombre: 'Gaseosa 250 ml', precio: 2500 },
        { nombre: 'Gaseosa 340 ml', precio: 4000 },
        { nombre: 'Soda 340 ml', precio: 4000 },
        { nombre: 'Gaseosa litrón', precio: 6000 },
        { nombre: 'Gaseosa 1.5 l pet', precio: 7000 },
        { nombre: 'Cocacola 1L', precio: 7000 },
        { nombre: 'Cocacola 1.5L', precio: 8000 },
        { nombre: 'Cocacola personal', precio: 4000 },
      ],
    },
    {
      nombre: 'Bebidas con alcohol',
      dias: ALL,
      productos: [
        { nombre: 'Poker', precio: 5000 },
        { nombre: 'Club Colombia', precio: 5500 },
      ],
    },
    {
      nombre: 'Empaque',
      dias: ALL,
      productos: [{ nombre: 'Empaque para llevar', precio: 1000 }],
    },
  ];

  const platosFuertesProductIds: number[] = [];

  for (const cat of categoriasData) {
    const categoria = await prisma.categoria.create({
      data: {
        nombre: cat.nombre,
        ...cat.dias,
        productos: {
          create: cat.productos.map((p) => ({
            nombre: p.nombre,
            descripcion: p.desc ?? null,
            precio: p.precio,
            activo: true,
            tipoProteina: inferirTipoProteina(cat.nombre, p.nombre),
            esPlatoPrincipal:
              cat.nombre.startsWith('Platos fuertes') ||
              cat.nombre === 'Menú infantil',
            esEmpacable: cat.nombre === 'Empaque',
          })),
        },
      },
      include: { productos: true },
    });

    if (cat.nombre.startsWith('Platos fuertes')) {
      platosFuertesProductIds.push(...categoria.productos.map((p) => p.idProducto));
    }
  }

  const omitir = ['Sin yuca', 'Sin papa', 'Sin ensalada', 'Sin mazorca'];
  const aderezos = ['Chipotle', 'Agridulce', 'Chimichurri'];

  for (const pid of platosFuertesProductIds) {
    await prisma.personalizacionOpcion.createMany({
      data: [
        ...omitir.map((d) => ({
          idProducto: pid,
          tipo: TipoPersonalizacion.omitir_ingrediente,
          descripcion: d,
        })),
        ...aderezos.map((d) => ({
          idProducto: pid,
          tipo: TipoPersonalizacion.aderezo,
          descripcion: d,
        })),
      ],
    });
  }

  /** Catálogo mínimo: Agua $2000 en «Bebidas sin alcohol» (idempotente si ya vino del bloque anterior). */
  const PRECIO_AGUA = 2000;
  const catBebidas = await prisma.categoria.findFirst({
    where: { nombre: 'Bebidas sin alcohol' },
  });
  if (catBebidas) {
    const agua = await prisma.producto.findFirst({
      where: { idCategoria: catBebidas.idCategoria, nombre: 'Agua' },
    });
    if (!agua) {
      await prisma.producto.create({
        data: {
          idCategoria: catBebidas.idCategoria,
          nombre: 'Agua',
          precio: PRECIO_AGUA,
          activo: true,
          tipoProteina: 'ninguno',
          esPlatoPrincipal: false,
          esEmpacable: false,
        },
      });
      console.log(
        'Seed: creado producto Agua',
        PRECIO_AGUA,
        'en Bebidas sin alcohol.',
      );
    } else if (
      !agua.activo ||
      Number(agua.precio) !== PRECIO_AGUA
    ) {
      await prisma.producto.update({
        where: { idProducto: agua.idProducto },
        data: { activo: true, precio: PRECIO_AGUA },
      });
      console.log('Seed: corregido Agua →', PRECIO_AGUA, 'COP, activo.');
    }
  }

  console.log(
    'Seed OK. Productos platos fuertes con personalización:',
    platosFuertesProductIds.length,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
