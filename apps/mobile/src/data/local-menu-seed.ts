/**
 * Catálogo local (1 mesero) — mismo contenido que `services/api/prisma/seed.ts`.
 * Incluye personalizaciones en platos fuertes (omitir / aderezos).
 */
import type { TipoLineaCocinaCategoria } from '@la-reserva/shared-domain/categoria-reglas';
import { inferirReglasCategoriaDesdeNombre } from '@la-reserva/shared-domain/categoria-reglas';
import type { Producto } from '../lib/local-api-types';
import { inferirTipoProteina } from '../lib/cocina-prioridad';

const omitir = ['Sin yuca', 'Sin papa', 'Sin ensalada', 'Sin mazorca'];
const aderezos = ['Chipotle', 'Agridulce', 'Chimichurri'];

export type DiasCategoria = {
  disponible_lunes: boolean;
  disponible_martes: boolean;
  disponible_miercoles: boolean;
  disponible_jueves: boolean;
  disponible_viernes: boolean;
  disponible_sabado: boolean;
  disponible_domingo: boolean;
};

export type CategoriaLocal = {
  id_categoria: number;
  nombre: string;
  icono_menu?: string | null;
  activo?: boolean;
} & DiasCategoria & {
  es_bebida: boolean;
  cobra_empaque_para_llevar: boolean;
  participa_descuento_sopas: boolean;
  es_linea_empaque: boolean;
  visible_en_mostrador: boolean;
  tipo_linea_cocina_default: TipoLineaCocinaCategoria;
  es_plato_principal_default: boolean;
};

const ALL: DiasCategoria = {
  disponible_lunes: true,
  disponible_martes: true,
  disponible_miercoles: true,
  disponible_jueves: true,
  disponible_viernes: true,
  disponible_sabado: true,
  disponible_domingo: true,
};

const PARA_COMPARTIR: DiasCategoria = {
  disponible_lunes: false,
  disponible_martes: false,
  disponible_miercoles: true,
  disponible_jueves: true,
  disponible_viernes: true,
  disponible_sabado: true,
  disponible_domingo: false,
};

const SOLO_DOMINGO: DiasCategoria = {
  disponible_lunes: false,
  disponible_martes: false,
  disponible_miercoles: false,
  disponible_jueves: false,
  disponible_viernes: false,
  disponible_sabado: false,
  disponible_domingo: true,
};

type CatRow = {
  nombre: string;
  dias: DiasCategoria;
  items: { nombre: string; precio: number }[];
};

const CATEGORIAS: CatRow[] = [
  {
    nombre: 'Platos fuertes - Cerdo',
    dias: ALL,
    items: [
      { nombre: 'Ribs de costillas al barril', precio: 32000 },
      { nombre: 'Bondiola al barril', precio: 30000 },
      { nombre: 'Lomo al barril', precio: 28000 },
      {
        nombre: 'Milanesa de cerdo (cubierta de jamón y queso)',
        precio: 32000,
      },
      { nombre: 'Solomito de cerdo', precio: 36000 },
    ],
  },
  {
    nombre: 'Platos fuertes - Pollo',
    dias: ALL,
    items: [
      { nombre: 'Pechuga a la plancha', precio: 26000 },
      { nombre: 'Pollo apanado (filete de pechuga apanado)', precio: 28000 },
      {
        nombre:
          'Milanesa de pollo (filete apanado, cubierto con jamón y queso)',
        precio: 32000,
      },
    ],
  },
  {
    nombre: 'Platos fuertes - Res / Mixto',
    dias: ALL,
    items: [
      { nombre: 'Chata a la plancha', precio: 32000 },
      {
        nombre: 'Parrillada mixta (cortes de lomo, costilla y chorizo)',
        precio: 33000,
      },
    ],
  },
  {
    nombre: 'Menú infantil',
    dias: ALL,
    items: [
      {
        nombre: 'Nuggets de pollo (trozos apanados + papas a la francesa)',
        precio: 17000,
      },
    ],
  },
  {
    nombre: 'Para compartir',
    dias: PARA_COMPARTIR,
    items: [
      { nombre: 'Picada de la casa 250g', precio: 40000 },
      { nombre: 'Picada de la casa 500g', precio: 70000 },
    ],
  },
  {
    nombre: 'Entradas y adicionales',
    dias: ALL,
    items: [
      { nombre: 'Entrada de chorizo', precio: 6000 },
      { nombre: 'Mazorca para dos', precio: 3000 },
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
    items: [{ nombre: 'Sopa del día', precio: 10000 }],
  },
  {
    nombre: 'Bebidas sin alcohol',
    dias: ALL,
    items: [
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
    items: [
      { nombre: 'Poker', precio: 5000 },
      { nombre: 'Club Colombia', precio: 5500 },
    ],
  },
  {
    nombre: 'Empaque',
    dias: ALL,
    items: [{ nombre: 'Empaque para llevar', precio: 1000 }],
  },
];

export function buildLocalCategorias(): CategoriaLocal[] {
  return CATEGORIAS.map((cat, i) => {
    const { nombre: _n, ...reglas } = inferirReglasCategoriaDesdeNombre(cat.nombre);
    return {
      id_categoria: i + 1,
      nombre: cat.nombre,
      ...cat.dias,
      ...reglas,
    };
  });
}

export function buildLocalMenuProductos(): Producto[] {
  const productos: Producto[] = [];
  let idProducto = 1;
  let idOpcion = 1;

  for (let ci = 0; ci < CATEGORIAS.length; ci++) {
    const cat = CATEGORIAS[ci];
    const id_categoria = ci + 1;
    for (const it of cat.items) {
      const opciones: Producto['opciones'] = [];
      if (
        cat.nombre.startsWith('Platos fuertes') ||
        cat.nombre === 'Menú infantil' ||
        cat.nombre === 'Para compartir'
      ) {
        for (const d of omitir) {
          opciones.push({
            id_opcion: idOpcion++,
            tipo: 'omitir_ingrediente',
            descripcion: d,
          });
        }
        for (const d of aderezos) {
          opciones.push({
            id_opcion: idOpcion++,
            tipo: 'aderezo',
            descripcion: d,
          });
        }
      }
      productos.push({
        id_producto: idProducto++,
        id_categoria,
        categoria_nombre: cat.nombre,
        nombre: it.nombre,
        precio: it.precio,
        tipo_proteina: inferirTipoProteina(cat.nombre, it.nombre),
        es_plato_principal:
          cat.nombre.startsWith('Platos fuertes') ||
          cat.nombre === 'Menú infantil',
        es_empacable: cat.nombre === 'Empaque',
        es_acompanamiento_mazorca: false,
        opciones,
      });
    }
    if (cat.nombre === 'Entradas y adicionales') {
      productos.push({
        id_producto: idProducto++,
        id_categoria,
        categoria_nombre: cat.nombre,
        nombre: 'Mazorca (acompañamiento)',
        precio: 0,
        tipo_proteina: 'ninguno',
        es_plato_principal: false,
        es_empacable: false,
        es_acompanamiento_mazorca: true,
        opciones: [],
      });
    }
  }

  return productos;
}
