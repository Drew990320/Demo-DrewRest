"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedConfigOperativaRow = getCachedConfigOperativaRow;
exports.setCachedConfigOperativaRow = setCachedConfigOperativaRow;
exports.invalidateConfigOperativaCache = invalidateConfigOperativaCache;
const TTL_MS = 60_000;
const cache = new Map();
function getCachedConfigOperativaRow(tenantId) {
    const entry = cache.get(tenantId);
    if (!entry || entry.expiresAt <= Date.now()) {
        if (entry)
            cache.delete(tenantId);
        return null;
    }
    return entry.row;
}
function setCachedConfigOperativaRow(tenantId, row) {
    cache.set(tenantId, { row, expiresAt: Date.now() + TTL_MS });
}
function invalidateConfigOperativaCache(tenantId) {
    if (tenantId == null) {
        cache.clear();
        return;
    }
    cache.delete(tenantId);
}
//# sourceMappingURL=config-operativa-cache.js.map