"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedConfigRestaurante = getCachedConfigRestaurante;
exports.setCachedConfigRestaurante = setCachedConfigRestaurante;
exports.invalidateConfigRestauranteCache = invalidateConfigRestauranteCache;
const TTL_MS = 60_000;
const cache = new Map();
function getCachedConfigRestaurante(tenantId) {
    const entry = cache.get(tenantId);
    if (!entry || entry.expiresAt <= Date.now()) {
        if (entry)
            cache.delete(tenantId);
        return null;
    }
    return entry.row;
}
function setCachedConfigRestaurante(tenantId, row) {
    cache.set(tenantId, { row, expiresAt: Date.now() + TTL_MS });
}
function invalidateConfigRestauranteCache(tenantId) {
    if (tenantId == null) {
        cache.clear();
        return;
    }
    cache.delete(tenantId);
}
//# sourceMappingURL=config-restaurante-cache.js.map