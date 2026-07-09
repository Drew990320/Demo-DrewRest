/**
 * Datos mínimos del tenant para Render (restaurante, roles, usuarios demo, mesas).
 * Usado tras migrate deploy cuando la BD se creó con db push sin seed SQL.
 */
const bcrypt = require('bcrypt');

const DEFAULT_SLUG = 'principal';

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

async function ensureMesa(prisma, idRestaurante, numero, capacidad = 4) {
  await prisma.mesa.upsert({
    where: {
      idRestaurante_numero: { idRestaurante, numero },
    },
    create: {
      idRestaurante,
      numero,
      capacidad,
      estado: 'libre',
    },
    update: {},
  });
}

async function ensureDemoMesas(prisma, idRestaurante) {
  for (let n = 1; n <= 15; n++) {
    await ensureMesa(prisma, idRestaurante, n, 4);
  }
  await ensureMesa(prisma, idRestaurante, 98, 1);
  await ensureMesa(prisma, idRestaurante, 99, 1);
}

async function ensureTenantBaseData(prisma) {
  const idRestaurante = await resolveRestauranteId(prisma);
  await ensureRoles(prisma);
  await ensureDemoUsers(prisma, idRestaurante);
  await ensureDemoMesas(prisma, idRestaurante);
  console.log(
    `Tenant demo: restaurante ${idRestaurante}, usuarios y mesas 1-15, 98, 99.`,
  );
  return idRestaurante;
}

module.exports = { ensureTenantBaseData, resolveRestauranteId, DEMO_USERS };
