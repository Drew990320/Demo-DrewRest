"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeduccionEstructuraCache = getDeduccionEstructuraCache;
exports.setDeduccionEstructuraCache = setDeduccionEstructuraCache;
exports.invalidateDeduccionEstructuraCache = invalidateDeduccionEstructuraCache;
const TTL_MS = 45_000;
const cache = new Map();
function getDeduccionEstructuraCache(tenantId) {
    const entry = cache.get(tenantId);
    if (!entry || entry.expiresAt <= Date.now()) {
        if (entry)
            cache.delete(tenantId);
        return null;
    }
    return entry;
}
function setDeduccionEstructuraCache(tenantId, data) {
    cache.set(tenantId, { ...data, expiresAt: Date.now() + TTL_MS });
}
function invalidateDeduccionEstructuraCache(tenantId) {
    if (tenantId == null) {
        cache.clear();
        return;
    }
    cache.delete(tenantId);
}
//# sourceMappingURL=deduccion-contexto-cache.js.map