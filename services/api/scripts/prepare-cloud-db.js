/**
 * Prepara la BD en Render antes de cada deploy (preDeployCommand).
 * Migraciones, mesas virtuales y seed inicial si está vacía.
 */
const { execSync } = require('child_process');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const apiRoot = path.join(__dirname, '..');

function run(cmd) {
  execSync(cmd, { cwd: apiRoot, stdio: 'inherit', env: process.env });
}

function ensureDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error('DATABASE_URL no está definida.');
  }
  if (url.includes('sslmode=') || !url.includes('render.com')) {
    return;
  }
  const sep = url.includes('?') ? '&' : '?';
  process.env.DATABASE_URL = `${url}${sep}sslmode=require`;
}

async function ensureMesasVirtuales(prisma) {
  for (const numero of [98, 99]) {
    await prisma.mesa.upsert({
      where: { numero },
      create: { numero, capacidad: 1, estado: 'libre' },
      update: {},
    });
  }
}

async function main() {
  ensureDatabaseUrl();

  console.log('[cloud-db] Aplicando migraciones...');
  run('npx prisma migrate deploy');

  const prisma = new PrismaClient();
  try {
    await ensureMesasVirtuales(prisma);
    const userCount = await prisma.usuario.count();
    const forceSeed =
      process.env.DEMO_FORCE_SEED === 'true' ||
      process.env.DEMO_FORCE_SEED === '1';

    if (userCount === 0 || forceSeed) {
      console.log('[cloud-db] Cargando datos de demostración...');
      run('npx prisma db seed');
    } else {
      console.log('[cloud-db] La base ya tiene datos — seed omitido.');
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('[cloud-db] Base lista.');
}

main().catch((err) => {
  console.error('[cloud-db] Error:', err);
  process.exit(1);
});
