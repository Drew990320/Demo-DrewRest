/**
 * Prepara la BD en Render: migrate deploy en BD existente, o bootstrap en BD vacía/demo.
 * La primera migración del historial asume tablas base (creadas antes con db push).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { ensureTenantBaseData } = require('./render-bootstrap-data');

const migrationsDir = path.join(__dirname, 'migrations');

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

function runCapture(cmd) {
  return execSync(cmd, { encoding: 'utf8', env: process.env });
}

function listMigrationNames() {
  return fs
    .readdirSync(migrationsDir)
    .filter((name) => fs.statSync(path.join(migrationsDir, name)).isDirectory())
    .sort();
}

function failedMigrationNames(output) {
  const names = new Set();
  for (const match of output.matchAll(/`([^`]+)` migration/g)) {
    names.add(match[1]);
  }
  return [...names];
}

function bootstrapFreshDatabase() {
  console.log('Bootstrapping database from schema.prisma...');
  run('npx prisma db push --accept-data-loss');

  console.log('Marking packaged migrations as applied...');
  for (const name of listMigrationNames()) {
    try {
      run(`npx prisma migrate resolve --applied "${name}"`);
    } catch {
      console.log(`  (skip) ${name}`);
    }
  }
}

function tryMigrateDeploy() {
  try {
    const output = runCapture('npx prisma migrate deploy');
    process.stdout.write(output);
    return;
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}${error.message ?? ''}`;
    process.stdout.write(output);

    for (const name of failedMigrationNames(output)) {
      console.log(`Resolving failed migration as rolled back: ${name}`);
      run(`npx prisma migrate resolve --rolled-back "${name}"`);
    }

    if (/P3009|failed migrations|does not exist|no existe la relaci/i.test(output)) {
      bootstrapFreshDatabase();
      run('npx prisma migrate deploy');
      return;
    }

    throw error;
  }
}

async function main() {
  tryMigrateDeploy();

  const prisma = new PrismaClient();
  try {
    await ensureTenantBaseData(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
