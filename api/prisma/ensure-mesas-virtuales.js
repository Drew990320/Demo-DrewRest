/**
 * Mesas virtuales 98 (para llevar) y 99 (mostrador). Ejecutar tras migrate deploy en Render.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function ensureRestaurantePrincipal() {
  const restaurante = await prisma.restaurante.upsert({
    where: { slug: 'principal' },
    create: {
      idRestaurante: 1,
      slug: 'principal',
      nombre: process.env.RESTAURANT_NAME?.trim() || 'Restaurante',
    },
    update: {},
  });
  return restaurante.idRestaurante;
}

async function ensureMesaVirtual(idRestaurante, numero) {
  await prisma.mesa.upsert({
    where: {
      idRestaurante_numero: {
        idRestaurante,
        numero,
      },
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

async function main() {
  const idRestaurante = await ensureRestaurantePrincipal();
  await ensureMesaVirtual(idRestaurante, 98);
  await ensureMesaVirtual(idRestaurante, 99);
  console.log('Mesas virtuales listas: 98 (para llevar), 99 (mostrador).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
