"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedConfigInventario = getCachedConfigInventario;
exports.setCachedConfigInventario = setCachedConfigInventario;
exports.invalidateConfigInventarioCache = invalidateConfigInventarioCache;
const TTL_MS = 60_000;
const cache = new Map();
function getCachedConfigInventario(tenantId) {
    const entry = cache.get(tenantId);
    if (!entry || entry.expiresAt <= Date.now()) {
        if (entry)
            cache.delete(tenantId);
        return null;
    }
    return entry.row;
}
function setCachedConfigInventario(tenantId, row) {
    cache.set(tenantId, { row, expiresAt: Date.now() + TTL_MS });
}
function invalidateConfigInventarioCache(tenantId) {
    if (tenantId == null) {
        cache.clear();
        return;
    }
    cache.delete(tenantId);
}
//# sourceMappingURL=config-inventario-cache.js.map