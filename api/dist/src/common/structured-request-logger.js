"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.structuredRequestLogger = structuredRequestLogger;
const fs_1 = require("fs");
const path_1 = require("path");
function logFilePath() {
    const dir = process.env.LOG_DIR?.trim() || 'logs';
    const enabled = process.env.STRUCTURED_LOGS?.trim();
    if (enabled === '0' || enabled?.toLowerCase() === 'false')
        return null;
    try {
        (0, fs_1.mkdirSync)(dir, { recursive: true });
        const day = new Date().toISOString().slice(0, 10);
        return (0, path_1.join)(dir, `api-${day}.log`);
    }
    catch {
        return null;
    }
}
function structuredRequestLogger() {
    return (req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const entry = {
                ts: new Date().toISOString(),
                level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
                method: req.method,
                path: req.originalUrl,
                status: res.statusCode,
                ms: Date.now() - start,
                ip: req.ip,
            };
            const line = `${JSON.stringify(entry)}\n`;
            process.stdout.write(line);
            const file = logFilePath();
            if (file) {
                try {
                    (0, fs_1.appendFileSync)(file, line, 'utf8');
                }
                catch {
                }
            }
        });
        next();
    };
}
//# sourceMappingURL=structured-request-logger.js.map