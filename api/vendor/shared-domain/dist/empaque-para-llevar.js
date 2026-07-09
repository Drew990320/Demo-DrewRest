"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRECIO_EMPAQUE_PARA_LLEVAR_COP = void 0;
exports.esEmpacablePorCategoria = esEmpacablePorCategoria;
exports.flagsProductoMenuPorCategoria = flagsProductoMenuPorCategoria;
exports.productoCobraEmpaqueParaLlevarPorPlatoFuerte = productoCobraEmpaqueParaLlevarPorPlatoFuerte;
exports.cantidadEmpaqueVinculadaPadre = cantidadEmpaqueVinculadaPadre;
exports.nuevaCantidadEmpaqueTrasCambioPadre = nuevaCantidadEmpaqueTrasCambioPadre;
exports.empaqueFaltanteEnDetallePadre = empaqueFaltanteEnDetallePadre;
exports.resumenEmpaqueParaLlevar = resumenEmpaqueParaLlevar;
exports.empaqueCompartidoEnPedido = empaqueCompartidoEnPedido;
/** Precio de cada empaque automático en para llevar (un empaque por unidad). */
exports.PRECIO_EMPAQUE_PARA_LLEVAR_COP = 1000;
const categoria_reglas_1 = require("./categoria-reglas");
/** Solo los ítems de categoría marcada como línea empaque son empaque del sistema. */
function esEmpacablePorCategoria(categoria) {
    return (0, categoria_reglas_1.categoriaEsLineaEmpaque)(categoria);
}
/** Flags sugeridos al crear/editar productos en admin del menú. */
function flagsProductoMenuPorCategoria(categoria) {
    const r = (0, categoria_reglas_1.resolverReglasCategoria)(typeof categoria === 'string'
        ? { nombre: categoria }
        : categoria);
    if (r.es_linea_empaque) {
        return { es_plato_principal: false, es_empacable: true };
    }
    return {
        es_plato_principal: r.es_plato_principal_default,
        es_empacable: false,
    };
}
function esEmpacableProducto(p) {
    return p.es_empacable ?? p.esEmpacable ?? false;
}
function esPlatoPrincipalProducto(p) {
    return p.es_plato_principal ?? p.esPlatoPrincipal ?? false;
}
function reglasCategoriaProducto(p) {
    const nombre = p.categoria_nombre ?? p.categoria?.nombre ?? '';
    if (p.categoria) {
        return (0, categoria_reglas_1.resolverReglasCategoria)({ ...p.categoria, nombre });
    }
    return (0, categoria_reglas_1.resolverReglasCategoria)({ nombre });
}
/** Para llevar: un empaque por unidad de plato principal (flag o categoría típica). */
function productoCobraEmpaqueParaLlevarPorPlatoFuerte(p) {
    if (esEmpacableProducto(p))
        return false;
    const reglas = reglasCategoriaProducto(p);
    return (esPlatoPrincipalProducto(p) ||
        (0, categoria_reglas_1.categoriaCobraEmpaqueParaLlevar)(reglas));
}
function cantidadEmpaqueVinculadaPadre(idDetallePadre, detalles) {
    return detalles
        .filter((d) => d.id_detalle_padre === idDetallePadre && d.es_empacable)
        .reduce((sum, d) => sum + d.cantidad, 0);
}
/** Cantidad del hijo empaque tras cambiar la cantidad del plato padre. */
function nuevaCantidadEmpaqueTrasCambioPadre(cantidadEmpaque, cantidadPadreAnterior, cantidadPadreNueva) {
    if (cantidadPadreNueva > cantidadPadreAnterior) {
        const delta = cantidadPadreNueva - cantidadPadreAnterior;
        return Math.min(cantidadEmpaque + delta, cantidadPadreNueva);
    }
    return Math.min(cantidadEmpaque, cantidadPadreNueva);
}
/** Unidades de empaque que faltan en una línea de plato (0 = ok). */
function empaqueFaltanteEnDetallePadre(detalle, detalles) {
    if (detalle.id_detalle_padre != null)
        return 0;
    if (!productoCobraEmpaqueParaLlevarPorPlatoFuerte(detalle))
        return 0;
    const vinculado = cantidadEmpaqueVinculadaPadre(detalle.id_detalle, detalles);
    return Math.max(0, detalle.cantidad - vinculado);
}
/** Totales de empaque esperado vs asignado en un pedido para llevar. */
function resumenEmpaqueParaLlevar(modoServicio, detalles) {
    if (modoServicio !== 'para_llevar')
        return null;
    let unidadesPlato = 0;
    let unidadesEmpaque = 0;
    for (const d of detalles) {
        if (d.id_detalle_padre != null) {
            if (d.es_empacable)
                unidadesEmpaque += d.cantidad;
            continue;
        }
        if (!productoCobraEmpaqueParaLlevarPorPlatoFuerte(d))
            continue;
        unidadesPlato += d.cantidad;
    }
    return {
        unidades_plato: unidadesPlato,
        unidades_empaque: unidadesEmpaque,
        unidades_faltantes: Math.max(0, unidadesPlato - unidadesEmpaque),
    };
}
/** true cuando hay menos empaques que platos pero al menos uno (empaque compartido). */
function empaqueCompartidoEnPedido(resumen) {
    if (!resumen)
        return false;
    return (resumen.unidades_faltantes > 0 &&
        resumen.unidades_empaque > 0 &&
        resumen.unidades_plato > 0);
}
