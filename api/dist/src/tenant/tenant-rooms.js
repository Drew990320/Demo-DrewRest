"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantBaseRoom = tenantBaseRoom;
exports.tenantRoom = tenantRoom;
const tenant_constants_1 = require("./tenant.constants");
function tenantBaseRoom(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
    return `tenant:${tenantId}`;
}
function tenantRoom(suffix, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
    return `tenant:${tenantId}:${suffix}`;
}
//# sourceMappingURL=tenant-rooms.js.map