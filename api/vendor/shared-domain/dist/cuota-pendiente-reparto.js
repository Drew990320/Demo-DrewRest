"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CUOTA_PENDIENTE_NOTA_PREFIX = exports.NOMBRE_PRODUCTO_CUOTA_PENDIENTE = void 0;
exports.formatCuotaPendienteNota = formatCuotaPendienteNota;
exports.parseCuotaPendienteNota = parseCuotaPendienteNota;
exports.esDetalleCuotaPendienteReparto = esDetalleCuotaPendienteReparto;
exports.nombreLineaCuotaPendiente = nombreLineaCuotaPendiente;
exports.nombreProductoCuotaPendienteDisplay = nombreProductoCuotaPendienteDisplay;
exports.cuotasPlanOmitidasDesdeDetalles = cuotasPlanOmitidasDesdeDetalles;
exports.cuotasPlanOmitidasDesdeHistorial = cuotasPlanOmitidasDesdeHistorial;
exports.listarCuotasPlanOmitidas = listarCuotasPlanOmitidas;
exports.personasOmitidasDesdeDetalles = personasOmitidasDesdeDetalles;
exports.personasOmitidasDesdeCuotas = personasOmitidasDesdeCuotas;
/** Producto interno: línea cobrable por cuota omitida en reparto por personas/combinado. */
exports.NOMBRE_PRODUCTO_CUOTA_PENDIENTE = 'Saldo pendiente reparto';
exports.CUOTA_PENDIENTE_NOTA_PREFIX = 'cuota_pendiente:';
/** Etiqueta en nota_cocina: cuota_pendiente:2@4 → persona 2, sesión plan base 4. */
function formatCuotaPendienteNota(personaIdx, facturasBase) {
    return `${exports.CUOTA_PENDIENTE_NOTA_PREFIX}${personaIdx}@${facturasBase}`;
}
function parseCuotaPendienteNota(nota) {
    if (!nota?.includes(exports.CUOTA_PENDIENTE_NOTA_PREFIX))
        return null;
    const idx = nota.indexOf(exports.CUOTA_PENDIENTE_NOTA_PREFIX);
    const tag = nota.slice(idx + exports.CUOTA_PENDIENTE_NOTA_PREFIX.length);
    const [personaRaw, baseRaw] = tag.split('@');
    const personaIdx = Number(personaRaw);
    const facturasBase = Number(baseRaw);
    if (!Number.isFinite(personaIdx) || personaIdx < 1)
        return null;
    if (!Number.isFinite(facturasBase) || facturasBase < 0)
        return null;
    return { personaIdx, facturasBase };
}
function esDetalleCuotaPendienteReparto(d) {
    return (Boolean(d.es_cuota_pendiente_reparto ?? d.esCuotaPendienteReparto) ||
        parseCuotaPendienteNota(d.nota_cocina) != null ||
        d.nombre_producto === exports.NOMBRE_PRODUCTO_CUOTA_PENDIENTE);
}
function nombreLineaCuotaPendiente(personaIdx) {
    return `Saldo pendiente reparto (Persona ${personaIdx})`;
}
/** Nombre visible en factura / ticket / app. */
function nombreProductoCuotaPendienteDisplay(nombreBase, nota) {
    const parsed = parseCuotaPendienteNota(nota);
    if (parsed)
        return nombreLineaCuotaPendiente(parsed.personaIdx);
    if (nombreBase === exports.NOMBRE_PRODUCTO_CUOTA_PENDIENTE)
        return nombreBase;
    return nombreBase;
}
/** Registros legacy: líneas «Saldo pendiente reparto» aún sin cobrar. */
function cuotasPlanOmitidasDesdeDetalles(detalles) {
    const out = [];
    for (const d of detalles) {
        if (d.cobrado)
            continue;
        if (!esDetalleCuotaPendienteReparto(d))
            continue;
        const parsed = parseCuotaPendienteNota(d.nota_cocina);
        if (!parsed)
            continue;
        const monto = d.subtotal_linea ??
            (d.precio_unitario != null && d.cantidad != null
                ? d.precio_unitario * d.cantidad
                : d.precio_unitario ?? 0);
        out.push({
            persona_plan_indice: parsed.personaIdx,
            monto: Math.round(monto),
            facturas_base_plan: parsed.facturasBase,
        });
    }
    return out;
}
/** Registros en historial (sin línea extra en el pedido). */
function cuotasPlanOmitidasDesdeHistorial(historial) {
    const out = [];
    for (const h of historial) {
        if (h.detalle == null || typeof h.detalle !== 'object')
            continue;
        const d = h.detalle;
        const esCuota = h.tipo === 'cuota_plan_omitida' || d.cuota_plan_omitida === true;
        if (!esCuota)
            continue;
        const persona = Number(d.persona_plan_indice);
        const monto = Math.round(Number(d.monto_persona_plan));
        const base = Number(d.facturas_base_plan);
        if (!Number.isFinite(persona) || persona < 1)
            continue;
        if (!Number.isFinite(monto) || monto <= 0)
            continue;
        if (!Number.isFinite(base) || base < 0)
            continue;
        const sesionRaw = Number(d.plan_sesion_id);
        out.push({
            persona_plan_indice: persona,
            monto,
            facturas_base_plan: base,
            plan_sesion_id: Number.isFinite(sesionRaw) && sesionRaw > 0 ? sesionRaw : undefined,
        });
    }
    return out;
}
/** Une historial y líneas legacy; el historial tiene prioridad por persona+sesión. */
function listarCuotasPlanOmitidas(detalles, historial = []) {
    const key = (c) => `${c.facturas_base_plan}:${c.plan_sesion_id ?? 0}:${c.persona_plan_indice}`;
    const map = new Map();
    for (const c of cuotasPlanOmitidasDesdeDetalles(detalles)) {
        map.set(key(c), c);
    }
    for (const c of cuotasPlanOmitidasDesdeHistorial(historial)) {
        map.set(key(c), c);
    }
    return [...map.values()].sort((a, b) => a.facturas_base_plan - b.facturas_base_plan ||
        (a.plan_sesion_id ?? 0) - (b.plan_sesion_id ?? 0) ||
        a.persona_plan_indice - b.persona_plan_indice);
}
/** Índices 0-based de personas omitidas en la sesión de plan activa. */
function personasOmitidasDesdeDetalles(detalles, facturasBasePlan, planSesionId) {
    return personasOmitidasDesdeCuotas(listarCuotasPlanOmitidas(detalles), facturasBasePlan, planSesionId);
}
function personasOmitidasDesdeCuotas(cuotas, facturasBasePlan, planSesionId) {
    const out = cuotas
        .filter((c) => {
        if (c.facturas_base_plan !== facturasBasePlan)
            return false;
        // Sesión activa: solo omisiones de esta sesión (ignora legadas sin id).
        if (planSesionId != null && planSesionId > 0) {
            return c.plan_sesion_id === planSesionId;
        }
        // Sin sesión de UI: no heredar omisiones previas.
        return false;
    })
        .map((c) => c.persona_plan_indice - 1);
    return [...new Set(out)].sort((a, b) => a - b);
}
