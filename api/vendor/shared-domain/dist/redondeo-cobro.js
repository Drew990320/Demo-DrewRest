"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redondearHaciaArriba = redondearHaciaArriba;
exports.montoRedondeo = montoRedondeo;
exports.aplicaRedondeo = aplicaRedondeo;
exports.resolverRedondeoCobro = resolverRedondeoCobro;
function enterosCop(n) {
    if (!Number.isFinite(n))
        return 0;
    return Math.max(0, Math.round(n));
}
/** Redondea hacia arriba al múltiplo de `paso`. Si ya es múltiplo, no cambia. */
function redondearHaciaArriba(monto, paso) {
    const m = enterosCop(monto);
    const p = enterosCop(paso);
    if (p <= 1)
        return m;
    const r = m % p;
    return r === 0 ? m : m + (p - r);
}
/** Diferencial a sumar al total del cobro (precios de líneas intactos). */
function montoRedondeo(monto, paso) {
    const m = enterosCop(monto);
    return Math.max(0, redondearHaciaArriba(m, paso) - m);
}
/** ¿Se puede ofrecer / aplicar redondeo a este monto con la config? */
function aplicaRedondeo(monto, cfg) {
    if (!cfg)
        return false;
    const paso = enterosCop(cfg.paso);
    const umbral = enterosCop(cfg.umbral);
    const m = enterosCop(monto);
    if (paso <= 1)
        return false;
    if (m < umbral)
        return false;
    return montoRedondeo(m, paso) > 0;
}
/**
 * Resuelve el total cobrado y el diferencial de redondeo (interno).
 * Si no aplica, total = monto base y monto_redondeo = 0.
 * El diferencial no debe mostrarse al cliente en ticket/correo.
 */
function resolverRedondeoCobro(montoBase, cfg, aplicar) {
    const base = enterosCop(montoBase);
    if (!aplicar || !aplicaRedondeo(base, cfg)) {
        return { total: base, monto_redondeo: 0 };
    }
    const paso = enterosCop(cfg.paso);
    const diff = montoRedondeo(base, paso);
    return { total: base + diff, monto_redondeo: diff };
}
