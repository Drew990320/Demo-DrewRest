"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedAuthUser = getCachedAuthUser;
exports.setCachedAuthUser = setCachedAuthUser;
exports.invalidateAuthUser = invalidateAuthUser;
exports.clearAuthUserCache = clearAuthUserCache;
const TTL_MS = 60_000;
const MAX_ENTRIES = 200;
const cache = new Map();
function evictExpired(now) {
    for (const [id, row] of cache) {
        if (row.expiresAt <= now)
            cache.delete(id);
    }
}
function evictOldestIfFull() {
    if (cache.size < MAX_ENTRIES)
        return;
    const first = cache.keys().next().value;
    if (first != null)
        cache.delete(first);
}
function getCachedAuthUser(idUsuario) {
    const row = cache.get(idUsuario);
    if (!row)
        return null;
    if (row.expiresAt <= Date.now()) {
        cache.delete(idUsuario);
        return null;
    }
    cache.delete(idUsuario);
    cache.set(idUsuario, row);
    return row.user;
}
function setCachedAuthUser(user) {
    const now = Date.now();
    evictExpired(now);
    if (cache.has(user.idUsuario)) {
        cache.delete(user.idUsuario);
    }
    else {
        evictOldestIfFull();
    }
    cache.set(user.idUsuario, {
        user,
        expiresAt: now + TTL_MS,
    });
}
function invalidateAuthUser(idUsuario) {
    cache.delete(idUsuario);
}
function clearAuthUserCache() {
    cache.clear();
}
//# sourceMappingURL=auth-user-cache.js.map