"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumenSaldoPlanCombinado = resumenSaldoPlanCombinado;
exports.contarCobrosPlanHechos = contarCobrosPlanHechos;
exports.firmaCantidadesPlan = firmaCantidadesPlan;
exports.personaPlanYaCobradaEnSlice = personaPlanYaCobradaEnSlice;
exports.lineasAsignablesCobroPlan = lineasAsignablesCobroPlan;
exports.resolverSolicitudesDesdeCantidadesPlan = resolverSolicitudesDesdeCantidadesPlan;
exports.asignacionCobroCombinado = asignacionCobroCombinado;
exports.asignacionCobroPorPersonasPendiente = asignacionCobroPorPersonasPendiente;
exports.asignacionCobroPersonaPlan = asignacionCobroPersonaPlan;
const asignar_cobro_por_monto_1 = require("./asignar-cobro-por-monto");
const cobro_parcial_1 = require("./cobro-parcial");
/** Saldo del reparto combinado/por personas (cuotas omitidas quedan como pendiente). */
function resumenSaldoPlanCombinado(opts) {
    const cobrado = opts.facturasSlice.reduce((s, f) => s + f.total, 0);
    const saldoRestante = Math.max(0, Math.round(opts.planBaseTotal) - cobrado);
    const saldoOmitido = opts.personasOmitidas.reduce((s, i) => s + (opts.planMontos[i] ?? 0), 0);
    return { cobrado, saldoRestante, saldoOmitido };
}
function contarCobrosPlanHechos(facturas, base) {
    const slice = facturas.slice(base);
    const indices = new Set(slice
        .map((f) => f.persona_plan_indice)
        .filter((x) => typeof x === 'number' && x > 0));
    if (indices.size > 0)
        return indices.size;
    const gruposMixto = new Set(slice
        .map((f) => f.cobro_mixto_grupo)
        .filter((x) => typeof x === 'number' && x > 0));
    if (gruposMixto.size > 0) {
        const sinGrupo = slice.filter((f) => f.cobro_mixto_grupo == null || f.cobro_mixto_grupo <= 0).length;
        return gruposMixto.size + sinGrupo;
    }
    return slice.length;
}
function firmaCantidadesPlan(cantidades) {
    return JSON.stringify(Object.entries(cantidades)
        .filter(([, q]) => q > 0)
        .sort(([a], [b]) => Number(a) - Number(b)));
}
function personaPlanYaCobradaEnSlice(facturas, base, planIdx) {
    return facturas.slice(base).some((f) => f.persona_plan_indice === planIdx);
}
function lineasAsignablesCobroPlan(opts) {
    return opts.detalles
        .filter((d) => d.id_detalle_padre == null &&
        !d.cobrado &&
        !d.es_cuota_pendiente_reparto)
        .map((d) => {
        const pend = opts.pendienteDetalle(d.id_detalle);
        const enPool = opts.modoDividir === 'combinado' ||
            (opts.dividirCuenta && opts.modoDividir === 'platos')
            ? Math.min(pend, opts.cantidadesCobro[d.id_detalle] ?? 0)
            : pend;
        return {
            id_detalle: d.id_detalle,
            precio_unitario: d.precio_unitario,
            cantidad_pendiente: enPool,
        };
    })
        .filter((l) => l.cantidad_pendiente > 0);
}
function resolverSolicitudesDesdeCantidadesPlan(serial, cantidades) {
    const base = Object.entries(cantidades)
        .filter(([, q]) => q > 0)
        .map(([id, cantidad]) => ({
        id_detalle: Number(id),
        cantidad,
    }));
    if (base.length === 0)
        return [];
    try {
        return (0, cobro_parcial_1.ordenarSolicitudesCobro)(serial, (0, cobro_parcial_1.expandirSolicitudesConEmpaques)(serial, base));
    }
    catch {
        return [];
    }
}
/**
 * Reparto en modo combinado: ítems marcados con +/− y monto dividido entre N personas.
 * Si hay menos unidades que personas, cada uno paga su cuota y el API divide el precio del ítem.
 * Con más unidades, se asignan ítems hasta la cuota en pesos (no por conteo de unidades).
 */
