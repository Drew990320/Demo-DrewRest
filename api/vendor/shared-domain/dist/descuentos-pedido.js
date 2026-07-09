"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MULEROS_MIN_PLATOS_PRINCIPALES_DEFAULT = exports.SOPAS_MIN_UNIDADES_DEFAULT = exports.UMBRAL_SUBTOTAL_OTROS_COP = void 0;
exports.esLineaSopa = esLineaSopa;
exports.resolverConfigPromociones = resolverConfigPromociones;
exports.calcularDescuentosPedido = calcularDescuentosPedido;
/** Subtotal mínimo de ítems que no son sopa para activar el descuento de sopas. */
exports.UMBRAL_SUBTOTAL_OTROS_COP = 50000;
/** Mínimo de unidades de sopa para activar el descuento global de sopas. */
exports.SOPAS_MIN_UNIDADES_DEFAULT = 2;
/** Mínimo de platos principales para el descuento de clientes camioneros. */
exports.MULEROS_MIN_PLATOS_PRINCIPALES_DEFAULT = 1;
const promociones_pedido_1 = require("./promociones-pedido");
function etiquetasEfectivas(ctx) {
    const set = new Set(ctx.etiquetas_promocion ?? []);
    if (ctx.cliente_mulero) {
        set.add(promociones_pedido_1.ETIQUETA_LEGACY_MULERO);
    }
    return [...set];
}
function reglasEfectivas(config) {
    const migrado = (0, promociones_pedido_1.migrarLegacyConfigPromociones)(config);
    const parsed = config.reglas_promocion;
    if (Array.isArray(parsed) && parsed.length > 0) {
        const fromConfig = parsed;
        const ids = new Set(fromConfig.map((r) => r.id));
        for (const r of migrado.reglas) {
            if (!ids.has(r.id))
                fromConfig.push(r);
        }
        return fromConfig;
    }
    return migrado.reglas;
}
/** @deprecated Usar flag de categoría o `lineaMarcadaPromo` en promociones-pedido. */
function esLineaSopa(linea) {
    if (linea.participa_descuento_sopas != null) {
        return linea.participa_descuento_sopas;
    }
    const cat = (linea.categoria_nombre ?? '').toLowerCase();
    const nom = (linea.nombre_producto ?? '').toLowerCase();
    return cat.includes('sopa') || nom.includes('sopa');
}
function resolverConfigPromociones(config) {
    const migrado = (0, promociones_pedido_1.migrarLegacyConfigPromociones)(config);
    const reglas = Array.isArray(config.reglas_promocion) && config.reglas_promocion.length > 0
        ? (() => {
            const fromConfig = config.reglas_promocion;
            const ids = new Set(fromConfig.map((r) => r.id));
            for (const r of migrado.reglas) {
                if (!ids.has(r.id))
                    fromConfig.push(r);
            }
            return fromConfig;
        })()
        : migrado.reglas;
    const etiquetas = Array.isArray(config.etiquetas_pedido) && config.etiquetas_pedido.length > 0
        ? config.etiquetas_pedido
        : migrado.etiquetas_pedido;
    return { reglas_promocion: reglas, etiquetas_pedido: etiquetas };
}
function calcularDescuentosPedido(lineas, config, ctx = {}) {
    const contexto = typeof ctx === 'boolean' ? { cliente_mulero: ctx } : ctx;
    const reglas = reglasEfectivas(config);
    const promo = (0, promociones_pedido_1.calcularDescuentoPromociones)(lineas, reglas, etiquetasEfectivas(contexto));
    return {
        descuento_sopas: 0,
        descuento_muleros: 0,
        descuento_promociones: promo.total,
        promociones_desglose: promo.desglose,
    };
}
