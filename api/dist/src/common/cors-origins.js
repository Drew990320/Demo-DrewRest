"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCorsOrigin = resolveCorsOrigin;
function resolveCorsOrigin() {
    const raw = process.env.CORS_ORIGINS?.trim();
    if (!raw)
        return true;
    const allowlist = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    if (allowlist.length === 0)
        return true;
    return (origin, callback) => {
        if (!origin || allowlist.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`CORS bloqueado para origen: ${origin}`));
    };
}
//# sourceMappingURL=cors-origins.js.map