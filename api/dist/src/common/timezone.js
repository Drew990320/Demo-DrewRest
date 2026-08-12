"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weekdayBogota = weekdayBogota;
exports.minutosAhoraBogota = minutosAhoraBogota;
exports.isDomingoBogota = isDomingoBogota;
const luxon_1 = require("luxon");
function weekdayBogota(now = new Date()) {
    return luxon_1.DateTime.fromJSDate(now).setZone('America/Bogota').weekday;
}
function minutosAhoraBogota(now = new Date()) {
    const dt = luxon_1.DateTime.fromJSDate(now).setZone('America/Bogota');
    return dt.hour * 60 + dt.minute;
}
function isDomingoBogota(now = new Date()) {
    return weekdayBogota(now) === 7;
}
//# sourceMappingURL=timezone.js.map