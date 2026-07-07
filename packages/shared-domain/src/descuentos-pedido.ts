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
  id_producto?: number;
  precio_unitario?: number;
  es_plato_principal?: boolean;
  participa_descuento_sopas?: boolean;
};

import {
  calcularDescuentoPromociones,
  ETIQUETA_LEGACY_MULERO,
  migrarLegacyConfigPromociones,
  type ConfigPromocionesLegacy,
  type DesglosePromocion,
  type EtiquetaPromocionPedido,
  type ReglaPromocion,
} from './promociones-pedido';

export type { DesglosePromocion, EtiquetaPromocionPedido, ReglaPromocion };

export type ConfigDescuentoCalc = ConfigPromocionesLegacy & {
  reglas_promocion?: ReglaPromocion[];
  etiquetas_pedido?: EtiquetaPromocionPedido[];
};

export type ContextoDescuentosPedido = {
  /** Etiquetas activas en el pedido (convenio, cliente especial, etc.). */
  etiquetas_promocion?: string[];
  /** Compatibilidad: equivale a incluir `cliente_especial` en etiquetas. */
  cliente_mulero?: boolean;
};

function etiquetasEfectivas(ctx: ContextoDescuentosPedido): string[] {
  const set = new Set(ctx.etiquetas_promocion ?? []);
  if (ctx.cliente_mulero) {
    set.add(ETIQUETA_LEGACY_MULERO);
  }
  return [...set];
}

function reglasEfectivas(config: ConfigDescuentoCalc): ReglaPromocion[] {
  const migrado = migrarLegacyConfigPromociones(config);
  const parsed = config.reglas_promocion;
  if (Array.isArray(parsed) && parsed.length > 0) {
    const fromConfig = parsed as ReglaPromocion[];
    const ids = new Set(fromConfig.map((r) => r.id));
    for (const r of migrado.reglas) {
      if (!ids.has(r.id)) fromConfig.push(r);
    }
    return fromConfig;
  }
  return migrado.reglas;
}

/** @deprecated Usar flag de categoría o `lineaMarcadaPromo` en promociones-pedido. */
export function esLineaSopa(linea: LineaDescuento): boolean {
  if (linea.participa_descuento_sopas != null) {
    return linea.participa_descuento_sopas;
  }
  const cat = (linea.categoria_nombre ?? '').toLowerCase();
  const nom = (linea.nombre_producto ?? '').toLowerCase();
  return cat.includes('sopa') || nom.includes('sopa');
}

export function resolverConfigPromociones(config: ConfigDescuentoCalc): {
  reglas_promocion: ReglaPromocion[];
  etiquetas_pedido: EtiquetaPromocionPedido[];
} {
  const migrado = migrarLegacyConfigPromociones(config);
  const reglas =
    Array.isArray(config.reglas_promocion) && config.reglas_promocion.length > 0
      ? (() => {
          const fromConfig = config.reglas_promocion as ReglaPromocion[];
          const ids = new Set(fromConfig.map((r) => r.id));
          for (const r of migrado.reglas) {
            if (!ids.has(r.id)) fromConfig.push(r);
          }
          return fromConfig;
        })()
      : migrado.reglas;
  const etiquetas =
    Array.isArray(config.etiquetas_pedido) && config.etiquetas_pedido.length > 0
      ? config.etiquetas_pedido
      : migrado.etiquetas_pedido;
  return { reglas_promocion: reglas, etiquetas_pedido: etiquetas };
}

export function calcularDescuentosPedido(
  lineas: LineaDescuento[],
  config: ConfigDescuentoCalc,
  ctx: ContextoDescuentosPedido | boolean = {},
): {
  descuento_sopas: number;
  descuento_muleros: number;
  descuento_promociones: number;
  promociones_desglose: DesglosePromocion[];
} {
  const contexto: ContextoDescuentosPedido =
    typeof ctx === 'boolean' ? { cliente_mulero: ctx } : ctx;
  const reglas = reglasEfectivas(config);
  const promo = calcularDescuentoPromociones(
    lineas,
    reglas,
    etiquetasEfectivas(contexto),
  );
  return {
    descuento_sopas: 0,
    descuento_muleros: 0,
    descuento_promociones: promo.total,
    promociones_desglose: promo.desglose,
  };
}
