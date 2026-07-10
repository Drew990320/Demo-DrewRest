/**
 * Datos del tenant demo para Render (restaurante, config, lugares, mesas, menú mínimo).
 * Se ejecuta en cada deploy del API para mantener la demo alineada con desarrollo.
 */
const bcrypt = require('bcrypt');

const DEFAULT_SLUG = 'principal';
const SALON_NOMBRE = 'Salón principal';
const DEMO_MESA_COUNT = 20;

const DEMO_USERS = [
  {
    rol: 'mesero',
    nombre: 'Mesero',
    apellido: 'Demo',
    email: 'mesero@drewrest.local',
    password: 'mesero123',
  },
  {
    rol: 'chef',
    nombre: 'Chef',
    apellido: 'Demo',
    email: 'chef@drewrest.local',
    password: 'chef123',
  },
  {
    rol: 'admin',
    nombre: 'Admin',
    apellido: 'Demo',
    email: 'admin@drewrest.local',
    password: 'admin123',
  },
  {
    rol: 'superadmin',
    nombre: 'Superadmin',
    apellido: '',
    email: 'superadmin@drewrest.local',
    password: 'superadmin123',
  },
];

async function resolveRestauranteId(prisma) {
  const nombre = process.env.RESTAURANT_NAME?.trim() || 'Restaurante';

  const count = await prisma.restaurante.count();
  if (count === 0) {
    await prisma.$executeRaw`
      INSERT INTO restaurante (id_restaurante, slug, nombre, activo, plan)
      VALUES (1, 'principal', ${nombre}, true, 'core')
      ON CONFLICT (id_restaurante) DO NOTHING
    `;
  }

  const bySlug = await prisma.restaurante.findUnique({
    where: { slug: DEFAULT_SLUG },
  });
  if (bySlug) return bySlug.idRestaurante;

  const byId = await prisma.restaurante.findUnique({
    where: { idRestaurante: 1 },
  });
  if (byId) return byId.idRestaurante;

  try {
    const created = await prisma.restaurante.create({
      data: {
        idRestaurante: 1,
        slug: DEFAULT_SLUG,
        nombre,
      },
    });
    return created.idRestaurante;
  } catch {
    // id o slug ya usado por otro registro
  }

  const fallback = await prisma.restaurante.findFirst({
    orderBy: { idRestaurante: 'asc' },
  });
  if (fallback) return fallback.idRestaurante;

  const created = await prisma.restaurante.create({
    data: { slug: DEFAULT_SLUG, nombre },
  });
  return created.idRestaurante;
}

async function ensureRoles(prisma) {
  const roles = [
    { nombre: 'mesero', descripcion: 'Toma pedidos y factura' },
    { nombre: 'chef', descripcion: 'Vista cocina' },
    { nombre: 'admin', descripcion: 'Administracion' },
    { nombre: 'superadmin', descripcion: 'Operación oculta del sistema' },
  ];
  for (const rol of roles) {
    await prisma.rol.upsert({
      where: { nombre: rol.nombre },
      update: {},
      create: rol,
    });
  }
}

async function ensureDemoUsers(prisma, idRestaurante) {
  const created = [];
  for (const u of DEMO_USERS) {
    const rol = await prisma.rol.findUniqueOrThrow({ where: { nombre: u.rol } });
    const exists = await prisma.usuario.findUnique({
      where: {
        idRestaurante_email: { idRestaurante, email: u.email },
      },
    });
    if (exists) continue;
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.usuario.create({
      data: {
        idRestaurante,
        idRol: rol.idRol,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        passwordHash,
        activo: true,
      },
    });
    created.push({ email: u.email, password: u.password });
  }
  if (created.length > 0) {
    console.log('Usuarios demo creados:');
    for (const u of created) {
      console.log(`  - ${u.email} / ${u.password}`);
    }
  }
  return created;
}

