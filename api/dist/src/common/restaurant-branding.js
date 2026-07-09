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
exports.restaurantName = restaurantName;
exports.restaurantTicketPhone = restaurantTicketPhone;
exports.restaurantTicketAddress = restaurantTicketAddress;
exports.restaurantEmailDomain = restaurantEmailDomain;
exports.restaurantEmailSuffix = restaurantEmailSuffix;
exports.restaurantTextoGraciasTicket = restaurantTextoGraciasTicket;
exports.restaurantTextoPropinaTicket = restaurantTextoPropinaTicket;
exports.restaurantTextoAvisoNoDian = restaurantTextoAvisoNoDian;
exports.restaurantTextoPieCorreo = restaurantTextoPieCorreo;
exports.restaurantPrefijoAsuntoCorreo = restaurantPrefijoAsuntoCorreo;
exports.restaurantMostrarCreditoDrewTech = restaurantMostrarCreditoDrewTech;
exports.restaurantModuloEnvioCorreoActivo = restaurantModuloEnvioCorreoActivo;
exports.restaurantModuloResumenDiarioActivo = restaurantModuloResumenDiarioActivo;
exports.restaurantModuloMeserosOperativosActivo = restaurantModuloMeserosOperativosActivo;
exports.restaurantModuloInventarioActivo = restaurantModuloInventarioActivo;
exports.resolveImagesDir = resolveImagesDir;
exports.resolveRestaurantLogoPath = resolveRestaurantLogoPath;
exports.restaurantHasLogo = restaurantHasLogo;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const tenant_constants_1 = require("../tenant/tenant.constants");
const config_restaurante_cache_1 = require("../restaurante/config-restaurante-cache");
const LOGO_CANDIDATE_NAMES = [
    'logo.png',
    'ticket-logo.png',
    'ticket-logo-source.png',
];
function rowOrNull() {
    return (0, config_restaurante_cache_1.getCachedConfigRestaurante)(tenant_constants_1.DEFAULT_TENANT_ID);
}
function restaurantName() {
    const row = rowOrNull();
    if (row?.nombreComercial?.trim())
        return row.nombreComercial.trim();
    const raw = process.env.RESTAURANT_NAME?.trim();
    return raw || 'Restaurante';
}
function restaurantTicketPhone() {
    const row = rowOrNull();
    if (row?.telefono?.trim())
        return row.telefono.trim();
    return process.env.RESTAURANT_TICKET_PHONE?.trim() || '';
}
function restaurantTicketAddress() {
    const row = rowOrNull();
    if (row?.direccion?.trim())
        return row.direccion.trim();
    return process.env.RESTAURANT_TICKET_ADDRESS?.trim() || '';
}
function restaurantEmailDomain() {
    const row = rowOrNull();
    if (row?.dominioEmailInterno?.trim()) {
        return row.dominioEmailInterno.trim().replace(/^@/, '');
    }
    const raw = process.env.RESTAURANT_EMAIL_DOMAIN?.trim();
    return raw?.replace(/^@/, '') || 'drewrest.local';
}
function restaurantEmailSuffix() {
    return `@${restaurantEmailDomain()}`;
}
function restaurantTextoGraciasTicket() {
    const row = rowOrNull();
    return row?.textoGraciasTicket?.trim() || 'Gracias por su visita';
}
function restaurantTextoPropinaTicket() {
    const row = rowOrNull();
    return row?.textoPropinaTicket?.trim() || '*** PROPINA VOLUNTARIA ***';
}
function restaurantTextoAvisoNoDian() {
    const row = rowOrNull();
    return (row?.textoAvisoNoDian?.trim() ||
        'No constituye factura electrónica DIAN');
}
function restaurantTextoPieCorreo() {
    const row = rowOrNull();
    return row?.textoPieCorreo?.trim() || null;
}
function restaurantPrefijoAsuntoCorreo() {
    const row = rowOrNull();
    return row?.prefijoAsuntoCorreo?.trim() || null;
}
function restaurantMostrarCreditoDrewTech() {
    const row = rowOrNull();
    if (row)
        return row.mostrarCreditoDrewTech;
    return true;
}
function restaurantModuloEnvioCorreoActivo() {
    const row = rowOrNull();
    if (row)
        return row.moduloEnvioCorreoActivo;
    const env = process.env.MODULO_ENVIO_CORREO_ACTIVO?.trim();
    return env === 'true' || env === '1';
}
function restaurantModuloResumenDiarioActivo() {
    const row = rowOrNull();
    if (row)
        return row.moduloResumenDiarioActivo;
    return true;
}
function restaurantModuloMeserosOperativosActivo() {
    const row = rowOrNull();
    if (row)
        return row.moduloMeserosOperativosActivo;
    return true;
}
function restaurantModuloInventarioActivo() {
    const row = rowOrNull();
    if (row)
        return row.moduloInventarioActivo;
    return false;
}
function resolveImagesDir() {
    const envDir = process.env.RESTAURANT_IMAGES_DIR?.trim();
    if (envDir) {
        try {
            if (fs.existsSync(envDir))
                return path.resolve(envDir);
        }
        catch {
        }
    }
    const candidates = [
        path.join(process.cwd(), '..', '..', 'Images'),
        path.join(process.cwd(), '..', '..', 'images'),
        path.join(process.cwd(), 'images'),
        path.join(process.cwd(), '..', 'images'),
        path.join(__dirname, '..', '..', 'images'),
        path.join(__dirname, '..', '..', '..', 'images'),
        path.join(__dirname, '..', '..', '..', '..', 'images'),
    ];
    for (const dir of candidates) {
        try {
            if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
                return path.resolve(dir);
            }
        }
        catch {
        }
    }
    return path.resolve(process.cwd(), 'images');
}
function logoCandidatesFromConfig() {
    const row = rowOrNull();
    const configured = row?.logoArchivo?.trim();
    if (configured)
        return [configured, ...LOGO_CANDIDATE_NAMES];
    return [...LOGO_CANDIDATE_NAMES];
}
function resolveRestaurantLogoPath() {
    const dir = resolveImagesDir();
    for (const name of logoCandidatesFromConfig()) {
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
function restaurantHasLogo() {
    return resolveRestaurantLogoPath() != null;
}
//# sourceMappingURL=restaurant-branding.js.map