"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORDEN_EVENTOS_DEDUCCION = exports.POLITICA_DEDUCCION_DEFAULT = exports.EVENTOS_DEDUCCION = void 0;
exports.eventoDeduccionParaClase = eventoDeduccionParaClase;
exports.debeDeducirEnEvento = debeDeducirEnEvento;
exports.indiceEventoDeduccion = indiceEventoDeduccion;
const inventario_comportamiento_1 = require("./inventario-comportamiento");
exports.EVENTOS_DEDUCCION = [
    'al_crear_pedido',
    'al_confirmar_pedido',
    'cocina_acepta',
    'cocina_en_preparacion',
    'cocina_listo',
    'al_facturar',
    'al_entregar',
];
exports.POLITICA_DEDUCCION_DEFAULT = {
    evento_receta: 'cocina_en_preparacion',
    evento_comercial: 'al_crear_pedido',
    evento_consumible: 'al_facturar',
};
function eventoDeduccionParaClase(clase, politica = exports.POLITICA_DEDUCCION_DEFAULT) {
    switch (clase) {
        case 'comercial':
            return politica.evento_comercial;
        case 'consumible_interno':
            return politica.evento_consumible ?? politica.evento_comercial;
        case 'produccion':
            return politica.evento_receta;
        case 'activo_interno':
            return politica.evento_comercial;
        default:
            return politica.evento_receta;
    }
}
function debeDeducirEnEvento(input) {
    if (input.es_consumo_por_receta) {
        return input.evento === eventoDeduccionParaClase('produccion', input.politica);
    }
    if (!(0, inventario_comportamiento_1.comportamientoPermiteDeduccionAuto)(input.comportamiento)) {
        return false;
    }
    if (input.comportamiento.es_activo_fijo) {
        return false;
    }
    const objetivo = eventoDeduccionParaClase(input.clase, input.politica);
    return input.evento === objetivo;
}
/** Orden cronológico de eventos (para idempotencia / reversiones). */
exports.ORDEN_EVENTOS_DEDUCCION = [
    'al_crear_pedido',
    'al_confirmar_pedido',
    'cocina_acepta',
    'cocina_en_preparacion',
    'cocina_listo',
    'al_facturar',
    'al_entregar',
];
function indiceEventoDeduccion(evento) {
    return exports.ORDEN_EVENTOS_DEDUCCION.indexOf(evento);
}
