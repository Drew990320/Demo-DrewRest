/** Catálogo demo de categorías y productos (mismo contenido que prisma/seed.ts). */

const ALL = {
  disponibleLunes: true,
  disponibleMartes: true,
  disponibleMiercoles: true,
  disponibleJueves: true,
  disponibleViernes: true,
  disponibleSabado: true,
  disponibleDomingo: true,
};

const PARA_COMPARTIR = {
  disponibleLunes: false,
  disponibleMartes: false,
  disponibleMiercoles: true,
  disponibleJueves: true,
  disponibleViernes: true,
  disponibleSabado: true,
  disponibleDomingo: false,
};

const SOLO_DOMINGO = {
  disponibleLunes: false,
  disponibleMartes: false,
  disponibleMiercoles: false,
  disponibleJueves: false,
  disponibleViernes: false,
  disponibleSabado: false,
  disponibleDomingo: true,
};

const DEMO_CATEGORIAS = [
  {
    nombre: 'Platos fuertes - Cerdo',
    dias: ALL,
    productos: [
      { nombre: 'Ribs de costillas al barril', precio: 32000 },
      { nombre: 'Bondiola al barril', precio: 30000 },
      { nombre: 'Lomo al barril', precio: 28000 },
      { nombre: 'Milanesa de cerdo (cubierta de jamón y queso)', precio: 32000 },
      { nombre: 'Solomito de cerdo', precio: 36000 },
    ],
  },
  {
    nombre: 'Platos fuertes - Pollo',
    dias: ALL,
    productos: [
      { nombre: 'Pechuga a la plancha', precio: 26000 },
      { nombre: 'Pollo apanado (filete de pechuga apanado)', precio: 28000 },
      {
        nombre: 'Milanesa de pollo (filete apanado, cubierto con jamón y queso)',
        precio: 32000,
      },
    ],
  },
  {
    nombre: 'Platos fuertes - Res / Mixto',
    dias: ALL,
    productos: [
      { nombre: 'Chata a la plancha', precio: 32000 },
      { nombre: 'Parrillada mixta (cortes de lomo, costilla y chorizo)', precio: 33000 },
    ],
  },
  {
    nombre: 'Menú infantil',
    dias: ALL,
    productos: [
      {
        nombre: 'Nuggets de pollo (trozos apanados + papas a la francesa)',
        precio: 17000,
      },
    ],
  },
  {
    nombre: 'Para compartir',
    dias: PARA_COMPARTIR,
    productos: [
      { nombre: 'Picada de la casa 250g', precio: 40000 },
      { nombre: 'Picada de la casa 500g', precio: 70000 },
    ],
  },
  {
    nombre: 'Entradas y adicionales',
    dias: ALL,
    productos: [
      { nombre: 'Entrada de chorizo', precio: 6000 },
      { nombre: 'Acompañamiento para dos', precio: 3000 },
      { nombre: 'Papas a la francesa', precio: 6000 },
      { nombre: 'Ensalada', precio: 3000 },
      { nombre: 'Porción de papa al vapor', precio: 1000 },
      { nombre: 'Porción de yuca al vapor', precio: 1000 },
      { nombre: 'Adicional de chorizo', precio: 6000 },
    ],
  },
  {
    nombre: 'Sopa del día',
    dias: SOLO_DOMINGO,
    productos: [{ nombre: 'Sopa del día', precio: 10000 }],
  },
  {
    nombre: 'Bebidas sin alcohol',
    dias: ALL,
    productos: [
      { nombre: 'Agua', precio: 2000 },
      { nombre: 'Jugos Hit 500 ml', precio: 4000 },
      { nombre: 'Gaseosa 250 ml', precio: 2500 },
      { nombre: 'Gaseosa 340 ml', precio: 4000 },
      { nombre: 'Soda 340 ml', precio: 4000 },
      { nombre: 'Gaseosa litrón', precio: 6000 },
      { nombre: 'Gaseosa 1.5 l pet', precio: 7000 },
      { nombre: 'Cocacola 1L', precio: 7000 },
      { nombre: 'Cocacola 1.5L', precio: 8000 },
      { nombre: 'Cocacola personal', precio: 4000 },
    ],
  },
  {
    nombre: 'Bebidas con alcohol',
    dias: ALL,
    productos: [
      { nombre: 'Poker', precio: 5000 },
      { nombre: 'Club Colombia', precio: 5500 },
    ],
  },
  {
    nombre: 'Empaque',
    dias: ALL,
    productos: [{ nombre: 'Empaque para llevar', precio: 1000 }],
  },
];

const OMITIR_PERSONALIZACION = ['Sin yuca', 'Sin papa', 'Sin ensalada'];
const ADEREZOS = ['Chipotle', 'Agridulce', 'Chimichurri'];

function esCategoriaPersonalizable(nombreCategoria) {
  return (
    nombreCategoria.startsWith('Platos fuertes') ||
    nombreCategoria === 'Menú infantil' ||
    nombreCategoria === 'Para compartir'
  );
}

module.exports = {
  DEMO_CATEGORIAS,
  OMITIR_PERSONALIZACION,
  ADEREZOS,
  esCategoriaPersonalizable,
};
