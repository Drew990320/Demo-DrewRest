"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leerInstalacionOnPrem = leerInstalacionOnPrem;
const fs_1 = require("fs");
const path_1 = require("path");
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
function readTextFile(path) {
    if (!(0, fs_1.existsSync)(path))
        return null;
    try {
        const raw = (0, fs_1.readFileSync)(path, 'utf8').trim();
        return raw || null;
    }
    catch {
        return null;
    }
}
function leerInstalacionOnPrem(cwd = process.cwd()) {
    const apiRoot = cwd;
    const installRoot = (0, path_1.join)(apiRoot, '..');
    const version = readJsonFile((0, path_1.join)(installRoot, 'VERSION.json'));
    const channel = readJsonFile((0, path_1.join)(apiRoot, 'update-channel.json'));
    const labMarca = readTextFile((0, path_1.join)(installRoot, 'LAB-CANAL.txt'));
    return {
        version: version?.version ?? null,
        build_id: version?.buildId ?? null,
        build_date: version?.buildDate ?? null,
        canal: channel?.branch ?? version?.branch ?? null,
        client_slug: channel?.clientSlug ?? version?.clientSlug ?? null,
        canal_label: channel?.label ?? null,
        lab_marca: labMarca,
    };
}
//# sourceMappingURL=instalacion-on-prem.js.map