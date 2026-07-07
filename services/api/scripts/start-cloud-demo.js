/**
 * Arranque para demo en la nube: migraciones, mesas virtuales, seed si la BD está vacía.
 * Variables útiles:
 *   DEMO_FORCE_SEED=true  — vuelve a cargar datos demo (borra datos existentes vía seed).
 */
const { execSync } = require('child_process');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const apiRoot = path.join(__dirname, '..');

function run(cmd) {
  execSync(cmd, { cwd: apiRoot, stdio: 'inherit', env: process.env });
}

async function ensureMesasVirtuales(prisma) {
  for (const numero of [98, 99]) {
    await prisma.mesa.upsert({
      where: { numero },
      create: { numero, capacidad: 1, estado: 'libre' },
      update: {},
    });
  }
  console.log('[cloud-demo] Mesas virtuales 98 y 99 listas.');
}

async function main() {
  console.log('[cloud-demo] Aplicando migraciones Prisma...');
  run('npx prisma migrate deploy');

  const prisma = new PrismaClient();
  try {
    await ensureMesasVirtuales(prisma);
    const userCount = await prisma.usuario.count();
    const forceSeed =
      process.env.DEMO_FORCE_SEED === 'true' ||
      process.env.DEMO_FORCE_SEED === '1';

    if (userCount === 0 || forceSeed) {
      console.log('[cloud-demo] Cargando datos de demostración (seed)...');
      run('npx prisma db seed');
    } else {
      console.log('[cloud-demo] La base ya tiene datos — seed omitido.');
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('[cloud-demo] Iniciando API en producción...');
  require(path.join(apiRoot, 'dist', 'src', 'main'));
}

main().catch((err) => {
  console.error('[cloud-demo] Error de arranque:', err);
  process.exit(1);
});
