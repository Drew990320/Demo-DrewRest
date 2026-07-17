"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firstCorsOrigin = firstCorsOrigin;
exports.resolveDemoWebLoginUrl = resolveDemoWebLoginUrl;
exports.isCloudDemoDeployment = isCloudDemoDeployment;
exports.resolveCorsOrigin = resolveCorsOrigin;
function firstCorsOrigin() {
    const raw = process.env.CORS_ORIGINS?.trim();
    if (!raw)
        return null;
    const first = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)[0];
    return first ?? null;
}
function resolveDemoWebLoginUrl() {
    const explicit = process.env.DEMO_WEB_URL?.trim() || process.env.PUBLIC_WEB_URL?.trim();
    const base = explicit || firstCorsOrigin();
    if (!base)
        return null;
    const normalized = base.replace(/\/$/, '');
    return normalized.endsWith('/login') ? normalized : `${normalized}/login`;
}
function isCloudDemoDeployment() {
    if (process.env.RENDER === 'true')
        return true;
    if (process.env.DEMO_WEB_URL?.trim() || process.env.PUBLIC_WEB_URL?.trim()) {
        return true;
    }
    const cors = process.env.CORS_ORIGINS?.trim() ?? '';
    if (/onrender\.com/i.test(cors))
        return true;
    return false;
}
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