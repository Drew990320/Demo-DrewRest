"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESA_VISTA_DESCRIPCION = exports.MESA_VISTA_LABELS = exports.MESA_FORMA_DESCRIPCION = exports.MESA_FORMA_LABELS = exports.MESA_VISTA_IDS = exports.MESA_FORMA_IDS = void 0;
exports.esMesaFormaValida = esMesaFormaValida;
exports.esMesaVistaValida = esMesaVistaValida;
exports.resolverMesaForma = resolverMesaForma;
exports.resolverMesaVista = resolverMesaVista;
exports.MESA_FORMA_IDS = [
    'rectangular',
    'redonda',
    'cuadrada',
    'barra',
];
exports.MESA_VISTA_IDS = ['cuadricula', 'compacta', 'lista'];
exports.MESA_FORMA_LABELS = {
    rectangular: 'Rectangular',
    redonda: 'Redonda',
    cuadrada: 'Cuadrada',
    barra: 'Barra ancha',
};
exports.MESA_FORMA_DESCRIPCION = {
    rectangular: 'Tarjeta clásica con esquinas suaves.',
    redonda: 'Círculo compacto, ideal para muchas mesas.',
    cuadrada: 'Cuadrado simétrico, fácil de escanear.',
    barra: 'Pastilla horizontal tipo barra o mostrador.',
};
exports.MESA_VISTA_LABELS = {
    cuadricula: 'Cuadrícula',
    compacta: 'Compacta',
    lista: 'Lista',
};
exports.MESA_VISTA_DESCRIPCION = {
    cuadricula: 'Rejilla equilibrada (predeterminado).',
    compacta: 'Más columnas y tarjetas más pequeñas.',
    lista: 'Una mesa por fila con número y estado alineados.',
};
function esMesaFormaValida(id) {
    return (typeof id === 'string' &&
        exports.MESA_FORMA_IDS.includes(id));
}
function esMesaVistaValida(id) {
    return (typeof id === 'string' &&
        exports.MESA_VISTA_IDS.includes(id));
}
function resolverMesaForma(guardado) {
    return esMesaFormaValida(guardado) ? guardado : 'rectangular';
}
function resolverMesaVista(guardado) {
    return esMesaVistaValida(guardado) ? guardado : 'cuadricula';
}
