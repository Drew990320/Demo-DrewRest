"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weekdayBogota = weekdayBogota;
exports.isDomingoBogota = isDomingoBogota;
const luxon_1 = require("luxon");
function weekdayBogota() {
    return luxon_1.DateTime.now().setZone('America/Bogota').weekday;
}
function isDomingoBogota() {
    return weekdayBogota() === 7;
}
//# sourceMappingURL=timezone.js.map