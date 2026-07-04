/** Subtotal mínimo de ítems que no son sopa para activar el descuento de sopas. */
export const UMBRAL_SUBTOTAL_OTROS_COP = 50_000;

/** Mínimo de unidades de sopa para activar el descuento global de sopas. */
export const SOPAS_MIN_UNIDADES_DEFAULT = 2;

/** Mínimo de platos principales para el descuento de clientes camioneros. */
export const MULEROS_MIN_PLATOS_PRINCIPALES_DEFAULT = 1;

export type LineaDescuento = {
  cantidad: number;
  subtotal_linea: number;
  nombre_producto: string;
  categoria_nombre: string;
  id_categoria?: number;
  es_plato_principal?: boolean;
  participa_descuento_sopas?: boolean;
};

import {
  calcularDescuentoPromociones,
  type ReglaPromocionPorCategoria,
} from './promociones-pedido';

export type ConfigDescuentoCalc = {
  sopas_activo: boolean;
  sopas_monto_por_unidad: number;
  /** Mínimo de unidades de sopa para activar el descuento global. */
  sopas_min_unidades?: number;
  muleros_activo: boolean;
  /** Monto a rebajar por cada plato principal (cliente camionero). */
  muleros_monto_por_plato_principal: number;
  /** Mínimo de platos principales para activar el descuento de camioneros. */
  muleros_min_platos_principales?: number;
  /** Subtotal mínimo de ítems que no son sopa para activar descuento de sopas. */
  umbral_subtotal_otros?: number;
  /** Reglas adicionales configuradas por el admin (p. ej. promo por categoría). */
  reglas_promocion?: ReglaPromocionPorCategoria[];
};

function textoIncluye(texto: string, palabra: string): boolean {
  return texto.toLowerCase().includes(palabra.toLowerCase());
}

export function esLineaSopa(linea: LineaDescuento): boolean {
  if (linea.participa_descuento_sopas != null) {
    return linea.participa_descuento_sopas;
  }
  return (
    textoIncluye(linea.categoria_nombre, 'sopa') ||
    textoIncluye(linea.nombre_producto, 'sopa')
  );
}

function calcDescuentoSopas(
  lineas: LineaDescuento[],
  activo: boolean,
  montoPorUnidad: number,
  minUnidades: number,
  umbralOtros: number,
): number {
  if (!activo || montoPorUnidad <= 0) return 0;

  const cantSopas = lineas
    .filter(esLineaSopa)
    .reduce((s, l) => s + l.cantidad, 0);
  if (cantSopas < minUnidades) return 0;

  const otras = lineas.filter((l) => !esLineaSopa(l));
  if (otras.length === 0) return 0;

  const subtotalOtras = otras.reduce((s, l) => s + l.subtotal_linea, 0);
  if (subtotalOtras <= umbralOtros) return 0;

  return cantSopas * Math.round(montoPorUnidad);
}

/** Descuento para clientes camioneros: monto × cantidad de platos principales. */
function calcDescuentoMuleros(
  lineas: LineaDescuento[],
  activo: boolean,
  montoPorPlatoPrincipal: number,
  minPlatosPrincipales: number,
  clienteMulero: boolean,
): number {
  if (!clienteMulero || !activo || montoPorPlatoPrincipal <= 0) return 0;

  const cantPlatos = lineas
    .filter((l) => l.es_plato_principal)
    .reduce((s, l) => s + l.cantidad, 0);
  if (cantPlatos < minPlatosPrincipales) return 0;

  return cantPlatos * Math.round(montoPorPlatoPrincipal);
}

export function calcularDescuentosPedido(
  lineas: LineaDescuento[],
  config: ConfigDescuentoCalc,
  clienteMulero: boolean,
): {
  descuento_sopas: number;
  descuento_muleros: number;
  descuento_promociones: number;
  promociones_desglose: { id: string; etiqueta: string; monto: number }[];
} {
  const umbral =
    config.umbral_subtotal_otros ?? UMBRAL_SUBTOTAL_OTROS_COP;
  const sopasMin =
    config.sopas_min_unidades ?? SOPAS_MIN_UNIDADES_DEFAULT;
  const mulerosMin =
    config.muleros_min_platos_principales ??
    MULEROS_MIN_PLATOS_PRINCIPALES_DEFAULT;
  const promos = calcularDescuentoPromociones(
    lineas,
    config.reglas_promocion ?? [],
  );
  return {
    descuento_sopas: calcDescuentoSopas(
      lineas,
      config.sopas_activo,
      config.sopas_monto_por_unidad,
      Math.max(1, Math.round(sopasMin)),
      umbral,
    ),
    descuento_muleros: calcDescuentoMuleros(
      lineas,
      config.muleros_activo,
      config.muleros_monto_por_plato_principal,
      Math.max(1, Math.round(mulerosMin)),
      clienteMulero,
    ),
    descuento_promociones: promos.total,
    promociones_desglose: promos.desglose,
  };
}
