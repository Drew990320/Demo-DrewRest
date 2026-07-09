"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAMPOS_DISPONIBILIDAD_MESA = void 0;
exports.weekdayDesdeCampoMesa = weekdayDesdeCampoMesa;
exports.campoMesaDesdeWeekday = campoMesaDesdeWeekday;
exports.aplicarPatchDisponibilidadMesa = aplicarPatchDisponibilidadMesa;
exports.validarPatchMesaAdmin = validarPatchMesaAdmin;
exports.validarDesactivarUsuario = validarDesactivarUsuario;
exports.validarNumeroMesaReservado = validarNumeroMesaReservado;
exports.validarCambioNumeroMesaAdmin = validarCambioNumeroMesaAdmin;
exports.validarEliminarMesaAdmin = validarEliminarMesaAdmin;
const mesa_label_1 = require("./mesa-label");
exports.CAMPOS_DISPONIBILIDAD_MESA = [
    'disponible_lunes',
    'disponible_martes',
    'disponible_miercoles',
    'disponible_jueves',
    'disponible_viernes',
    'disponible_sabado',
    'disponible_domingo',
];
function weekdayDesdeCampoMesa(campo) {
    return exports.CAMPOS_DISPONIBILIDAD_MESA.indexOf(campo) + 1;
}
function campoMesaDesdeWeekday(weekday) {
    if (weekday < 1 || weekday > 7)
        return null;
    return exports.CAMPOS_DISPONIBILIDAD_MESA[weekday - 1] ?? null;
}
function aplicarPatchDisponibilidadMesa(actual, patch) {
    return { ...actual, ...patch };
}
function msgNumerosReservados(mesasVirtuales) {
    const r = (0, mesa_label_1.resolverMesasVirtuales)(mesasVirtuales);
    return `Los números ${r.numero_mesa_para_llevar} (para llevar) y ${r.numero_mesa_mostrador} (mostrador) están reservados.`;
}
function msgMesasSistema(mesasVirtuales) {
    const r = (0, mesa_label_1.resolverMesasVirtuales)(mesasVirtuales);
    return `Las mesas ${r.numero_mesa_para_llevar} (para llevar) y ${r.numero_mesa_mostrador} (mostrador) son del sistema y no se pueden modificar.`;
}
function validarPatchMesaAdmin(opts) {
    const { numeroMesa, flagsActuales, patch, pedidosActivos, weekdayHoy, mesasVirtuales, } = opts;
    const algunaDesactivacion = exports.CAMPOS_DISPONIBILIDAD_MESA.some((k) => patch[k] === false);
    if (algunaDesactivacion &&
        (0, mesa_label_1.esMesaVirtualNumero)(numeroMesa, mesasVirtuales)) {
        return { ok: false, mensaje: msgMesasSistema(mesasVirtuales) };
    }
    if (pedidosActivos <= 0) {
        return { ok: true };
    }
    const despues = aplicarPatchDisponibilidadMesa(flagsActuales, patch);
    const campoHoy = campoMesaDesdeWeekday(weekdayHoy);
    if (!campoHoy) {
        return { ok: true };
    }
    const desactivaHoy = patch[campoHoy] === false;
    const quedaSinHoy = !despues[campoHoy];
    const desactivaTodos = exports.CAMPOS_DISPONIBILIDAD_MESA.every((k) => patch[k] === false);
    if (desactivaTodos || desactivaHoy || quedaSinHoy) {
        return {
            ok: false,
            mensaje: pedidosActivos === 1
                ? 'Hay 1 pedido activo en esta mesa. Ciérralo antes de desactivarla hoy.'
                : `Hay ${pedidosActivos} pedidos activos en esta mesa. Ciérralos antes de desactivarla hoy.`,
        };
    }
    return { ok: true };
}
function validarDesactivarUsuario(opts) {
    if (opts.pedidosActivos <= 0) {
        return { ok: true };
    }
    const n = opts.pedidosActivos;
    return {
        ok: false,
        mensaje: n === 1
            ? 'El usuario tiene 1 pedido activo. Ciérralo antes de desactivar la cuenta.'
            : `El usuario tiene ${n} pedidos activos. Ciérralos antes de desactivar la cuenta.`,
    };
}
function validarNumeroMesaReservado(numero, mesasVirtuales) {
    if ((0, mesa_label_1.esMesaVirtualNumero)(numero, mesasVirtuales)) {
        return { ok: false, mensaje: msgNumerosReservados(mesasVirtuales) };
    }
    return { ok: true };
}
function validarCambioNumeroMesaAdmin(opts) {
    const { numeroActual, numeroNuevo, pedidosActivos, mesasVirtuales } = opts;
    if (numeroNuevo === numeroActual) {
        return { ok: true };
    }
    if ((0, mesa_label_1.esMesaVirtualNumero)(numeroActual, mesasVirtuales)) {
        return { ok: false, mensaje: msgMesasSistema(mesasVirtuales) };
    }
    const reservado = validarNumeroMesaReservado(numeroNuevo, mesasVirtuales);
    if (!reservado.ok) {
        return reservado;
    }
    if (pedidosActivos > 0) {
        return {
            ok: false,
            mensaje: pedidosActivos === 1
                ? 'Hay 1 pedido activo en esta mesa. Ciérralo antes de cambiar el número.'
                : `Hay ${pedidosActivos} pedidos activos en esta mesa. Ciérralos antes de cambiar el número.`,
        };
    }
    return { ok: true };
}
function validarEliminarMesaAdmin(opts) {
    const { numeroMesa, pedidosActivos, totalPedidos, mesasVirtuales } = opts;
    if ((0, mesa_label_1.esMesaVirtualNumero)(numeroMesa, mesasVirtuales)) {
        return { ok: false, mensaje: msgMesasSistema(mesasVirtuales) };
    }
    if (pedidosActivos > 0) {
        return {
            ok: false,
            mensaje: pedidosActivos === 1
                ? 'Hay 1 pedido activo en esta mesa. Ciérralo antes de eliminarla.'
                : `Hay ${pedidosActivos} pedidos activos en esta mesa. Ciérralos antes de eliminarla.`,
        };
    }
    if (totalPedidos > 0) {
        return {
            ok: false,
            mensaje: 'Esta mesa tiene pedidos en el historial. No se puede eliminar.',
        };
    }
    return { ok: true };
}
