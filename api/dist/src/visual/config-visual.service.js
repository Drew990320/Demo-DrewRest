"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigVisualService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const nav_app_icon_1 = require("@drewrest/shared-domain/nav-app-icon");
const action_app_icon_1 = require("@drewrest/shared-domain/action-app-icon");
const visual_style_1 = require("@drewrest/shared-domain/visual-style");
const mesa_visual_1 = require("@drewrest/shared-domain/mesa-visual");
const tenant_constants_1 = require("../tenant/tenant.constants");
const prisma_service_1 = require("../prisma/prisma.service");
const config_restaurante_cache_1 = require("../restaurante/config-restaurante-cache");
const logo_upload_util_1 = require("../restaurante/logo-upload.util");
const visual_assets_util_1 = require("./visual-assets.util");
const asset_file_cache_1 = require("./asset-file-cache");
const image_png_util_1 = require("./image-png.util");
let cachedRowByTenant = new Map();
let ConfigVisualService = class ConfigVisualService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        cachedRowByTenant.clear();
        await this.ensureRow(tenant_constants_1.DEFAULT_TENANT_ID);
    }
    async ensureRow(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const cached = cachedRowByTenant.get(tenantId);
        if (cached)
            return cached;
        let row = await this.prisma.configVisual.findUnique({
            where: { idRestaurante: tenantId },
        });
        if (!row) {
            row = await this.prisma.configVisual.create({
                data: { idRestaurante: tenantId },
            });
        }
        row = await this.aplicarPaletaFabricaSiCorresponde(row);
        cachedRowByTenant.set(tenantId, row);
        return row;
    }
    coloresCrudos(row) {
        return {
            primary: row.colorPrimary,
            primary_dark: row.colorPrimaryDark,
            secondary: row.colorSecondary,
            background: row.colorBackground,
            background_alt: row.colorBackgroundAlt,
            surface: row.colorSurface,
            text: row.colorText,
            text_muted: row.colorTextMuted,
            border: row.colorBorder,
        };
    }
    dataPaletaFabrica() {
        return {
            colorPrimary: nav_app_icon_1.VISUAL_COLOR_DEFAULTS.primary,
            colorPrimaryDark: nav_app_icon_1.VISUAL_COLOR_DEFAULTS.primary_dark,
            colorSecondary: nav_app_icon_1.VISUAL_COLOR_DEFAULTS.secondary,
            colorBackground: nav_app_icon_1.VISUAL_COLOR_DEFAULTS.background,
            colorBackgroundAlt: nav_app_icon_1.VISUAL_COLOR_DEFAULTS.background_alt,
            colorSurface: nav_app_icon_1.VISUAL_COLOR_DEFAULTS.surface,
            colorText: nav_app_icon_1.VISUAL_COLOR_DEFAULTS.text,
            colorTextMuted: nav_app_icon_1.VISUAL_COLOR_DEFAULTS.text_muted,
            colorBorder: nav_app_icon_1.VISUAL_COLOR_DEFAULTS.border,
        };
    }
    async aplicarPaletaFabricaSiCorresponde(row) {
        const crudos = this.coloresCrudos(row);
        const resueltos = this.mapColores(row);
        const debeAplicar = (0, nav_app_icon_1.coloresVisualesSinConfigurar)(crudos) ||
            (0, nav_app_icon_1.esPaletaVisualLegacy)(resueltos);
        if (!debeAplicar)
            return row;
        return this.prisma.configVisual.update({
            where: { idRestaurante: row.idRestaurante },
            data: this.dataPaletaFabrica(),
        });
    }
    invalidateCache(tenantId) {
        if (tenantId == null) {
            cachedRowByTenant.clear();
            return;
        }
        cachedRowByTenant.delete(tenantId);
    }
    async obtenerRow(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        return this.ensureRow(tenantId);
    }
    mapIconosAccion(raw) {
        const out = { ...action_app_icon_1.ACTION_ICON_DEFAULTS };
        if (!raw || typeof raw !== 'object')
            return out;
        for (const key of action_app_icon_1.ACTION_ICON_KEYS) {
            const val = raw[key];
            if (typeof val === 'string' && (0, nav_app_icon_1.esNavAppIconValido)(val)) {
                out[key] = val;
            }
        }
        return out;
    }
    mapIconosNav(raw) {
        const out = { ...nav_app_icon_1.NAV_ICON_DEFAULTS };
        if (!raw || typeof raw !== 'object')
            return out;
        for (const key of nav_app_icon_1.NAV_ICON_KEYS) {
            const val = raw[key];
            if (typeof val === 'string' && (0, nav_app_icon_1.esNavAppIconValido)(val)) {
                out[key] = val;
            }
        }
        return out;
    }
    mapColores(row) {
        const stored = {
            primary: row.colorPrimary,
            primary_dark: row.colorPrimaryDark,
            secondary: row.colorSecondary,
            background: row.colorBackground,
            background_alt: row.colorBackgroundAlt,
            surface: row.colorSurface,
            text: row.colorText,
            text_muted: row.colorTextMuted,
            border: row.colorBorder,
        };
        const out = {};
        for (const key of nav_app_icon_1.VISUAL_COLOR_KEYS) {
            out[key] = (0, nav_app_icon_1.resolverColorVisual)(key, stored[key]);
        }
        return out;
    }
    mapRow(row) {
        return {
            colores: this.mapColores(row),
            iconos_nav: this.mapIconosNav(row.iconosNav),
            iconos_accion: this.mapIconosAccion(row.iconosAccion),
            estilo_visual: (0, visual_style_1.resolverEstiloVisual)(row.estiloVisual),
            mesa_forma: (0, mesa_visual_1.esMesaFormaValida)(row.mesaForma) ? row.mesaForma : null,
            mesa_vista: (0, mesa_visual_1.esMesaVistaValida)(row.mesaVista) ? row.mesaVista : null,
            logo_login_archivo: row.logoLoginArchivo,
            logo_factura_archivo: row.logoFacturaArchivo,
            logo_ticket_archivo: row.logoTicketArchivo,
            favicon_archivo: row.faviconArchivo,
            navbar_fondo_archivo: row.navbarFondoArchivo,
            tiene_logo_login: Boolean((0, visual_assets_util_1.assetVisualConfigurado)(row.logoLoginArchivo)),
            tiene_logo_factura: Boolean((0, visual_assets_util_1.assetVisualConfigurado)(row.logoFacturaArchivo)),
            tiene_logo_ticket: Boolean((0, visual_assets_util_1.assetVisualConfigurado)(row.logoTicketArchivo)),
            tiene_favicon: Boolean((0, visual_assets_util_1.assetVisualConfigurado)(row.faviconArchivo)),
            tiene_navbar_fondo: Boolean((0, visual_assets_util_1.assetVisualConfigurado)(row.navbarFondoArchivo)),
            actualizado_en: row.actualizadoEn.toISOString(),
        };
    }
    async obtener(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        return this.mapRow(await this.obtenerRow(tenantId));
    }
    async obtenerPublica(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const base = await this.obtener(tenantId);
        return {
            ...base,
            urls: {
                login: base.tiene_logo_login ? '/visual/asset/login' : null,
                factura: base.tiene_logo_factura ? '/visual/asset/factura' : null,
                ticket: base.tiene_logo_ticket ? '/visual/asset/ticket' : null,
                favicon: base.tiene_favicon ? '/visual/asset/favicon' : null,
                'navbar-fondo': base.tiene_navbar_fondo
                    ? '/visual/asset/navbar-fondo'
                    : null,
            },
        };
    }
    async restablecer(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        (0, visual_assets_util_1.eliminarTodosAssetsVisuales)();
        (0, asset_file_cache_1.invalidateAssetFileCache)();
        const logoFabrica = (0, logo_upload_util_1.copiarLogoFabricaRestaurante)();
        await this.prisma.configRestaurante.updateMany({
            where: { idRestaurante: tenantId },
            data: { logoArchivo: logoFabrica },
        });
        (0, config_restaurante_cache_1.invalidateConfigRestauranteCache)(tenantId);
        await this.prisma.categoria.updateMany({
            where: { idRestaurante: tenantId },
            data: { iconoMenu: null },
        });
        this.invalidateCache(tenantId);
        const row = await this.prisma.configVisual.update({
            where: { idRestaurante: tenantId },
            data: {
                ...this.dataPaletaFabrica(),
                logoLoginArchivo: null,
                logoFacturaArchivo: null,
                logoTicketArchivo: null,
                faviconArchivo: null,
                navbarFondoArchivo: null,
                iconosNav: client_1.Prisma.DbNull,
                iconosAccion: client_1.Prisma.DbNull,
                estiloVisual: 'minimalista',
                mesaForma: null,
                mesaVista: null,
                actualizadoEn: new Date(),
            },
        });
        cachedRowByTenant.set(tenantId, row);
        return this.mapRow(row);
    }
    async actualizar(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const data = {};
        if (dto.color_primary !== undefined) {
            data.colorPrimary = (0, nav_app_icon_1.esColorHexValido)(dto.color_primary)
                ? dto.color_primary.trim()
                : null;
        }
        if (dto.color_primary_dark !== undefined) {
            data.colorPrimaryDark = (0, nav_app_icon_1.esColorHexValido)(dto.color_primary_dark)
                ? dto.color_primary_dark.trim()
                : null;
        }
        if (dto.color_secondary !== undefined) {
            data.colorSecondary = (0, nav_app_icon_1.esColorHexValido)(dto.color_secondary)
                ? dto.color_secondary.trim()
                : null;
        }
        if (dto.color_background !== undefined) {
            data.colorBackground = (0, nav_app_icon_1.esColorHexValido)(dto.color_background)
                ? dto.color_background.trim()
                : null;
        }
        if (dto.color_background_alt !== undefined) {
            data.colorBackgroundAlt = (0, nav_app_icon_1.esColorHexValido)(dto.color_background_alt)
                ? dto.color_background_alt.trim()
                : null;
        }
        if (dto.color_surface !== undefined) {
            data.colorSurface = (0, nav_app_icon_1.esColorHexValido)(dto.color_surface)
                ? dto.color_surface.trim()
                : null;
        }
        if (dto.color_text !== undefined) {
            data.colorText = (0, nav_app_icon_1.esColorHexValido)(dto.color_text)
                ? dto.color_text.trim()
                : null;
        }
        if (dto.color_text_muted !== undefined) {
            data.colorTextMuted = (0, nav_app_icon_1.esColorHexValido)(dto.color_text_muted)
                ? dto.color_text_muted.trim()
                : null;
        }
        if (dto.color_border !== undefined) {
            data.colorBorder = (0, nav_app_icon_1.esColorHexValido)(dto.color_border)
                ? dto.color_border.trim()
                : null;
        }
        if (dto.iconos_nav !== undefined) {
            const merged = this.mapIconosNav(dto.iconos_nav);
            data.iconosNav = merged;
        }
        if (dto.iconos_accion !== undefined) {
            data.iconosAccion = this.mapIconosAccion(dto.iconos_accion);
        }
        if (dto.estilo_visual !== undefined) {
            data.estiloVisual = (0, visual_style_1.esEstiloVisualValido)(dto.estilo_visual)
                ? dto.estilo_visual
                : 'minimalista';
        }
        if (dto.mesa_forma !== undefined) {
            data.mesaForma =
                dto.mesa_forma == null || dto.mesa_forma === ''
                    ? null
                    : (0, mesa_visual_1.esMesaFormaValida)(dto.mesa_forma)
                        ? dto.mesa_forma
                        : (0, mesa_visual_1.resolverMesaForma)(null);
        }
        if (dto.mesa_vista !== undefined) {
            data.mesaVista =
                dto.mesa_vista == null || dto.mesa_vista === ''
                    ? null
                    : (0, mesa_visual_1.esMesaVistaValida)(dto.mesa_vista)
                        ? dto.mesa_vista
                        : (0, mesa_visual_1.resolverMesaVista)(null);
        }
        await this.obtenerRow(tenantId);
        const row = await this.prisma.configVisual.update({
            where: { idRestaurante: tenantId },
            data,
        });
        cachedRowByTenant.set(tenantId, row);
        return this.mapRow(row);
    }
    async guardarAsset(tipo, buffer, mime, originalName, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        let uploadBuffer = buffer;
        let uploadMime = mime;
        if (image_png_util_1.LOGO_TIPOS_IMPRESION.has(tipo)) {
            uploadBuffer = await (0, image_png_util_1.normalizarBufferLogoPng)(buffer, mime);
            uploadMime = 'image/png';
        }
        const { archivo } = (0, visual_assets_util_1.guardarAssetVisual)(tipo, uploadBuffer, uploadMime, originalName);
        const field = (0, visual_assets_util_1.campoArchivoPorTipo)(tipo);
        const row = await this.prisma.configVisual.upsert({
            where: { idRestaurante: tenantId },
            create: { idRestaurante: tenantId, [field]: archivo },
            update: {
                [field]: archivo,
                actualizadoEn: new Date(),
            },
        });
        cachedRowByTenant.set(tenantId, row);
        (0, visual_assets_util_1.invalidarCacheAssetsTipo)(tipo);
        return { archivo, tipo };
    }
    resolveAssetPath(tipo, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const row = cachedRowByTenant.get(tenantId);
        if (!row)
            return null;
        switch (tipo) {
            case 'login':
                return (0, visual_assets_util_1.assetVisualConfigurado)(row.logoLoginArchivo);
            case 'factura':
                return (0, visual_assets_util_1.assetVisualConfigurado)(row.logoFacturaArchivo);
            case 'ticket':
                return (0, visual_assets_util_1.assetVisualConfigurado)(row.logoTicketArchivo);
            case 'favicon':
                return (0, visual_assets_util_1.assetVisualConfigurado)(row.faviconArchivo);
            case 'navbar-fondo':
                return (0, visual_assets_util_1.assetVisualConfigurado)(row.navbarFondoArchivo);
        }
    }
    iconoNav(key, row) {
        const iconos = this.mapIconosNav(row?.iconosNav);
        return (0, nav_app_icon_1.resolverIconoNav)(key, iconos[key]);
    }
};
exports.ConfigVisualService = ConfigVisualService;
exports.ConfigVisualService = ConfigVisualService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConfigVisualService);
//# sourceMappingURL=config-visual.service.js.map