"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLogsLayout = resolveLogsLayout;
exports.isPathInside = isPathInside;
exports.assertAllowedApiLogFile = assertAllowedApiLogFile;
exports.assertAllowedLifecycleFile = assertAllowedLifecycleFile;
exports.assertLauncherLog = assertLauncherLog;
exports.fileExists = fileExists;
const fs_1 = require("fs");
const path_1 = require("path");
const API_LOG_RE = /^api-\d{4}-\d{2}-\d{2}\.log$/;
const LIFECYCLE_LOG_RE = /^lifecycle-\d{8}\.jsonl$/;
function resolveLogsLayout(cwd = process.cwd()) {
    const apiRoot = (0, path_1.resolve)(cwd);
    const installRoot = (0, path_1.resolve)(apiRoot, '..');
    const logDirEnv = process.env.LOG_DIR?.trim();
    const apiLogDir = logDirEnv
        ? (0, path_1.resolve)(logDirEnv.startsWith('/') || /^[A-Za-z]:/.test(logDirEnv) ? logDirEnv : (0, path_1.join)(apiRoot, logDirEnv))
        : (0, path_1.join)(apiRoot, 'logs');
    return {
        apiRoot,
        installRoot,
        apiLogDir,
        launcherLog: (0, path_1.join)(apiRoot, 'logs', 'launcher.log'),
        lifecycleLogDir: (0, path_1.join)(installRoot, 'data', 'logs'),
    };
}
function isPathInside(child, parent) {
    const c = (0, path_1.resolve)(child);
    const p = (0, path_1.resolve)(parent);
    return c === p || c.startsWith(p + (process.platform === 'win32' ? '\\' : '/'));
}
function assertAllowedApiLogFile(dir, name) {
    if (!API_LOG_RE.test(name)) {
        throw new Error('Archivo de log API no permitido');
    }
    const full = (0, path_1.resolve)(dir, name);
    if (!isPathInside(full, dir))
        throw new Error('Ruta no permitida');
    return full;
}
function assertAllowedLifecycleFile(dir, name) {
    if (!LIFECYCLE_LOG_RE.test(name)) {
        throw new Error('Archivo lifecycle no permitido');
    }
    const full = (0, path_1.resolve)(dir, name);
    if (!isPathInside(full, dir))
        throw new Error('Ruta no permitida');
    return full;
}
function assertLauncherLog(path, expected) {
    const full = (0, path_1.resolve)(path);
    if ((0, path_1.resolve)(full) !== (0, path_1.resolve)(expected))
        throw new Error('Ruta launcher no permitida');
    return full;
}
function fileExists(path) {
    try {
        return (0, fs_1.existsSync)(path);
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=logs-paths.js.map