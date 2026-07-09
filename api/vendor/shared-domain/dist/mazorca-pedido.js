"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESA_MOSTRADOR_NUMERO = exports.MESA_PARA_LLEVAR_NUMERO = exports.MESA_SIN_LINEA_MAZORCA = void 0;
exports.pedidoUsaLineaMazorca = pedidoUsaLineaMazorca;
exports.esMesaSinLineaMazorca = esMesaSinLineaMazorca;
exports.esDetalleMazorcaAcompanamiento = esDetalleMazorcaAcompanamiento;
const mesa_label_1 = require("./mesa-label");
/** Mesas virtuales por defecto: sin línea automática de acompañamiento. */
var mesa_label_2 = require("./mesa-label");
Object.defineProperty(exports, "MESA_SIN_LINEA_MAZORCA", { enumerable: true, get: function () { return mesa_label_2.MESA_PARA_LLEVAR_NUMERO; } });
var mesa_label_3 = require("./mesa-label");
Object.defineProperty(exports, "MESA_PARA_LLEVAR_NUMERO", { enumerable: true, get: function () { return mesa_label_3.MESA_PARA_LLEVAR_NUMERO; } });
Object.defineProperty(exports, "MESA_MOSTRADOR_NUMERO", { enumerable: true, get: function () { return mesa_label_3.MESA_MOSTRADOR_NUMERO; } });
function pedidoUsaLineaMazorca(mesaNumero, mazorcaActiva = false, mesasVirtuales) {
    if (!mazorcaActiva)
        return false;
    const r = (0, mesa_label_1.resolverMesasVirtuales)(mesasVirtuales);
    return (mesaNumero !== r.numero_mesa_para_llevar &&
        mesaNumero !== r.numero_mesa_mostrador);
}
function esMesaSinLineaMazorca(mesaNumero, mesasVirtuales) {
    return !pedidoUsaLineaMazorca(mesaNumero, true, mesasVirtuales);
}
function esDetalleMazorcaAcompanamiento(d) {
    return Boolean(d.es_acompanamiento_mazorca ?? d.esAcompanamientoMazorca);
}
