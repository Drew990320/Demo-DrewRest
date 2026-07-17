"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathsDistribucionEnlaces = pathsDistribucionEnlaces;
exports.leerDistribucionEnlaces = leerDistribucionEnlaces;
exports.guardarDistribucionEnlaces = guardarDistribucionEnlaces;
const fs_1 = require("fs");
const path_1 = require("path");
const EMPTY = {
    url_actualizacion_general: null,
    url_personalizacion: null,
};
function readJsonFile(path) {
    if (!(0, fs_1.existsSync)(path))
        return null;
    try {
        return JSON.parse((0, fs_1.readFileSync)(path, 'utf8'));
    }
    catch {
        return null;
    }
}
function normalizeUrl(raw) {
    const v = raw?.trim() ?? '';
    if (!v)
        return null;
    return v;
}
function pathsDistribucionEnlaces(cwd = process.cwd()) {
    const apiRoot = cwd;
    const installRoot = (0, path_1.join)(apiRoot, '..');
    return [
        (0, path_1.join)(apiRoot, 'distribucion-enlaces.json'),
        (0, path_1.join)(installRoot, 'distribucion-enlaces.json'),
    ];
}
function leerDistribucionEnlaces(cwd = process.cwd()) {
    for (const path of pathsDistribucionEnlaces(cwd)) {
        const raw = readJsonFile(path);
        if (!raw)
            continue;
        return {
            url_actualizacion_general: normalizeUrl(raw.url_actualizacion_general ?? raw.urlActualizacionGeneral),
            url_personalizacion: normalizeUrl(raw.url_personalizacion ?? raw.urlPersonalizacion),
        };
    }
    return { ...EMPTY };
}
function guardarDistribucionEnlaces(input, cwd = process.cwd()) {
    const current = leerDistribucionEnlaces(cwd);
    const next = {
        url_actualizacion_general: input.url_actualizacion_general !== undefined
            ? normalizeUrl(input.url_actualizacion_general)
            : current.url_actualizacion_general,
        url_personalizacion: input.url_personalizacion !== undefined
            ? normalizeUrl(input.url_personalizacion)
            : current.url_personalizacion,
    };
    const path = pathsDistribucionEnlaces(cwd)[0];
    const dir = (0, path_1.dirname)(path);
    if (!(0, fs_1.existsSync)(dir)) {
        (0, fs_1.mkdirSync)(dir, { recursive: true });
    }
    (0, fs_1.writeFileSync)(path, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    return next;
}
//# sourceMappingURL=distribucion-enlaces.js.map