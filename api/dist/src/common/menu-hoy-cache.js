"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedMenuHoy = getCachedMenuHoy;
exports.setCachedMenuHoy = setCachedMenuHoy;
exports.invalidateMenuHoyCache = invalidateMenuHoyCache;
const TTL_MS = 60_000;
let cache = null;
function getCachedMenuHoy(key) {
    if (!cache || cache.expiresAt <= Date.now()) {
        if (cache)
            cache = null;
        return null;
    }
    if (key != null && cache.key !== key)
        return null;
    return cache.data;
}
function setCachedMenuHoy(data, key = 'default') {
    cache = { key, data, expiresAt: Date.now() + TTL_MS };
}
function invalidateMenuHoyCache() {
    cache = null;
}
//# sourceMappingURL=menu-hoy-cache.js.map