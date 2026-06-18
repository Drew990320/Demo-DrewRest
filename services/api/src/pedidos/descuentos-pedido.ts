/** Subtotal mínimo de ítems que no son sopa para activar el descuento de sopas. */
export const UMBRAL_SUBTOTAL_OTROS_COP = 50_000;

export type LineaDescuento = {
  cantidad: number;
  subtotal_linea: number;
  nombre_producto: string;
  categoria_nombre: string;
  es_plato_principal?: boolean;
};

export type ConfigDescuentoCalc = {
  sopas_activo: boolean;
  sopas_monto_por_unidad: number;
  muleros_activo: boolean;
  /** Monto a rebajar por cada plato principal (cliente camionero). */
  muleros_monto_por_plato_principal: number;
};

function textoIncluye(texto: string, palabra: string): boolean {
  return texto.toLowerCase().includes(palabra.toLowerCase());
}

export function esLineaSopa(linea: LineaDescuento): boolean {
  return (
    textoIncluye(linea.categoria_nombre, 'sopa') ||
    textoIncluye(linea.nombre_producto, 'sopa')
  );
}

function calcDescuentoSopas(
  lineas: LineaDescuento[],
  activo: boolean,
  montoPorUnidad: number,
): number {
  if (!activo || montoPorUnidad <= 0) return 0;

  const cantSopas = lineas
    .filter(esLineaSopa)
    .reduce((s, l) => s + l.cantidad, 0);
  if (cantSopas <= 1) return 0;

  const otras = lineas.filter((l) => !esLineaSopa(l));
  if (otras.length === 0) return 0;

  const subtotalOtras = otras.reduce((s, l) => s + l.subtotal_linea, 0);
  if (subtotalOtras <= UMBRAL_SUBTOTAL_OTROS_COP) return 0;

  return cantSopas * Math.round(montoPorUnidad);
}

/** Descuento para clientes camioneros: monto × cantidad de platos principales. */
function calcDescuentoMuleros(
  lineas: LineaDescuento[],
  activo: boolean,
  montoPorPlatoPrincipal: number,
  clienteMulero: boolean,
): number {
  if (!clienteMulero || !activo || montoPorPlatoPrincipal <= 0) return 0;

  const cantPlatos = lineas
    .filter((l) => l.es_plato_principal)
    .reduce((s, l) => s + l.cantidad, 0);
  if (cantPlatos <= 0) return 0;

  return cantPlatos * Math.round(montoPorPlatoPrincipal);
}

export function calcularDescuentosPedido(
  lineas: LineaDescuento[],
  config: ConfigDescuentoCalc,
  clienteMulero: boolean,
): { descuento_sopas: number; descuento_muleros: number } {
  return {
    descuento_sopas: calcDescuentoSopas(
      lineas,
      config.sopas_activo,
      config.sopas_monto_por_unidad,
    ),
    descuento_muleros: calcDescuentoMuleros(
      lineas,
      config.muleros_activo,
      config.muleros_monto_por_plato_principal,
      clienteMulero,
    ),
  };
}
