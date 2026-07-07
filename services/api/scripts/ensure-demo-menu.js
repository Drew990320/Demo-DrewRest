/**
 * Pobla menú y categorías demo de forma idempotente (sin borrar pedidos ni usuarios).
 */
const {
  inferirReglasCategoriaDesdeNombre,
} = require('@la-reserva/shared-domain/categoria-reglas');
const { inferirTipoProteina } = require('@la-reserva/shared-domain/cocina-prioridad');
const {
  DEMO_CATEGORIAS,
  OMITIR_PERSONALIZACION,
  ADEREZOS,
  esCategoriaPersonalizable,
} = require('./demo-menu-data');

async function ensureDemoMesas(prisma) {
  for (let n = 1; n <= 15; n += 1) {
    await prisma.mesa.upsert({
      where: { numero: n },
      create: { numero: n, capacidad: 4, estado: 'libre' },
      update: {},
    });
  }
  for (const numero of [98, 99]) {
    await prisma.mesa.upsert({
      where: { numero },
      create: { numero, capacidad: 1, estado: 'libre' },
      update: {},
    });
  }
}

async function ensurePersonalizacionesProducto(prisma, idProducto) {
  const count = await prisma.personalizacionOpcion.count({
    where: { idProducto },
  });
  if (count > 0) return;

  await prisma.personalizacionOpcion.createMany({
    data: [
      ...OMITIR_PERSONALIZACION.map((descripcion) => ({
        idProducto,
        tipo: 'omitir_ingrediente',
        descripcion,
      })),
      ...ADEREZOS.map((descripcion) => ({
        idProducto,
        tipo: 'aderezo',
        descripcion,
      })),
    ],
  });
}

async function ensureDemoMenu(prisma) {
  let categoriasCreadas = 0;
  let productosCreados = 0;

  for (const cat of DEMO_CATEGORIAS) {
    const reglas = inferirReglasCategoriaDesdeNombre(cat.nombre);
    let categoria = await prisma.categoria.findFirst({
      where: { nombre: cat.nombre },
    });

    if (!categoria) {
      categoria = await prisma.categoria.create({
        data: {
          nombre: cat.nombre,
          ...cat.dias,
          esBebida: reglas.es_bebida,
          cobraEmpaqueParaLlevar: reglas.cobra_empaque_para_llevar,
          participaDescuentoSopas: reglas.participa_descuento_sopas,
          esLineaEmpaque: reglas.es_linea_empaque,
          visibleEnMostrador: reglas.visible_en_mostrador,
          tipoLineaCocinaDefault: reglas.tipo_linea_cocina_default,
          esPlatoPrincipalDefault: reglas.es_plato_principal_default,
          activo: true,
        },
      });
      categoriasCreadas += 1;
    }

    for (const p of cat.productos) {
      const existing = await prisma.producto.findFirst({
        where: { idCategoria: categoria.idCategoria, nombre: p.nombre },
      });
      if (existing) {
        if (esCategoriaPersonalizable(cat.nombre)) {
          await ensurePersonalizacionesProducto(prisma, existing.idProducto);
        }
        continue;
      }

      const producto = await prisma.producto.create({
        data: {
          idCategoria: categoria.idCategoria,
          nombre: p.nombre,
          descripcion: p.desc ?? null,
          precio: p.precio,
          activo: true,
          tipoProteina: inferirTipoProteina(cat.nombre, p.nombre),
          esPlatoPrincipal:
            cat.nombre.startsWith('Platos fuertes') || cat.nombre === 'Menú infantil',
          esEmpacable: cat.nombre === 'Empaque',
        },
      });
      productosCreados += 1;

      if (esCategoriaPersonalizable(cat.nombre)) {
        await ensurePersonalizacionesProducto(prisma, producto.idProducto);
      }
    }
  }

  await prisma.configOperativa.upsert({
    where: { id: 1 },
    create: { id: 1, mazorcaActiva: false },
    update: {},
  });

  return { categoriasCreadas, productosCreados };
}

module.exports = { ensureDemoMenu, ensureDemoMesas };
