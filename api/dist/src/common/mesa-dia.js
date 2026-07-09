"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mesaDisponibleEnDiaSemana = void 0;
exports.mesaDisponibleHoyBogota = mesaDisponibleHoyBogota;
exports.campoDisponibilidadMesaParaWeekday = campoDisponibilidadMesaParaWeekday;
const dias_semana_1 = require("@drewrest/shared-domain/dias-semana");
Object.defineProperty(exports, "mesaDisponibleEnDiaSemana", { enumerable: true, get: function () { return dias_semana_1.mesaDisponibleEnDiaSemana; } });
const timezone_1 = require("./timezone");
const DIA_A_CAMPO = {
    1: 'disponibleLunes',
    2: 'disponibleMartes',
    3: 'disponibleMiercoles',
    4: 'disponibleJueves',
    5: 'disponibleViernes',
    6: 'disponibleSabado',
    7: 'disponibleDomingo',
};
function mesaDisponibleHoyBogota(m) {
    return (0, dias_semana_1.mesaDisponibleEnDiaSemana)(m, (0, timezone_1.weekdayBogota)());
}
function campoDisponibilidadMesaParaWeekday(weekday) {
    const k = DIA_A_CAMPO[weekday];
    if (!k)
        return null;
    return k;
}
//# sourceMappingURL=mesa-dia.js.map