function asignacionCobroCombinado(montoNeto, personaIndice, totalPersonas, lineasAsignables, serial, totalNeto) {
    const lineas = lineasAsignables.filter((l) => l.precio_unitario > 0);
    if (lineas.length === 0 || montoNeto <= 0 || totalPersonas < 1)
        return null;
    const totalUnidades = lineas.reduce((s, l) => s + l.cantidad_pendiente, 0);
    if (totalUnidades < 1)
        return null;
    if (totalUnidades < totalPersonas) {
        const cantidades = Object.fromEntries(lineas.map((l) => [l.id_detalle, l.cantidad_pendiente]));
        const solicitudes = resolverSolicitudesDesdeCantidadesPlan(serial, cantidades);
        if (solicitudes.length === 0)
            return null;
        return { cantidades, total: montoNeto, solicitudes };
    }
    return asignacionCobroPorPersonasPendiente(montoNeto, personaIndice, totalPersonas, lineas, serial, totalNeto, false);
}
function asignacionCobroPorPersonasPendiente(montoNeto, personaIndice, totalPersonas, lineasAsignables, serial, totalNeto, soloCuota = false) {
    const lineas = lineasAsignables.filter((l) => l.precio_unitario > 0);
    if (lineas.length === 0 || montoNeto <= 0)
        return null;
    const esUltimaPersona = !soloCuota && personaIndice >= totalPersonas - 1;
    let cantidades;
    if (esUltimaPersona) {
        cantidades = Object.fromEntries(lineas.map((l) => [l.id_detalle, l.cantidad_pendiente]));
        const solicitudes = resolverSolicitudesDesdeCantidadesPlan(serial, cantidades);
        if (solicitudes.length === 0)
            return null;
        return { cantidades, total: totalNeto(solicitudes), solicitudes };
    }
    const brutoPendiente = lineas.reduce((s, l) => s + l.precio_unitario * l.cantidad_pendiente, 0);
    const solicitudesPendientes = resolverSolicitudesDesdeCantidadesPlan(serial, Object.fromEntries(lineas.map((l) => [l.id_detalle, l.cantidad_pendiente])));
    const totalPendienteNeto = totalNeto(solicitudesPendientes);
    let subBruto = totalPendienteNeto > 0 && brutoPendiente > 0
        ? Math.round((montoNeto / totalPendienteNeto) * brutoPendiente)
        : montoNeto;
    for (let i = 0; i < 10; i++) {
        cantidades = (0, asignar_cobro_por_monto_1.asignarCantidadesParaSubtotal)(lineas, subBruto);
        if (Object.keys(cantidades).length === 0)
            break;
        const solicitudes = resolverSolicitudesDesdeCantidadesPlan(serial, cantidades);
        if (solicitudes.length === 0)
            break;
        const total = totalNeto(solicitudes);
        if (total <= montoNeto) {
            return { cantidades, total, solicitudes };
        }
        subBruto = Math.max(0, Math.round(subBruto * (montoNeto / total) * 0.98));
        if (subBruto <= 0)
            break;
    }
    cantidades = (0, asignar_cobro_por_monto_1.asignarCantidadesParaSubtotal)(lineas, subBruto);
    if (Object.keys(cantidades).length === 0)
        return null;
    const solicitudes = resolverSolicitudesDesdeCantidadesPlan(serial, cantidades);
    if (solicitudes.length === 0)
        return null;
    const total = totalNeto(solicitudes);
    if (total > montoNeto)
        return null;
    return { cantidades, total, solicitudes };
}
function asignacionCobroPersonaPlan(opts) {
    const { montoNeto, modoDividir, totalReferencia, lineasAsignables, serial, totalNeto } = opts;
    if (montoNeto <= 0)
        return null;
    if (modoDividir === 'combinado') {
        const personaIndice = opts.personaIndice ?? 0;
        const totalPersonas = opts.totalPersonas ?? 1;
        if (totalPersonas < 1)
            return null;
        return asignacionCobroCombinado(montoNeto, personaIndice, totalPersonas, lineasAsignables, serial, totalNeto);
    }
    if (modoDividir === 'personas') {
        const personaIndice = opts.personaIndice ?? 0;
        const totalPersonas = opts.totalPersonas ?? 1;
        if (totalPersonas < 1)
            return null;
        return asignacionCobroPorPersonasPendiente(montoNeto, personaIndice, totalPersonas, lineasAsignables, serial, totalNeto, opts.soloCuota ?? false);
    }
    if (lineasAsignables.length === 0)
        return null;
    const brutoPendiente = lineasAsignables.reduce((s, l) => s + l.precio_unitario * l.cantidad_pendiente, 0);
    let subBruto = totalReferencia > 0 && brutoPendiente > 0
        ? Math.round((montoNeto / totalReferencia) * brutoPendiente)
        : montoNeto;
    let cantidades = {};
    let solicitudes = [];
    let total = 0;
    if (opts.soloCuota) {
        cantidades = (0, asignar_cobro_por_monto_1.asignarCantidadesParaSubtotal)(lineasAsignables, subBruto);
        if (Object.keys(cantidades).length === 0) {
            const linea = [...lineasAsignables].sort((a, b) => b.precio_unitario - a.precio_unitario)[0];
            if (linea)
                cantidades = { [linea.id_detalle]: 1 };
        }
        solicitudes = resolverSolicitudesDesdeCantidadesPlan(serial, cantidades);
        if (solicitudes.length === 0)
            return null;
        return { cantidades, total: totalNeto(solicitudes), solicitudes };
    }
    for (let i = 0; i < 10; i++) {
        cantidades = (0, asignar_cobro_por_monto_1.asignarCantidadesParaSubtotal)(lineasAsignables, subBruto);
        if (Object.keys(cantidades).length === 0)
            break;
        solicitudes = resolverSolicitudesDesdeCantidadesPlan(serial, cantidades);
        if (solicitudes.length === 0)
            break;
        total = totalNeto(solicitudes);
        if (total <= montoNeto) {
            return { cantidades, total, solicitudes };
        }
        subBruto = Math.max(0, Math.round(subBruto * (montoNeto / total) * 0.98));
        if (subBruto <= 0)
            break;
    }
    if (Object.keys(cantidades).length === 0 || solicitudes.length === 0)
        return null;
    if (total > montoNeto)
        return null;
    return { cantidades, total, solicitudes };
}
