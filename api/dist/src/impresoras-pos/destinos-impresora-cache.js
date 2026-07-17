"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedDestinos = getCachedDestinos;
exports.setCachedDestinos = setCachedDestinos;
exports.invalidateDestinosImpresoraCache = invalidateDestinosImpresoraCache;
const TTL_MS = 30_000;
const cache = new Map();
function key(tenantId, rol) {
    return `${tenantId}:${rol}`;
}
function getCachedDestinos(tenantId, rol) {
    const entry = cache.get(key(tenantId, rol));
    if (!entry || entry.expiresAt <= Date.now()) {
        if (entry)
            cache.delete(key(tenantId, rol));
        return null;
    }
    return entry.rows;
}
function setCachedDestinos(tenantId, rol, rows) {
    cache.set(key(tenantId, rol), {
        rows,
        expiresAt: Date.now() + TTL_MS,
    });
}
function invalidateDestinosImpresoraCache(tenantId) {
    if (tenantId == null) {
        cache.clear();
        return;
    }
    for (const k of cache.keys()) {
        if (k.startsWith(`${tenantId}:`))
            cache.delete(k);
    }
}
//# sourceMappingURL=destinos-impresora-cache.js.map