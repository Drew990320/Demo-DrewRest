"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.structuredRequestLogger = structuredRequestLogger;
const promises_1 = require("fs/promises");
const path_1 = require("path");
let cachedDay = null;
let cachedPath = null;
let dirReady = null;
function logFilePath() {
    const dir = process.env.LOG_DIR?.trim() || 'logs';
    const enabled = process.env.STRUCTURED_LOGS?.trim();
    if (enabled === '0' || enabled?.toLowerCase() === 'false')
        return null;
    const day = new Date().toISOString().slice(0, 10);
    if (cachedDay === day && cachedPath)
        return cachedPath;
    cachedDay = day;
    cachedPath = (0, path_1.join)(dir, `api-${day}.log`);
    if (!dirReady) {
        dirReady = (0, promises_1.mkdir)(dir, { recursive: true }).then(() => undefined, () => {
            dirReady = null;
        });
    }
    return cachedPath;
}
function structuredRequestLogger() {
    return (req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const entry = {
                ts: new Date().toISOString(),
                level: res.statusCode >= 500
                    ? 'error'
                    : res.statusCode >= 400
                        ? 'warn'
                        : 'info',
                method: req.method,
                path: req.originalUrl,
                status: res.statusCode,
                ms: Date.now() - start,
                ip: req.ip,
            };
            const line = `${JSON.stringify(entry)}\n`;
            process.stdout.write(line);
            const file = logFilePath();
            if (file && dirReady) {
                void dirReady
                    .then(() => (0, promises_1.appendFile)(file, line, 'utf8'))
                    .catch(() => {
                });
            }
        });
        next();
    };
}
//# sourceMappingURL=structured-request-logger.js.map