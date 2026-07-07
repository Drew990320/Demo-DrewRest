/**
 * Prepara la BD al arrancar en Render (plan free).
 * En demo usa db push (más tolerante que migrate deploy con historial incompleto).
 */
const { execSync } = require('child_process');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const apiRoot = path.join(__dirname, '..');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(cmd) {
  execSync(cmd, {
    cwd: apiRoot,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });
}

async function syncSchema() {
  const useDbPush =
    process.env.DEMO_USE_DB_PUSH === 'true' ||
    process.env.DEMO_USE_DB_PUSH === '1';

  if (useDbPush) {
    console.log('[cloud-db] Sincronizando esquema con prisma db push...');
    run('npx prisma db push --skip-generate');
    return;
  }

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      run('npx prisma migrate deploy');
      return;
    } catch (error) {
      if (attempt >= 8) {
        console.warn(
          '[cloud-db] migrate deploy falló; usando db push como respaldo de demo...',
        );
        run('npx prisma db push --skip-generate');
        return;
      }
      console.warn(
        `[cloud-db] migrate deploy falló (intento ${attempt}/8). Reintentando en 5s...`,
      );
      await sleep(5000);
    }
  }
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

async function migrateLegacyDemoEmails(prisma) {
  const pairs = [
    ['mesero@lareserva.local', 'mesero@restaurant.local'],
    ['chef@lareserva.local', 'chef@restaurant.local'],
    ['admin@lareserva.local', 'admin@restaurant.local'],
  ];

  for (const [oldEmail, newEmail] of pairs) {
    const legacy = await prisma.usuario.findUnique({ where: { email: oldEmail } });
    if (!legacy) continue;

    const exists = await prisma.usuario.findUnique({ where: { email: newEmail } });
    if (exists) {
      await prisma.usuario.delete({ where: { email: oldEmail } });
      console.log(`[cloud-db] Usuario legacy eliminado: ${oldEmail}`);
      continue;
    }

    await prisma.usuario.update({
      where: { email: oldEmail },
      data: { email: newEmail },
    });
    console.log(`[cloud-db] Usuario migrado: ${oldEmail} → ${newEmail}`);
  }
}

async function ensureDemoUsers(prisma) {
  const bcrypt = require('bcrypt');
  const roles = ['mesero', 'chef', 'admin'];
  for (const nombre of roles) {
    await prisma.rol.upsert({
      where: { nombre },
      update: {},
      create: { nombre, descripcion: nombre },
    });
  }
  const rolMesero = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'mesero' } });
  const rolChef = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'chef' } });
  const rolAdmin = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'admin' } });

  const users = [
    {
      idRol: rolMesero.idRol,
      nombre: 'Mesero',
      apellido: 'Demo',
      email: 'mesero@restaurant.local',
      password: 'mesero123',
    },
    {
      idRol: rolChef.idRol,
      nombre: 'Chef',
      apellido: 'Demo',
      email: 'chef@restaurant.local',
      password: 'chef123',
    },
    {
      idRol: rolAdmin.idRol,
      nombre: 'Administrador',
      apellido: '',
      email: 'admin@restaurant.local',
      password: 'admin123',
    },
  ];

  for (const u of users) {
    const exists = await prisma.usuario.findUnique({ where: { email: u.email } });
    if (exists) continue;
    await prisma.usuario.create({
      data: {
        idRol: u.idRol,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        passwordHash: bcrypt.hashSync(u.password, 10),
        activo: true,
      },
    });
    console.log(`[cloud-db] Usuario demo creado: ${u.email}`);
  }
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL no está definida.');
  }

  await syncSchema();

  const prisma = new PrismaClient();
  try {
    await migrateLegacyDemoEmails(prisma);
    await ensureMesasVirtuales(prisma);
    const userCount = await prisma.usuario.count();
    const forceSeed =
      process.env.DEMO_FORCE_SEED === 'true' ||
      process.env.DEMO_FORCE_SEED === '1';

    if (userCount === 0 || forceSeed) {
      console.log('[cloud-db] Cargando datos de demostración...');
      try {
        run('npx prisma db seed');
      } catch (seedError) {
        console.warn(
          '[cloud-db] Seed completo falló; creando usuarios demo mínimos...',
          seedError?.message ?? seedError,
        );
        await ensureDemoUsers(prisma);
      }
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
