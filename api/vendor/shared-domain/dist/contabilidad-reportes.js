"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agregarMayor = agregarMayor;
exports.resumenSimpleDesdeLineas = resumenSimpleDesdeLineas;
const contabilidad_asiento_1 = require("./contabilidad-asiento");
function agregarMayor(movimientos) {
    const map = new Map();
    for (const m of movimientos) {
        const prev = map.get(m.id_cuenta);
        if (!prev) {
            map.set(m.id_cuenta, { ...m });
            continue;
        }
        map.set(m.id_cuenta, {
            ...prev,
            debito: (0, contabilidad_asiento_1.redondearDineroContable)(prev.debito + m.debito),
            credito: (0, contabilidad_asiento_1.redondearDineroContable)(prev.credito + m.credito),
        });
    }
    return [...map.values()].map((m) => {
        const neto = (0, contabilidad_asiento_1.redondearDineroContable)(m.debito - m.credito);
        return {
            ...m,
            saldo: Math.abs(neto),
            naturaleza_saldo: neto > 0 ? 'debito' : neto < 0 ? 'credito' : 'cero',
        };
    });
}
/** Heurística desde líneas: créditos a tipo ingreso = ingresos; débitos a gasto = gastos. */
function resumenSimpleDesdeLineas(lineas) {
    let ingresos = 0;
    let gastos = 0;
    for (const l of lineas) {
        if (l.tipo_cuenta === 'ingreso' && l.credito > 0) {
            ingresos += l.credito;
        }
        if (l.tipo_cuenta === 'gasto' && l.debito > 0) {
            gastos += l.debito;
        }
    }
    ingresos = (0, contabilidad_asiento_1.redondearDineroContable)(ingresos);
    gastos = (0, contabilidad_asiento_1.redondearDineroContable)(gastos);
    return {
        ingresos,
        gastos,
        utilidad: (0, contabilidad_asiento_1.redondearDineroContable)(ingresos - gastos),
    };
}