async function ensureDemoConfig(prisma, idRestaurante) {
  const nombre = process.env.RESTAURANT_NAME?.trim() || 'DrewRest Demo';
  await prisma.configRestaurante.upsert({
    where: { idRestaurante },
    create: {
      idRestaurante,
      nombreComercial: nombre,
      dominioEmailInterno: 'drewrest.local',
      moduloInventarioActivo: true,
      moduloMeserosOperativosActivo: true,
      moduloResumenDiarioActivo: true,
      moduloContabilidadActivo: true,
      moduloCreditosActivo: true,
    },
    update: {
      nombreComercial: nombre,
      moduloInventarioActivo: true,
      moduloMeserosOperativosActivo: true,
      moduloResumenDiarioActivo: true,
      moduloContabilidadActivo: true,
      moduloCreditosActivo: true,
    },
  });
}

async function ensureSalonLugar(prisma, idRestaurante) {
  const existing = await prisma.lugarMesa.findFirst({
    where: {
      idRestaurante,
      nombre: { equals: SALON_NOMBRE, mode: 'insensitive' },
    },
  });
  if (existing) return existing.idLugar;

  const created = await prisma.lugarMesa.create({
    data: {
      idRestaurante,
      nombre: SALON_NOMBRE,
      orden: 1,
      activo: true,
    },
  });
  return created.idLugar;
}

async function ensureMesa(prisma, idRestaurante, numero, capacidad = 4, idLugar = null) {
  await prisma.mesa.upsert({
    where: {
      idRestaurante_numero: { idRestaurante, numero },
    },
    create: {
      idRestaurante,
      numero,
      capacidad,
      estado: 'libre',
      idLugar,
    },
    update: {
      capacidad,
      ...(idLugar != null ? { idLugar } : {}),
    },
  });
}

async function ensureDemoMesas(prisma, idRestaurante, idLugar) {
  for (let n = 1; n <= DEMO_MESA_COUNT; n++) {
    await ensureMesa(prisma, idRestaurante, n, 4, idLugar);
  }
  await ensureMesa(prisma, idRestaurante, 98, 1, null);
  await ensureMesa(prisma, idRestaurante, 99, 1, null);

  await prisma.mesa.updateMany({
    where: {
      idRestaurante,
      numero: { gte: 1, lte: DEMO_MESA_COUNT },
      idLugar: null,
    },
    data: { idLugar },
  });
}

async function ensureDemoMenuIfEmpty(prisma, idRestaurante) {
  const count = await prisma.categoria.count({ where: { idRestaurante } });
  if (count > 0) return;

  const platos = await prisma.categoria.create({
    data: {
      idRestaurante,
      nombre: 'Platos principales',
      esPlatoPrincipalDefault: true,
      productos: {
        create: {
          nombre: 'Plato del día',
          precio: 25000,
          esPlatoPrincipal: true,
          enviaCocina: true,
        },
      },
    },
  });

  await prisma.categoria.create({
    data: {
      idRestaurante,
      nombre: 'Bebidas',
      esBebida: true,
      visibleEnMostrador: true,
      productos: {
        create: [
          { nombre: 'Agua', precio: 2000, enviaCocina: false },
          { nombre: 'Gaseosa', precio: 4000, enviaCocina: false },
        ],
      },
    },
  });

  await prisma.configOperativa.upsert({
    where: { idRestaurante },
    create: {
      idRestaurante,
      mazorcaActiva: false,
      prioridadCocinaAutomatica: false,
      prioridadCocinaModo: 'fifo',
    },
    update: {},
  });

  console.log(`Menú demo mínimo creado (categoría ${platos.nombre}).`);
}

async function ensureTenantBaseData(prisma) {
  const idRestaurante = await resolveRestauranteId(prisma);
  await ensureRoles(prisma);
  await ensureDemoUsers(prisma, idRestaurante);
  await ensureDemoConfig(prisma, idRestaurante);
  const idLugar = await ensureSalonLugar(prisma, idRestaurante);
  await ensureDemoMesas(prisma, idRestaurante, idLugar);
  await ensureDemoMenuIfEmpty(prisma, idRestaurante);
  console.log(
    `Tenant demo: restaurante ${idRestaurante}, ${SALON_NOMBRE}, mesas 1-${DEMO_MESA_COUNT}, módulos inventario/contabilidad activos.`,
  );
  return idRestaurante;
}

module.exports = { ensureTenantBaseData, resolveRestauranteId, DEMO_USERS };
