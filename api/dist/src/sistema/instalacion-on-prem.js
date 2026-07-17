"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leerInstalacionOnPrem = leerInstalacionOnPrem;
const fs_1 = require("fs");
const path_1 = require("path");
const distribucion_enlaces_1 = require("./distribucion-enlaces");
const DREWREST_PRODUCCION_OWNER = 'Drew990320';
const DREWREST_PRODUCCION_REPO = 'DrewRestProduccion';
const DREWREST_PRODUCCION_BRANCH_GENERAL = 'main';
const DREWREST_PRODUCCION_REPO_URL = `https://github.com/${DREWREST_PRODUCCION_OWNER}/${DREWREST_PRODUCCION_REPO}.git`;
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
function encodeGitHubPathSegment(branch) {
    return branch
        .split('/')
        .map((p) => encodeURIComponent(p))
        .join('/');
}
function urlsCanal(branch) {
    const b = encodeGitHubPathSegment(branch);
    const owner = DREWREST_PRODUCCION_OWNER;
    const repo = DREWREST_PRODUCCION_REPO;
    return {
        canal: `https://github.com/${owner}/${repo}/tree/${b}`,
        version: `https://raw.githubusercontent.com/${owner}/${repo}/${b}/VERSION.json`,
        paquete: `https://github.com/${owner}/${repo}/archive/refs/heads/${b}.zip`,
    };
}
function leerInstalacionOnPrem(cwd = process.cwd()) {
    const apiRoot = cwd;
    const installRoot = (0, path_1.join)(apiRoot, '..');
    const version = readJsonFile((0, path_1.join)(installRoot, 'VERSION.json'));
    const channel = readJsonFile((0, path_1.join)(apiRoot, 'update-channel.json'));
    const labMarca = readTextFile((0, path_1.join)(installRoot, 'LAB-CANAL.txt'));
    const enlaces = (0, distribucion_enlaces_1.leerDistribucionEnlaces)(cwd);
    const canalBranch = channel?.branch?.trim() ||
        version?.branch?.trim() ||
        DREWREST_PRODUCCION_BRANCH_GENERAL;
    const general = urlsCanal(DREWREST_PRODUCCION_BRANCH_GENERAL);
    const personal = urlsCanal(canalBranch);
    const repoUrl = channel?.repoUrl?.trim() || DREWREST_PRODUCCION_REPO_URL;
    const urlActualizacion = enlaces.url_actualizacion_general?.trim() || general.canal;
    const urlPersonalizacion = enlaces.url_personalizacion?.trim() || personal.canal;
    return {
        version: version?.version ?? null,
        build_id: version?.buildId ?? null,
        build_date: version?.buildDate ?? null,
        canal: canalBranch,
        client_slug: channel?.clientSlug ?? version?.clientSlug ?? null,
        canal_label: channel?.label ?? null,
        lab_marca: labMarca,
        url_actualizacion_general: urlActualizacion,
        url_version_general: general.version,
        url_paquete_general: general.paquete,
        url_personalizacion_canal: urlPersonalizacion,
        url_personalizacion: urlPersonalizacion,
        url_version_canal: personal.version,
        url_paquete_canal: personal.paquete,
        url_repo_distribucion: repoUrl,
        url_personalizacion_visual: '/visual/publica',
        enlaces_personalizados: Boolean(enlaces.url_actualizacion_general || enlaces.url_personalizacion),
    };
}
//# sourceMappingURL=instalacion-on-prem.js.map