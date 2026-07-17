"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consolidarMovimientos = consolidarMovimientos;
exports.calcularConsumoReceta = calcularConsumoReceta;
exports.calcularCostoReceta = calcularCostoReceta;
const inventario_unidades_1 = require("./inventario-unidades");
function resolverArticuloLinea(linea, sustitucionElegida) {
    if (linea.id_articulo != null)
        return linea.id_articulo;
    if (sustitucionElegida != null)
        return sustitucionElegida;
    const alt = linea.sustituciones?.[0];
    return alt?.id_articulo ?? null;
}
function expandirLinea(linea, porciones, articulos, recetas, conversiones, sustitucionesPorLinea, visitadas) {
    const errores = [];
    const movimientos = [];
    let costo = 0;
    if (linea.id_subreceta) {
        if (visitadas.has(linea.id_subreceta)) {
            errores.push({
                codigo: 'subreceta_desconocida',
                mensaje: `Subreceta circular: ${linea.id_subreceta}`,
                id_linea: linea.id_linea,
            });
            return { movimientos, costo, errores };
        }
        const sub = recetas.get(linea.id_subreceta);
        if (!sub) {
            errores.push({
                codigo: 'subreceta_desconocida',
                mensaje: `Subreceta no encontrada: ${linea.id_subreceta}`,
                id_linea: linea.id_linea,
            });
            return { movimientos, costo, errores };
        }
        const subPorciones = porciones * linea.cantidad;
        const nested = visitadas;
        nested.add(linea.id_subreceta);
        const r = calcularConsumoRecetaInterno(sub, subPorciones, articulos, recetas, conversiones, sustitucionesPorLinea, nested);
        if (!r.ok)
            return { movimientos, costo, errores: r.errores };
        movimientos.push(...r.movimientos);
        costo += r.costo_total;
        return { movimientos, costo, errores };
    }
    const idArt = resolverArticuloLinea(linea, sustitucionesPorLinea.get(linea.id_linea));
    if (idArt == null) {
        if (linea.opcional)
            return { movimientos, costo, errores };
        errores.push({
            codigo: 'linea_sin_articulo',
            mensaje: 'Línea de receta sin artículo ni sustitución',
            id_linea: linea.id_linea,
        });
        return { movimientos, costo, errores };
    }
    const art = articulos.get(idArt);
    if (!art || art.activo === false) {
        errores.push({
            codigo: 'articulo_desconocido',
            mensaje: `Artículo ${idArt} no disponible`,
            id_linea: linea.id_linea,
        });
        return { movimientos, costo, errores };
    }
    let cantidadLinea = linea.cantidad * porciones;
    const sust = linea.sustituciones?.find((s) => s.id_articulo === idArt);
    if (sust?.factor != null)
        cantidadLinea *= sust.factor;
    const conv = (0, inventario_unidades_1.convertirCantidad)(cantidadLinea, linea.unidad, art.unidad_stock, conversiones);
    if (!conv.ok) {
        errores.push({
            codigo: 'conversion_fallida',
            mensaje: conv.error.mensaje,
            id_linea: linea.id_linea,
        });
        return { movimientos, costo, errores };
    }
    const delta = -(0, inventario_unidades_1.redondearInventario)(conv.cantidad);
    const costoUnit = art.costo_unitario ?? 0;
    movimientos.push({
        id_articulo: idArt,
        tipo_mov: 'consumo_receta',
        delta,
        unidad: art.unidad_stock,
        costo_unitario: costoUnit,
        modulo_origen: 'cocina',
        observacion: `Receta ${linea.id_linea}`,
    });
    costo += Math.abs(delta) * costoUnit;
    return { movimientos, costo, errores };
}
function calcularConsumoRecetaInterno(receta, porciones, articulos, recetas, conversiones, sustitucionesPorLinea, visitadas) {
    if (!receta.lineas.length) {
        return {
            ok: false,
            errores: [{ codigo: 'receta_vacia', mensaje: 'La receta no tiene líneas' }],
        };
    }
    const movimientos = [];
    const errores = [];
    let costo_total = 0;
    for (const linea of receta.lineas) {
        const r = expandirLinea(linea, porciones, articulos, recetas, conversiones, sustitucionesPorLinea, visitadas);
        movimientos.push(...r.movimientos);
        costo_total += r.costo;
        errores.push(...r.errores);
    }
    if (errores.length)
        return { ok: false, errores };
    return {
        ok: true,
        movimientos: consolidarMovimientos(movimientos),
        costo_total: (0, inventario_unidades_1.redondearInventario)(costo_total),
    };
}
/** Agrupa deltas del mismo artículo en un solo movimiento planificado. */
function consolidarMovimientos(movimientos) {
    const map = new Map();
    for (const m of movimientos) {
        const prev = map.get(m.id_articulo);
        if (!prev) {
            map.set(m.id_articulo, { ...m });
            continue;
        }
        map.set(m.id_articulo, {
            ...prev,
            delta: (0, inventario_unidades_1.redondearInventario)(prev.delta + m.delta),
        });
    }
    return [...map.values()].filter((m) => m.delta !== 0);
}
function calcularConsumoReceta(receta, porciones, articulos, recetas = new Map(), conversiones = [], sustitucionesPorLinea = new Map()) {
    return calcularConsumoRecetaInterno(receta, porciones, articulos, recetas, conversiones, sustitucionesPorLinea, new Set([receta.id_receta]));
}
function calcularCostoReceta(receta, articulos, recetas = new Map(), conversiones = []) {
    const r = calcularConsumoReceta(receta, 1, articulos, recetas, conversiones);
    return r.ok ? r.costo_total : 0;
}
