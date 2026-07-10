"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AYUDA_AGRUPACION_MESAS = void 0;
exports.pedidoTieneLineasEnviadasCocina = pedidoTieneLineasEnviadasCocina;
exports.validarAgruparMesaAlPedido = validarAgruparMesaAlPedido;
exports.validarDesagruparMesa = validarDesagruparMesa;
exports.etiquetaMesasAgrupadas = etiquetaMesasAgrupadas;
const mesa_label_1 = require("./mesa-label");
function enviadoCocina(d) {
    return Boolean(d.enviado_cocina ?? d.enviadoCocina);
}
function pedidoTieneLineasEnviadasCocina(detalles) {
    return detalles.some(enviadoCocina);
}
/** Agrupa una mesa libre al pedido de la mesa principal (ocupada). */
function validarAgruparMesaAlPedido(input) {
    const { mesa_principal_numero: principal, mesa_anexa_numero: anexa, mesa_anexa_libre: libre, mesas_virtuales: mv, } = input;
    if (principal === anexa) {
        return { accion: 'rechazar', mensaje: 'No puedes agrupar la mesa consigo misma.' };
    }
    if ((0, mesa_label_1.esMesaVirtualNumero)(principal, mv) || (0, mesa_label_1.esMesaVirtualNumero)(anexa, mv)) {
        return {
            accion: 'rechazar',
            mensaje: 'No se agrupan mesas virtuales (mostrador o para llevar).',
        };
    }
    if (!libre) {
        return {
            accion: 'rechazar',
            mensaje: 'La mesa adicional debe estar libre (sin pedido abierto).',
        };
    }
    return {
        accion: 'agrupar',
        mensaje_confirmacion: `¿Agrupar ${(0, mesa_label_1.tituloLugarMesa)(anexa, mv)} con el pedido de ${(0, mesa_label_1.tituloLugarMesa)(principal, mv)}? Ambas quedarán ocupadas con una sola cuenta.`,
    };
}
/** Separa mesas anexas antes de enviar a cocina. */
function validarDesagruparMesa(input) {
    const { mesa_anexa_numero: anexa, detalles, mesas_virtuales: mv } = input;
    if (pedidoTieneLineasEnviadasCocina(detalles)) {
        return {
            accion: 'rechazar',
            mensaje: 'Ya hay ítems enviados a cocina. No se puede separar el grupo de mesas.',
        };
    }
    return {
        accion: 'desagrupar',
        mensaje_confirmacion: `¿Separar ${(0, mesa_label_1.tituloLugarMesa)(anexa, mv)}? Quedará libre; el pedido sigue en la mesa principal.`,
    };
}
function etiquetaMesasAgrupadas(mesaPrincipal, mesasAnexas) {
    const extras = [...mesasAnexas].sort((a, b) => a - b);
    if (extras.length === 0)
        return String(mesaPrincipal);
    return `${mesaPrincipal}+${extras.join('+')}`;
}
exports.AYUDA_AGRUPACION_MESAS = 'Une mesas libres al mismo pedido (una sola cuenta). Separa antes de enviar a cocina.';
