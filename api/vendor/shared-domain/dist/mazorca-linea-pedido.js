"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSG_MAZORCA_NO_AJUSTE = exports.MSG_MAZORCA_BLOQUEADA = exports.MSG_MAZORCA_MIN_COMENSALES = void 0;
exports.cantidadBloqueadaMazorca = cantidadBloqueadaMazorca;
exports.cantidadTotalMazorca = cantidadTotalMazorca;
exports.lineaMazorcaEditable = lineaMazorcaEditable;
exports.planificarSyncMazorca = planificarSyncMazorca;
exports.cantidadLineaMazorcaInicial = cantidadLineaMazorcaInicial;
exports.MSG_MAZORCA_MIN_COMENSALES = 'Debe haber al menos 1 comensal';
exports.MSG_MAZORCA_BLOQUEADA = 'No puedes bajar comensales por debajo del acompañamiento ya listo o entregado';
exports.MSG_MAZORCA_NO_AJUSTE = 'No se pudo ajustar comensales: hay acompañamiento ya listo o en mesa';
function cantidadBloqueadaMazorca(lineas) {
    return lineas.reduce((s, l) => s + (l.listo_cocina || l.listo_para_recoger ? l.cantidad : 0), 0);
}
function cantidadTotalMazorca(lineas) {
    return lineas.reduce((s, l) => s + l.cantidad, 0);
}
function lineaMazorcaEditable(lineas) {
    return lineas.find((l) => !l.listo_cocina && !l.listo_para_recoger);
}
function planificarSyncMazorca(input) {
    if (!input.usa_linea_mazorca) {
        return { tipo: 'limpiar' };
    }
    if (input.num_comensales < 1) {
        return { tipo: 'error', mensaje: exports.MSG_MAZORCA_MIN_COMENSALES };
    }
    const total = cantidadTotalMazorca(input.lineas);
    const bloqueada = cantidadBloqueadaMazorca(input.lineas);
    if (input.num_comensales < bloqueada) {
        return { tipo: 'error', mensaje: exports.MSG_MAZORCA_BLOQUEADA };
    }
    if (total === input.num_comensales) {
        return { tipo: 'sin_cambios' };
    }
    if (total < input.num_comensales) {
        const agregar = input.num_comensales - total;
        const editable = lineaMazorcaEditable(input.lineas);
        if (editable) {
            return {
                tipo: 'subir',
                modo: 'editar',
                id_detalle: editable.id_detalle,
                nueva_cantidad: editable.cantidad + agregar,
            };
        }
        return { tipo: 'subir', modo: 'crear', cantidad: agregar };
    }
    let quitar = total - input.num_comensales;
    const editables = input.lineas
        .filter((l) => !l.listo_cocina && !l.listo_para_recoger)
        .sort((a, b) => b.id_detalle - a.id_detalle);
    const actualizar = [];
    const eliminar = [];
    for (const l of editables) {
        if (quitar <= 0)
            break;
        const resta = Math.min(quitar, l.cantidad);
        quitar -= resta;
        const nueva = l.cantidad - resta;
        if (nueva <= 0) {
            eliminar.push(l.id_detalle);
        }
        else {
            actualizar.push({ id_detalle: l.id_detalle, nueva_cantidad: nueva });
        }
    }
    if (quitar > 0) {
        return { tipo: 'error', mensaje: exports.MSG_MAZORCA_NO_AJUSTE };
    }
    return { tipo: 'bajar', actualizar, eliminar };
}
function cantidadLineaMazorcaInicial(input) {
    if (!input.usa_linea_mazorca || input.ya_tiene_linea) {
        return null;
    }
    return input.num_comensales;
}
