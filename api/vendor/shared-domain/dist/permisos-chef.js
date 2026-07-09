"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISOS_CHEF_META = exports.PERMISOS_CHEF_DEFAULTS = exports.PERMISOS_CHEF_KEYS = void 0;
exports.PERMISOS_CHEF_KEYS = [
    'ver_cola_cocina',
    'marcar_listo',
    'reimprimir_comanda',
    'anular_linea_cocina',
];
exports.PERMISOS_CHEF_DEFAULTS = {
    ver_cola_cocina: true,
    marcar_listo: true,
    reimprimir_comanda: true,
    anular_linea_cocina: true,
};
exports.PERMISOS_CHEF_META = {
    ver_cola_cocina: {
        titulo: 'Ver cola de cocina',
        detalle: 'Acceso a la pantalla de cocina',
    },
    marcar_listo: {
        titulo: 'Marcar listo',
        detalle: 'Marcar platos y acompañamientos como listos',
    },
    reimprimir_comanda: {
        titulo: 'Reimprimir comanda',
        detalle: 'Reimprimir comandas desde cocina',
    },
    anular_linea_cocina: {
        titulo: 'Anular en cocina',
        detalle: 'Marcar falta en cocina / anular línea',
    },
};
