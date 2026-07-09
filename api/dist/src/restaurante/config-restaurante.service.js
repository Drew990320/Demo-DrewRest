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
exports.ConfigRestauranteService = void 0;
const common_1 = require("@nestjs/common");
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
            dominio_email_interno: row.dominioEmailInterno,
            logo_archivo: row.logoArchivo,
            tiene_logo: (0, restaurant_branding_1.restaurantHasLogo)(),
            texto_gracias_ticket: row.textoGraciasTicket,
            texto_propina_ticket: row.textoPropinaTicket,
            texto_aviso_no_dian: row.textoAvisoNoDian,
            texto_pie_correo: row.textoPieCorreo,
            prefijo_asunto_correo: row.prefijoAsuntoCorreo,
            mostrar_credito_drewtech: row.mostrarCreditoDrewTech,
            etiqueta_descuento_sopas: row.etiquetaDescuentoSopas,
            etiqueta_descuento_muleros: row.etiquetaDescuentoMuleros,
            modulo_inventario_activo: row.moduloInventarioActivo,
            modulo_meseros_operativos_activo: row.moduloMeserosOperativosActivo,
            modulo_envio_correo_activo: row.moduloEnvioCorreoActivo,
            modulo_resumen_diario_activo: row.moduloResumenDiarioActivo,
            modulo_contabilidad_activo: row.moduloContabilidadActivo,
            modulo_creditos_activo: row.moduloCreditosActivo,
            modulo_odoo_activo: row.moduloOdooActivo,
            actualizado_en: row.actualizadoEn.toISOString(),
        };
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
        const row = await this.prisma.configRestaurante.upsert({
            where: { idRestaurante: tenantId },
            create: {
                idRestaurante: tenantId,
                nombreComercial: dto.nombre_comercial?.trim() || 'Restaurante',
                telefono: dto.telefono?.trim() || null,
                direccion: dto.direccion?.trim() || null,
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
                etiquetaDescuentoSopas: dto.etiqueta_descuento_sopas?.trim() || 'Descuento sopas',
                etiquetaDescuentoMuleros: dto.etiqueta_descuento_muleros?.trim() ||
                    'Descuento clientes especiales',
                moduloInventarioActivo: dto.modulo_inventario_activo ?? false,
                moduloMeserosOperativosActivo: dto.modulo_meseros_operativos_activo ?? true,
                moduloEnvioCorreoActivo: dto.modulo_envio_correo_activo ?? false,
                moduloResumenDiarioActivo: dto.modulo_resumen_diario_activo ?? true,
                moduloContabilidadActivo: dto.modulo_contabilidad_activo ?? false,
                moduloCreditosActivo: dto.modulo_creditos_activo ?? false,
                moduloOdooActivo: dto.modulo_odoo_activo ?? false,
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
                ...(dto.modulo_creditos_activo !== undefined
                    ? { moduloCreditosActivo: dto.modulo_creditos_activo }
                    : {}),
                ...(dto.modulo_odoo_activo !== undefined
                    ? { moduloOdooActivo: dto.modulo_odoo_activo }
                    : {}),
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