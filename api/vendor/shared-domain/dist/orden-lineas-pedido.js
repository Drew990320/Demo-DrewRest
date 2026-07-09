"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seccionLineaPedido = seccionLineaPedido;
exports.ordenSeccionLineaPedido = ordenSeccionLineaPedido;
exports.compararLineasPedidoPorSeccion = compararLineasPedidoPorSeccion;
exports.ordenarLineasPedidoPorSeccion = ordenarLineasPedidoPorSeccion;
const categoria_reglas_1 = require("./categoria-reglas");
const mazorca_pedido_1 = require("./mazorca-pedido");
const ORDEN_SECCION = {
    mazorca: 0,
    plato_fuerte: 1,
    menu_infantil: 2,
    entrada: 3,
    bebida: 4,
    empacable: 5,
};
function categoriaEsMenuInfantil(cat) {
    const c = (cat ?? '').trim().toLowerCase();
    return c === 'menú infantil' || c === 'menu infantil';
}
function categoriaEsPlatoFuerte(cat, esPlatoPrincipal) {
    if (esPlatoPrincipal)
        return true;
    return (cat ?? '').trim().startsWith('Platos fuertes');
}
function categoriaEsEntrada(cat) {
    const c = (cat ?? '').trim().toLowerCase();
    return c.includes('entrada') || c.includes('adicional');
}
function seccionLineaPedido(d) {
    if ((0, mazorca_pedido_1.esDetalleMazorcaAcompanamiento)(d)) {
        return 'mazorca';
    }
    const empacable = Boolean(d.es_empacable ?? d.esEmpacable);
    const cat = d.categoria_nombre ?? '';
    if (empacable || (0, categoria_reglas_1.categoriaEsLineaEmpaque)(cat)) {
        return 'empacable';
    }
    const bebida = d.es_bebida ?? d.esBebida;
    if (bebida === true || (0, categoria_reglas_1.categoriaEsBebida)(cat)) {
        return 'bebida';
    }
    if (categoriaEsPlatoFuerte(cat, d.es_plato_principal ?? d.esPlatoPrincipal)) {
        return 'plato_fuerte';
    }
    if (categoriaEsMenuInfantil(cat)) {
        return 'menu_infantil';
    }
    if (categoriaEsEntrada(cat)) {
        return 'entrada';
    }
    // Sopa, para compartir, etc.: con entradas, antes de bebidas.
    return 'entrada';
}
function ordenSeccionLineaPedido(seccion) {
    return ORDEN_SECCION[seccion];
}
function compararLineasPedidoPorSeccion(a, b) {
    const sa = ordenSeccionLineaPedido(seccionLineaPedido(a));
    const sb = ordenSeccionLineaPedido(seccionLineaPedido(b));
    if (sa !== sb)
        return sa - sb;
    return (a.id_detalle ?? 0) - (b.id_detalle ?? 0);
}
function ordenarLineasPedidoPorSeccion(detalles) {
    return [...detalles].sort(compararLineasPedidoPorSeccion);
}
