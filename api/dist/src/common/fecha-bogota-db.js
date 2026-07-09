"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fechaBogotaDb = fechaBogotaDb;
const common_1 = require("@nestjs/common");
const luxon_1 = require("luxon");
function fechaBogotaDb(fecha) {
    let base = luxon_1.DateTime.now().setZone('America/Bogota');
    if (fecha) {
        const parsed = luxon_1.DateTime.fromISO(fecha, { zone: 'America/Bogota' });
        if (!parsed.isValid) {
            throw new common_1.BadRequestException('fecha inválida, usa formato YYYY-MM-DD');
        }
        base = parsed;
    }
    const iso = base.toFormat('yyyy-LL-dd');
    return { iso, date: new Date(Date.UTC(base.year, base.month - 1, base.day)) };
}
//# sourceMappingURL=fecha-bogota-db.js.map