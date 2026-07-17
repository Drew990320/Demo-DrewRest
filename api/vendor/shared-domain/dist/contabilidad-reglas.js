"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aplicarReglaContable = aplicarReglaContable;
exports.reglaDosCuentasTotal = reglaDosCuentasTotal;
const contabilidad_asiento_1 = require("./contabilidad-asiento");
function montoDeLinea(linea, montoBase) {
    switch (linea.formula_monto) {
        case 'fijo':
            return (0, contabilidad_asiento_1.redondearDineroContable)(Number(linea.monto_fijo ?? 0));
        case 'porcentaje': {
            const p = Number(linea.porcentaje ?? 0);
            return (0, contabilidad_asiento_1.redondearDineroContable)((montoBase * p) / 100);
        }
        case 'total':
        default:
            return (0, contabilidad_asiento_1.redondearDineroContable)(montoBase);
    }
}
/** Aplica plantilla de regla a un monto base → plan de asiento. */
function aplicarReglaContable(regla, montoBase, descripcion) {
    const lineas = regla.lineas.map((l) => {
        const m = montoDeLinea(l, montoBase);
        return {
            id_cuenta: l.id_cuenta,
            codigo_cuenta: l.codigo_cuenta,
            debito: l.lado === 'debito' ? m : 0,
            credito: l.lado === 'credito' ? m : 0,
            orden: l.orden,
        };
    });
    const plan = {
        descripcion: descripcion ?? regla.nombre,
        lineas,
    };
    // Si la regla solo tiene 2 líneas "total" y quedó desbalanceada por redondeo, no forzar.
    return { plan, validacion: (0, contabilidad_asiento_1.validarAsientoPlan)(plan) };
}
/** Atajo: regla Dr/Cr con monto total (casos POS). */
function reglaDosCuentasTotal(input) {
    const plan = (0, contabilidad_asiento_1.asientoSimpleDosCuentas)({
        descripcion: input.descripcion ?? input.nombre,
        id_cuenta_debito: input.id_debito,
        id_cuenta_credito: input.id_credito,
        monto: input.monto,
        codigo_debito: input.codigo_debito,
        codigo_credito: input.codigo_credito,
    });
    return { plan, validacion: (0, contabilidad_asiento_1.validarAsientoPlan)(plan) };
}
