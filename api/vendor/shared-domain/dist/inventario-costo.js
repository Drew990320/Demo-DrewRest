"use strict";
/**
 * Valoración de inventario y análisis de rentabilidad de recetas/productos.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularCostoPromedioPonderado = calcularCostoPromedioPonderado;
exports.calcularCostoUnitarioDesdeCompra = calcularCostoUnitarioDesdeCompra;
exports.analizarRentabilidadReceta = analizarRentabilidadReceta;
const inventario_unidades_1 = require("./inventario-unidades");
/**
 * Promedio ponderado tras una compra.
 * Si stock anterior ≤ 0 o qty inválida, usa el costo de la entrada.
 */
function calcularCostoPromedioPonderado(input) {
    const stock = Number(input.stockAnterior);
    const costoAnt = Number(input.costoAnterior);
    const qty = Number(input.qtyEntrada);
    const costoEnt = Number(input.costoEntrada);
    if (!Number.isFinite(qty) || qty <= 0) {
        return Number.isFinite(costoAnt) && costoAnt >= 0 ? costoAnt : 0;
    }
    if (!Number.isFinite(costoEnt) || costoEnt < 0) {
        return Number.isFinite(costoAnt) && costoAnt >= 0 ? costoAnt : 0;
    }
    if (!Number.isFinite(stock) || stock <= 0) {
        return costoEnt;
    }
    const costoPrev = Number.isFinite(costoAnt) && costoAnt >= 0 ? costoAnt : 0;
    const total = stock + qty;
    if (total <= 0)
        return costoEnt;
    const promedio = (stock * costoPrev + qty * costoEnt) / total;
    return Math.round(promedio * 10000) / 10000;
}
/**
 * Costo por unidad de stock a partir del precio del empaque.
 * Ej.: bolsa $20.000 / 10 panes → $2.000/u
 * Ej.: 5 kg a $80.000, stock en g → $16/g
 */
function calcularCostoUnitarioDesdeCompra(input) {
    const precio = Number(input.precio_compra);
    const cant = Number(input.cantidad_compra);
    if (!Number.isFinite(precio) || precio < 0)
        return null;
    if (!Number.isFinite(cant) || cant <= 0)
        return null;
    const origen = (input.unidad_compra ?? '').trim();
    const destino = (input.unidad_stock ?? '').trim();
    if (!origen || !destino)
        return null;
    if (origen.toLowerCase() === destino.toLowerCase()) {
        return Math.round((precio / cant) * 10000) / 10000;
    }
    const conv = (0, inventario_unidades_1.convertirCantidad)(cant, origen, destino, input.conversiones ?? []);
    if (!conv.ok || conv.cantidad <= 0)
        return null;
    return Math.round((precio / conv.cantidad) * 10000) / 10000;
}
/**
 * Rentabilidad de un producto a partir de costo de receta y precio de venta.
 * Margen % = (ganancia / precio_venta) × 100.
 */
function analizarRentabilidadReceta(costoProduccion, precioVenta, opts) {
    const costo = Number.isFinite(costoProduccion) && costoProduccion >= 0
        ? Math.round(costoProduccion)
        : 0;
    const precio = Number.isFinite(precioVenta) && precioVenta >= 0
        ? Math.round(precioVenta)
        : 0;
    const ganancia = precio - costo;
    if (precio <= 0) {
        const objetivo = opts?.margen_objetivo_pct;
        let precioSugerido = null;
        if (objetivo != null &&
            Number.isFinite(objetivo) &&
            objetivo > 0 &&
            objetivo < 100 &&
            costo > 0) {
            precioSugerido = Math.ceil(costo / (1 - objetivo / 100));
        }
        return {
            costo_produccion: costo,
            precio_venta: precio,
            ganancia,
            margen_pct: null,
            semaforo: 'sin_precio',
            precio_sugerido: precioSugerido,
        };
    }
    const margenPct = Math.round(((ganancia / precio) * 100 + Number.EPSILON) * 100) / 100;
    const alto = opts?.umbrales?.alto_min_pct ?? 50;
    const medio = opts?.umbrales?.medio_min_pct ?? 30;
    let semaforo = 'bajo';
    if (margenPct >= alto)
        semaforo = 'alto';
    else if (margenPct >= medio)
        semaforo = 'medio';
    const objetivo = opts?.margen_objetivo_pct;
    let precioSugerido = null;
    if (objetivo != null &&
        Number.isFinite(objetivo) &&
        objetivo > 0 &&
        objetivo < 100 &&
        costo > 0) {
        precioSugerido = Math.ceil(costo / (1 - objetivo / 100));
    }
    return {
        costo_produccion: costo,
        precio_venta: precio,
        ganancia,
        margen_pct: margenPct,
        semaforo,
        precio_sugerido: precioSugerido,
    };
}
