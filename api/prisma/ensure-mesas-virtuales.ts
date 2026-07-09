/**
 * Crea las mesas virtuales 98 (para llevar) y 99 (mostrador) si no existen.
 * No borra ni modifica otros datos. Útil cuando la BD se creó sin ejecutar el seed completo.
 *
 * Uso: npm run prisma:ensure-mesas
 */
import { PrismaClient } from '@prisma/client';

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

async function ensureMesaVirtual(idRestaurante: number, numero: number) {
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
  console.log(
    'Mesas virtuales listas: 98 (para llevar), 99 (mostrador).',
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
