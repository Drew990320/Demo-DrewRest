"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.guardarAssetVisual = guardarAssetVisual;
exports.invalidarCacheAssetsTipo = invalidarCacheAssetsTipo;
exports.assetVisualConfigurado = assetVisualConfigurado;
exports.resolverAssetVisualPath = resolverAssetVisualPath;
exports.mimeFromAssetPath = mimeFromAssetPath;
exports.campoArchivoPorTipo = campoArchivoPorTipo;
exports.eliminarTodosAssetsVisuales = eliminarTodosAssetsVisuales;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const common_1 = require("@nestjs/common");
const restaurant_branding_1 = require("../common/restaurant-branding");
const logo_upload_util_1 = require("../restaurante/logo-upload.util");
const asset_file_cache_1 = require("./asset-file-cache");
const ASSET_BASENAMES = {
    login: ['logo-login.png', 'logo-login.jpg', 'logo-login.webp'],
    factura: ['logo-factura.png', 'logo-factura.jpg', 'logo-factura.webp'],
    ticket: ['logo-ticket.png', 'logo-ticket.jpg', 'logo-ticket.webp'],
    favicon: ['favicon.png', 'favicon.ico', 'favicon.webp'],
    'navbar-fondo': [
        'navbar-fondo.png',
        'navbar-fondo.jpg',
        'navbar-fondo.webp',
    ],
};
const ASSET_OUTPUT = {
    login: 'logo-login',
    factura: 'logo-factura',
    ticket: 'logo-ticket',
    favicon: 'favicon',
    'navbar-fondo': 'navbar-fondo',
};
const MAX_ASSET_BYTES = 5 * 1024 * 1024;
const MIME_TO_EXT = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
};
function inferirMimeAsset(mime, originalName) {
    const normalized = mime?.toLowerCase().split(';')[0]?.trim() ?? '';
    if (MIME_TO_EXT[normalized])
        return normalized;
    const ext = path.extname(originalName ?? '').toLowerCase();
    if (ext === '.png')
        return 'image/png';
    if (ext === '.jpg' || ext === '.jpeg')
        return 'image/jpeg';
    if (ext === '.webp')
        return 'image/webp';
    if (ext === '.ico')
        return 'image/x-icon';
    return '';
}
function guardarAssetVisual(tipo, buffer, mime, originalName) {
    if (!buffer?.length) {
        throw new common_1.BadRequestException('El archivo está vacío');
    }
    if (buffer.length > MAX_ASSET_BYTES) {
        throw new common_1.BadRequestException('El archivo no puede superar 5 MB');
    }
    const normalizedMime = inferirMimeAsset(mime, originalName);
    const ext = MIME_TO_EXT[normalizedMime];
    if (!ext) {
        throw new common_1.BadRequestException('Formato no admitido. Usa PNG, JPEG, WebP o ICO (favicon).');
    }
    const dir = (0, restaurant_branding_1.resolveImagesDir)();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const archivo = `${ASSET_OUTPUT[tipo]}.${ext}`;
    const ruta = path.join(dir, archivo);
    fs.writeFileSync(ruta, buffer);
    for (const old of ASSET_BASENAMES[tipo]) {
        if (old === archivo)
            continue;
        try {
            fs.unlinkSync(path.join(dir, old));
        }
        catch {
        }
    }
    return { archivo, ruta };
}
function invalidarCacheAssetsTipo(tipo) {
    const dir = (0, restaurant_branding_1.resolveImagesDir)();
    for (const name of ASSET_BASENAMES[tipo]) {
        (0, asset_file_cache_1.invalidateAssetFileCache)(path.join(dir, name));
    }
}
function assetVisualConfigurado(archivoConfigurado) {
    const archivo = archivoConfigurado?.trim();
    if (!archivo)
        return null;
    const full = path.join((0, restaurant_branding_1.resolveImagesDir)(), archivo);
    try {
        if (fs.existsSync(full) && fs.statSync(full).isFile())
            return full;
    }
    catch {
    }
    return null;
}
function resolverAssetVisualPath(tipo, archivoConfigurado) {
    const dir = (0, restaurant_branding_1.resolveImagesDir)();
    const candidatos = [
        ...(archivoConfigurado?.trim() ? [archivoConfigurado.trim()] : []),
        ...ASSET_BASENAMES[tipo],
    ];
    for (const name of candidatos) {
        const full = path.join(dir, name);
        try {
            if (fs.existsSync(full) && fs.statSync(full).isFile()) {
                return full;
            }
        }
        catch {
        }
    }
    return null;
}
function mimeFromAssetPath(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.ico')
        return 'image/x-icon';
    return (0, logo_upload_util_1.mimeFromLogoPath)(filePath);
}
function campoArchivoPorTipo(tipo) {
    switch (tipo) {
        case 'login':
            return 'logoLoginArchivo';
        case 'factura':
            return 'logoFacturaArchivo';
        case 'ticket':
            return 'logoTicketArchivo';
        case 'favicon':
            return 'faviconArchivo';
        case 'navbar-fondo':
            return 'navbarFondoArchivo';
    }
}
function eliminarTodosAssetsVisuales() {
    const dir = (0, restaurant_branding_1.resolveImagesDir)();
    const vistos = new Set();
    for (const basenames of Object.values(ASSET_BASENAMES)) {
        for (const name of basenames) {
            if (vistos.has(name))
                continue;
            vistos.add(name);
            try {
                fs.unlinkSync(path.join(dir, name));
            }
            catch {
            }
        }
    }
}
//# sourceMappingURL=visual-assets.util.js.map