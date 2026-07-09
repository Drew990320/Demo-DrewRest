/**
 * Datos mínimos del tenant para Render (restaurante + mesas 98/99).
 * Usado tras migrate deploy cuando la BD se creó con db push sin seed SQL.
 */
const DEFAULT_SLUG = 'principal';

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

async function ensureMesaVirtual(prisma, idRestaurante, numero) {
  await prisma.mesa.upsert({
    where: {
      idRestaurante_numero: { idRestaurante, numero },
    },
    create: {
      idRestaurante,
      numero,
      capacidad: 1,
      estado: 'libre',
    },
    update: {},
  });
}

async function ensureTenantBaseData(prisma) {
  const idRestaurante = await resolveRestauranteId(prisma);
  await ensureMesaVirtual(prisma, idRestaurante, 98);
  await ensureMesaVirtual(prisma, idRestaurante, 99);
  console.log(
    `Tenant base: restaurante ${idRestaurante}, mesas virtuales 98 y 99.`,
  );
  return idRestaurante;
}

module.exports = { ensureTenantBaseData, resolveRestauranteId };
