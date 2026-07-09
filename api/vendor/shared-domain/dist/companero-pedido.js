"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumenLineasPedido = resumenLineasPedido;
exports.tituloCompaneroModificoPedido = tituloCompaneroModificoPedido;
exports.verboCompaneroModificoPedido = verboCompaneroModificoPedido;
exports.mensajeCompaneroModificoPedido = mensajeCompaneroModificoPedido;
function resumenLineasPedido(lineas) {
    return lineas.map((l) => `${l.cantidad}× ${l.nombre_producto}`).join(', ');
}
function tituloCompaneroModificoPedido(accion = 'agregado') {
    if (accion === 'quitado')
        return 'Quitaron ítems de tu mesa';
    if (accion === 'reducido')
        return 'Redujeron ítems en tu mesa';
    return 'Tu mesa fue actualizada';
}
function verboCompaneroModificoPedido(accion = 'agregado') {
    if (accion === 'quitado')
        return 'quitó';
    if (accion === 'reducido')
        return 'redujo';
    return 'agregó';
}
function mensajeCompaneroModificoPedido(accion, meseroNombre, lineas, lugarMesa, pedidoId) {
    const verbo = verboCompaneroModificoPedido(accion);
    return `${meseroNombre} ${verbo} ${resumenLineasPedido(lineas)} en ${lugarMesa} · pedido #${pedidoId}`;
}
