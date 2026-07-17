"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redondearDineroContable = redondearDineroContable;
exports.totalDebitos = totalDebitos;
exports.totalCreditos = totalCreditos;
exports.asientoEstaBalanceado = asientoEstaBalanceado;
exports.validarAsientoPlan = validarAsientoPlan;
exports.planReversoAsiento = planReversoAsiento;
exports.asientoSimpleDosCuentas = asientoSimpleDosCuentas;
/** Redondeo monetario COP (pesos enteros). */
function redondearDineroContable(n) {
    if (!Number.isFinite(n))
        return 0;
    return Math.round(n);
}
function totalDebitos(lineas) {
    return redondearDineroContable(lineas.reduce((s, l) => s + (l.debito || 0), 0));
}
function totalCreditos(lineas) {
    return redondearDineroContable(lineas.reduce((s, l) => s + (l.credito || 0), 0));
}
function asientoEstaBalanceado(lineas) {
    if (!lineas.length)
        return false;
    const d = totalDebitos(lineas);
    const c = totalCreditos(lineas);
    return d === c && d > 0;
}
function validarAsientoPlan(plan) {
    if (!plan.lineas.length) {
        return { ok: false, motivo: 'El asiento no tiene líneas' };
    }
    for (const l of plan.lineas) {
        const d = redondearDineroContable(l.debito);
        const c = redondearDineroContable(l.credito);
        if (d < 0 || c < 0) {
            return { ok: false, motivo: 'Montos negativos no permitidos' };
        }
        if (d > 0 && c > 0) {
            return { ok: false, motivo: 'Una línea no puede tener débito y crédito' };
        }
        if (d === 0 && c === 0) {
            return { ok: false, motivo: 'Línea sin monto' };
        }
    }
    if (!asientoEstaBalanceado(plan.lineas)) {
        return {
            ok: false,
            motivo: `Asiento desbalanceado (Dr ${totalDebitos(plan.lineas)} ≠ Cr ${totalCreditos(plan.lineas)})`,
        };
    }
    return { ok: true };
}
/** Construye asiento espejo para reversión. */
function planReversoAsiento(original, descripcion) {
    return {
        descripcion: descripcion ?? `Reversión: ${original.descripcion}`,
        lineas: original.lineas.map((l, i) => ({
            id_cuenta: l.id_cuenta,
            codigo_cuenta: l.codigo_cuenta,
            debito: redondearDineroContable(l.credito),
            credito: redondearDineroContable(l.debito),
            detalle: l.detalle,
            orden: i,
        })),
    };
}
function asientoSimpleDosCuentas(input) {
    const monto = redondearDineroContable(input.monto);
    return {
        descripcion: input.descripcion,
        lineas: [
            {
                id_cuenta: input.id_cuenta_debito,
                codigo_cuenta: input.codigo_debito,
                debito: monto,
                credito: 0,
                orden: 0,
            },
            {
                id_cuenta: input.id_cuenta_credito,
                codigo_cuenta: input.codigo_credito,
                debito: 0,
                credito: monto,
                orden: 1,
            },
        ],
    };
}
