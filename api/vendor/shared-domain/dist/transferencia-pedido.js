"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AYUDA_TRANSFERENCIA_PEDIDO = void 0;
exports.pedidoDebeTenerLineaMazorca = pedidoDebeTenerLineaMazorca;
exports.validarTransferenciaPedido = validarTransferenciaPedido;
const mesa_label_1 = require("./mesa-label");
const mazorca_pedido_1 = require("./mazorca-pedido");
const cocina_producto_1 = require("./cocina-producto");
const mazorca_pedido_2 = require("./mazorca-pedido");
function esRaiz(d) {
    const padre = d.id_detalle_padre ?? d.idDetallePadre;
    return padre == null;
}
function esMazorca(d) {
    return (0, mazorca_pedido_2.esDetalleMazorcaAcompanamiento)(d);
}
function pedidoDebeTenerLineaMazorca(mesaNumero, detalles, mazorcaActiva = true) {
    if (!(0, mazorca_pedido_1.pedidoUsaLineaMazorca)(mesaNumero, mazorcaActiva))
        return false;
    return detalles.some((d) => {
        if (!esRaiz(d))
            return false;
        if (esMazorca(d) || (d.es_empacable ?? d.esEmpacable))
            return false;
        if (d.es_bebida != null)
            return !d.es_bebida;
        return (0, cocina_producto_1.debeMarcarCocina)(d.categoria_nombre ?? '', false);
    });
}
const MSG_DESTINO_VIRTUAL = 'No se puede transferir a Para llevar, Mostrador ni Tienda. Cancela este pedido y abre uno nuevo allí.';
const MSG_ORIGEN_VIRTUAL = 'Los pedidos de Para llevar, Mostrador o Tienda no se transfieren. Usa «Cancelar pedido» si ya no aplica.';
const MSG_DESTINO_ANEXA = 'Esa mesa está agrupada a otro pedido. Desagrúpala antes de transferir aquí, o elige otra mesa.';
/**
 * Transferencia entre mesas físicas (no 98/99).
 * - Libre: mueve la cuenta y libera el origen.
 * - Ocupada: deja una segunda cuenta en el destino (como bebidas / para llevar), sin agrupar mesas.
 */
function validarTransferenciaPedido(input) {
    const { origen_mesa_numero: origen, destino_mesa_numero: destino, destino_libre: libre, destino_es_anexa: esAnexa = false, mesas_virtuales: mesasVirtuales, } = input;
    if ((0, mesa_label_1.esMesaVirtualNumero)(origen, mesasVirtuales)) {
        return { accion: 'rechazar', mensaje: MSG_ORIGEN_VIRTUAL };
    }
    if ((0, mesa_label_1.esMesaVirtualNumero)(destino, mesasVirtuales)) {
        return { accion: 'rechazar', mensaje: MSG_DESTINO_VIRTUAL };
    }
    if (esAnexa) {
        return { accion: 'rechazar', mensaje: MSG_DESTINO_ANEXA };
    }
    const lugar = (0, mesa_label_1.tituloLugarMesa)(destino, mesasVirtuales);
    if (libre) {
        return {
            accion: 'mover',
            mensaje_confirmacion: `¿Mover el pedido a ${lugar}? La mesa actual quedará libre si no hay más pedidos abiertos.`,
        };
    }
    return {
        accion: 'mover',
        mensaje_confirmacion: `¿Mover el pedido a ${lugar}? Quedará como cuenta separada junto al pedido que ya hay ahí (como en bebidas), sin agrupar mesas. La mesa actual quedará libre.`,
    };
}
exports.AYUDA_TRANSFERENCIA_PEDIDO = 'Elige mesa libre u ocupada. En ocupada queda como segunda cuenta (sin agrupar). Para llevar y mostrador: cancela y abre pedido nuevo.';
