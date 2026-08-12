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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigRestauranteService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const restaurant_branding_1 = require("../common/restaurant-branding");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const config_restaurante_cache_1 = require("./config-restaurante-cache");
const logo_upload_util_1 = require("./logo-upload.util");
function envFallbackNombre() {
    return process.env.RESTAURANT_NAME?.trim() || undefined;
}
function envFallbackTelefono() {
    return process.env.RESTAURANT_TICKET_PHONE?.trim() || undefined;
}
function envFallbackDireccion() {
    return process.env.RESTAURANT_TICKET_ADDRESS?.trim() || undefined;
}
function envFallbackNit() {
    return process.env.RESTAURANT_TICKET_NIT?.trim() || undefined;
}
function envFallbackDominio() {
    return process.env.RESTAURANT_EMAIL_DOMAIN?.trim()?.replace(/^@/, '') || undefined;
}
let ConfigRestauranteService = class ConfigRestauranteService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        await this.obtenerRow(tenant_constants_1.DEFAULT_TENANT_ID);
    }
    mapRow(row) {
        return {
            nombre_comercial: row.nombreComercial,
            telefono: row.telefono,
            direccion: row.direccion,
            nit: row.nit,
            dominio_email_interno: row.dominioEmailInterno,
            logo_archivo: row.logoArchivo,
            tiene_logo: (0, restaurant_branding_1.restaurantHasLogo)(),
            texto_gracias_ticket: row.textoGraciasTicket,
            texto_propina_ticket: row.textoPropinaTicket,
            texto_aviso_no_dian: row.textoAvisoNoDian,
            texto_pie_correo: row.textoPieCorreo,
            prefijo_asunto_correo: row.prefijoAsuntoCorreo,
            mostrar_credito_drewtech: row.mostrarCreditoDrewTech,
            factura_mostrar_logo: row.facturaMostrarLogo,
            factura_mostrar_mesero: row.facturaMostrarMesero,
            factura_mostrar_comensales: row.facturaMostrarComensales,
            factura_mostrar_detalle_items: row.facturaMostrarDetalleItems,
            factura_mostrar_descuentos: row.facturaMostrarDescuentos,
            factura_mostrar_metodo_pago: row.facturaMostrarMetodoPago,
            factura_mostrar_vuelto: row.facturaMostrarVuelto,
            factura_mostrar_propina: row.facturaMostrarPropina,
            factura_mostrar_gracias: row.facturaMostrarGracias,
            etiqueta_descuento_sopas: row.etiquetaDescuentoSopas,
            etiqueta_descuento_muleros: row.etiquetaDescuentoMuleros,
            modulo_inventario_activo: row.moduloInventarioActivo,
            modulo_meseros_operativos_activo: row.moduloMeserosOperativosActivo,
            modulo_envio_correo_activo: row.moduloEnvioCorreoActivo,
            modulo_resumen_diario_activo: row.moduloResumenDiarioActivo,
            modulo_contabilidad_activo: row.moduloContabilidadActivo,
            modulo_ganancias_activo: row.moduloGananciasActivo,
            modulo_creditos_activo: row.moduloCreditosActivo,
            modulo_odoo_activo: row.moduloOdooActivo,
            modulo_retail_activo: row.moduloRetailActivo,
            modulo_redondeo_cobro_activo: row.moduloRedondeoCobroActivo,
            modulo_login_pin_activo: row.moduloLoginPinActivo,
            modulo_autoservicio_activo: row.moduloAutoservicioActivo,
            modulo_menu_imagenes_activo: row.moduloMenuImagenesActivo,
            modulo_produccion_porciones_activo: row.moduloProduccionPorcionesActivo,
            login_pin_compartido_activo: row.loginPinCompartidoActivo,
            login_pin_definido: Boolean(row.loginPinHash?.trim()),
            actualizado_en: row.actualizadoEn.toISOString(),
        };
    }
    loginPinDisponible(row) {
        return (row.moduloLoginPinActivo &&
            row.loginPinCompartidoActivo &&
            Boolean(row.loginPinHash?.trim()));
    }
    async loginPinDisponibleAhora(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const row = await this.prisma.configRestaurante.findUnique({
            where: { idRestaurante: tenantId },
            select: {
                moduloLoginPinActivo: true,
                loginPinCompartidoActivo: true,
                loginPinHash: true,
            },
        });
        return row ? this.loginPinDisponible(row) : false;
    }
    async loginAutoservicioDisponibleAhora(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const row = await this.prisma.configRestaurante.findUnique({
            where: { idRestaurante: tenantId },
            select: { moduloAutoservicioActivo: true },
        });
        return Boolean(row?.moduloAutoservicioActivo);
    }
    async obtenerRow(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const cached = (0, config_restaurante_cache_1.getCachedConfigRestaurante)(tenantId);
        if (cached)
            return cached;
        let row = await this.prisma.configRestaurante.findUnique({
            where: { idRestaurante: tenantId },
        });
        if (!row) {
            await this.prisma.restaurante.upsert({
                where: { idRestaurante: tenantId },
                create: {
                    idRestaurante: tenantId,
                    slug: tenantId === tenant_constants_1.DEFAULT_TENANT_ID ? 'principal' : `tenant-${tenantId}`,
                    nombre: envFallbackNombre() ?? 'Restaurante',
                },
                update: {},
            });
            row = await this.prisma.configRestaurante.create({
                data: {
                    idRestaurante: tenantId,
                    nombreComercial: envFallbackNombre() ?? 'Restaurante',
                    telefono: envFallbackTelefono() ?? null,
                    direccion: envFallbackDireccion() ?? null,
                    nit: envFallbackNit() ?? null,
                    dominioEmailInterno: envFallbackDominio() ?? 'drewrest.local',
                },
            });
        }
        (0, config_restaurante_cache_1.setCachedConfigRestaurante)(tenantId, row);
        return row;
    }
    async obtener(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        return this.mapRow(await this.obtenerRow(tenantId));
    }
    async actualizar(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const actual = await this.obtenerRow(tenantId);
        const tocaPin = dto.login_pin !== undefined ||
            dto.login_pin_compartido_activo !== undefined;
        if (tocaPin && !actual.moduloLoginPinActivo) {
            throw new common_1.BadRequestException('El login con PIN no está habilitado para este restaurante. Contacta al superadmin.');
        }
        let loginPinHash;
        if (dto.login_pin !== undefined) {
            loginPinHash = await bcrypt.hash(dto.login_pin, 10);
        }
        const pinHashTras = loginPinHash ?? actual.loginPinHash ?? null;
        const pinActivoTras = dto.login_pin_compartido_activo !== undefined
            ? dto.login_pin_compartido_activo
            : actual.loginPinCompartidoActivo;
        if (pinActivoTras && !pinHashTras?.trim()) {
            throw new common_1.BadRequestException('Define un PIN de 4 dígitos antes de activar el login con PIN.');
        }
        const row = await this.prisma.configRestaurante.upsert({
            where: { idRestaurante: tenantId },
            create: {
                idRestaurante: tenantId,
                nombreComercial: dto.nombre_comercial?.trim() || 'Restaurante',
                telefono: dto.telefono?.trim() || null,
                direccion: dto.direccion?.trim() || null,
                nit: dto.nit?.trim() || null,
                dominioEmailInterno: dto.dominio_email_interno?.trim().replace(/^@/, '') ||
                    'drewrest.local',
                logoArchivo: dto.logo_archivo?.trim() || null,
                textoGraciasTicket: dto.texto_gracias_ticket?.trim() || 'Gracias por su visita',
                textoPropinaTicket: dto.texto_propina_ticket?.trim() || '*** PROPINA VOLUNTARIA ***',
                textoAvisoNoDian: dto.texto_aviso_no_dian?.trim() ||
                    'No constituye factura electrónica DIAN',
                textoPieCorreo: dto.texto_pie_correo?.trim() || null,
                prefijoAsuntoCorreo: dto.prefijo_asunto_correo?.trim() || null,
                mostrarCreditoDrewTech: dto.mostrar_credito_drewtech ?? true,
                facturaMostrarLogo: dto.factura_mostrar_logo ?? true,
                facturaMostrarMesero: dto.factura_mostrar_mesero ?? true,
                facturaMostrarComensales: dto.factura_mostrar_comensales ?? true,
                facturaMostrarDetalleItems: dto.factura_mostrar_detalle_items ?? true,
                facturaMostrarDescuentos: dto.factura_mostrar_descuentos ?? true,
                facturaMostrarMetodoPago: dto.factura_mostrar_metodo_pago ?? true,
                facturaMostrarVuelto: dto.factura_mostrar_vuelto ?? true,
                facturaMostrarPropina: dto.factura_mostrar_propina ?? true,
                facturaMostrarGracias: dto.factura_mostrar_gracias ?? true,
                etiquetaDescuentoSopas: dto.etiqueta_descuento_sopas?.trim() || 'Descuento sopas',
                etiquetaDescuentoMuleros: dto.etiqueta_descuento_muleros?.trim() ||
                    'Descuento clientes especiales',
                moduloInventarioActivo: dto.modulo_inventario_activo ?? true,
                moduloMeserosOperativosActivo: dto.modulo_meseros_operativos_activo ?? true,
                moduloEnvioCorreoActivo: dto.modulo_envio_correo_activo ?? false,
                moduloResumenDiarioActivo: dto.modulo_resumen_diario_activo ?? true,
                moduloContabilidadActivo: dto.modulo_contabilidad_activo ?? false,
                moduloGananciasActivo: dto.modulo_ganancias_activo ?? false,
                moduloCreditosActivo: dto.modulo_creditos_activo ?? false,
                moduloOdooActivo: dto.modulo_odoo_activo ?? false,
                ...(dto.login_pin_compartido_activo !== undefined
                    ? { loginPinCompartidoActivo: dto.login_pin_compartido_activo }
                    : {}),
                ...(loginPinHash !== undefined ? { loginPinHash } : {}),
            },
            update: {
                ...(dto.nombre_comercial !== undefined
                    ? { nombreComercial: dto.nombre_comercial.trim() || 'Restaurante' }
                    : {}),
                ...(dto.telefono !== undefined
                    ? { telefono: dto.telefono?.trim() || null }
                    : {}),
                ...(dto.direccion !== undefined
                    ? { direccion: dto.direccion?.trim() || null }
                    : {}),
                ...(dto.nit !== undefined ? { nit: dto.nit?.trim() || null } : {}),
                ...(dto.dominio_email_interno !== undefined
                    ? {
                        dominioEmailInterno: dto.dominio_email_interno.trim().replace(/^@/, '') ||
                            'drewrest.local',
                    }
                    : {}),
                ...(dto.logo_archivo !== undefined
                    ? { logoArchivo: dto.logo_archivo?.trim() || null }
                    : {}),
                ...(dto.texto_gracias_ticket !== undefined
                    ? {
                        textoGraciasTicket: dto.texto_gracias_ticket.trim() || 'Gracias por su visita',
                    }
                    : {}),
                ...(dto.texto_propina_ticket !== undefined
                    ? {
                        textoPropinaTicket: dto.texto_propina_ticket.trim() || '*** PROPINA VOLUNTARIA ***',
                    }
                    : {}),
                ...(dto.texto_aviso_no_dian !== undefined
                    ? { textoAvisoNoDian: dto.texto_aviso_no_dian.trim() }
                    : {}),
                ...(dto.texto_pie_correo !== undefined
                    ? { textoPieCorreo: dto.texto_pie_correo?.trim() || null }
                    : {}),
                ...(dto.prefijo_asunto_correo !== undefined
                    ? {
                        prefijoAsuntoCorreo: dto.prefijo_asunto_correo?.trim() || null,
                    }
                    : {}),
                ...(dto.mostrar_credito_drewtech !== undefined
                    ? { mostrarCreditoDrewTech: dto.mostrar_credito_drewtech }
                    : {}),
                ...(dto.factura_mostrar_logo !== undefined
                    ? { facturaMostrarLogo: dto.factura_mostrar_logo }
                    : {}),
                ...(dto.factura_mostrar_mesero !== undefined
                    ? { facturaMostrarMesero: dto.factura_mostrar_mesero }
                    : {}),
                ...(dto.factura_mostrar_comensales !== undefined
                    ? { facturaMostrarComensales: dto.factura_mostrar_comensales }
                    : {}),
                ...(dto.factura_mostrar_detalle_items !== undefined
                    ? { facturaMostrarDetalleItems: dto.factura_mostrar_detalle_items }
                    : {}),
                ...(dto.factura_mostrar_descuentos !== undefined
                    ? { facturaMostrarDescuentos: dto.factura_mostrar_descuentos }
                    : {}),
                ...(dto.factura_mostrar_metodo_pago !== undefined
                    ? { facturaMostrarMetodoPago: dto.factura_mostrar_metodo_pago }
                    : {}),
                ...(dto.factura_mostrar_vuelto !== undefined
                    ? { facturaMostrarVuelto: dto.factura_mostrar_vuelto }
                    : {}),
                ...(dto.factura_mostrar_propina !== undefined
                    ? { facturaMostrarPropina: dto.factura_mostrar_propina }
                    : {}),
                ...(dto.factura_mostrar_gracias !== undefined
                    ? { facturaMostrarGracias: dto.factura_mostrar_gracias }
                    : {}),
                ...(dto.etiqueta_descuento_sopas !== undefined
                    ? { etiquetaDescuentoSopas: dto.etiqueta_descuento_sopas.trim() }
                    : {}),
                ...(dto.etiqueta_descuento_muleros !== undefined
                    ? { etiquetaDescuentoMuleros: dto.etiqueta_descuento_muleros.trim() }
                    : {}),
                ...(dto.modulo_inventario_activo !== undefined
                    ? { moduloInventarioActivo: dto.modulo_inventario_activo }
                    : {}),
                ...(dto.modulo_meseros_operativos_activo !== undefined
                    ? {
                        moduloMeserosOperativosActivo: dto.modulo_meseros_operativos_activo,
                    }
                    : {}),
                ...(dto.modulo_envio_correo_activo !== undefined
                    ? { moduloEnvioCorreoActivo: dto.modulo_envio_correo_activo }
                    : {}),
                ...(dto.modulo_resumen_diario_activo !== undefined
                    ? { moduloResumenDiarioActivo: dto.modulo_resumen_diario_activo }
                    : {}),
                ...(dto.modulo_contabilidad_activo !== undefined
                    ? { moduloContabilidadActivo: dto.modulo_contabilidad_activo }
                    : {}),
                ...(dto.modulo_ganancias_activo !== undefined
                    ? { moduloGananciasActivo: dto.modulo_ganancias_activo }
                    : {}),
                ...(dto.modulo_creditos_activo !== undefined
                    ? { moduloCreditosActivo: dto.modulo_creditos_activo }
                    : {}),
                ...(dto.modulo_odoo_activo !== undefined
                    ? { moduloOdooActivo: dto.modulo_odoo_activo }
                    : {}),
                ...(dto.login_pin_compartido_activo !== undefined
                    ? { loginPinCompartidoActivo: dto.login_pin_compartido_activo }
                    : {}),
                ...(loginPinHash !== undefined ? { loginPinHash } : {}),
            },
        });
        (0, config_restaurante_cache_1.invalidateConfigRestauranteCache)(tenantId);
        (0, config_restaurante_cache_1.setCachedConfigRestaurante)(tenantId, row);
        return this.mapRow(row);
    }
    async guardarLogo(buffer, mime, originalName, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const { archivo } = (0, logo_upload_util_1.guardarArchivoLogoRestaurante)(buffer, mime, originalName);
        const row = await this.prisma.configRestaurante.upsert({
            where: { idRestaurante: tenantId },
            create: {
                idRestaurante: tenantId,
                logoArchivo: archivo,
            },
            update: {
                logoArchivo: archivo,
            },
        });
        (0, config_restaurante_cache_1.invalidateConfigRestauranteCache)(tenantId);
        (0, config_restaurante_cache_1.setCachedConfigRestaurante)(tenantId, row);
        return {
            logo_archivo: archivo,
            tiene_logo: (0, restaurant_branding_1.restaurantHasLogo)(),
        };
    }
};
exports.ConfigRestauranteService = ConfigRestauranteService;
exports.ConfigRestauranteService = ConfigRestauranteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConfigRestauranteService);
//# sourceMappingURL=config-restaurante.service.js.map