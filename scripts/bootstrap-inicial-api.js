const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function ensureRoles() {
  await prisma.rol.upsert({
    where: { nombre: "mesero" },
    update: {},
    create: { nombre: "mesero", descripcion: "Toma pedidos y factura" },
  });
  await prisma.rol.upsert({
    where: { nombre: "chef" },
    update: {},
    create: { nombre: "chef", descripcion: "Vista cocina" },
  });
  await prisma.rol.upsert({
    where: { nombre: "admin" },
    update: {},
    create: { nombre: "admin", descripcion: "Administracion" },
  });
}

async function ensureUsers() {
  const rolMesero = await prisma.rol.findUniqueOrThrow({ where: { nombre: "mesero" } });
  const rolChef = await prisma.rol.findUniqueOrThrow({ where: { nombre: "chef" } });
  const rolAdmin = await prisma.rol.findUniqueOrThrow({ where: { nombre: "admin" } });

  const defaults = [
    {
      idRol: rolMesero.idRol,
      nombre: "Mesero",
      apellido: "Demo",
      email: "mesero@restaurant.local",
      password: "mesero123",
    },
    {
      idRol: rolChef.idRol,
      nombre: "Chef",
      apellido: "Demo",
      email: "chef@restaurant.local",
      password: "chef123",
    },
    {
      idRol: rolAdmin.idRol,
      nombre: "Admin",
      apellido: "Demo",
      email: "admin@restaurant.local",
      password: "admin123",
    },
  ];

  const created = [];

  for (const u of defaults) {
    const exists = await prisma.usuario.findUnique({ where: { email: u.email } });
    if (exists) continue;
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.usuario.create({
      data: {
        idRol: u.idRol,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        passwordHash,
        activo: true,
      },
    });
    created.push({ email: u.email, password: u.password });
  }

  return created;
}

async function ensureMesas() {
  for (let n = 1; n <= 15; n++) {
    await prisma.mesa.upsert({
      where: { numero: n },
      update: {},
      create: {
        numero: n,
        capacidad: 4,
        estado: "libre",
      },
    });
  }
  await prisma.mesa.upsert({
    where: { numero: 98 },
    update: {},
    create: {
      numero: 98,
      capacidad: 1,
      estado: "libre",
    },
  });
  await prisma.mesa.upsert({
    where: { numero: 99 },
    update: {},
    create: {
      numero: 99,
      capacidad: 1,
      estado: "libre",
    },
  });
}

async function main() {
  await ensureRoles();
  const createdUsers = await ensureUsers();
  await ensureMesas();

  console.log("[bootstrap] Roles, usuarios y mesas base verificados.");
  if (createdUsers.length > 0) {
    console.log("[bootstrap] Se crearon usuarios iniciales:");
    for (const u of createdUsers) {
      console.log(`  - ${u.email} / ${u.password}`);
    }
  } else {
    console.log("[bootstrap] Usuarios iniciales ya existian (no se modificaron).");
  }
}

main()
  .catch((e) => {
    console.error("[bootstrap] Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
