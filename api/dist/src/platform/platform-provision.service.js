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
exports.PlatformProvisionService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const categoria_reglas_1 = require("@drewrest/shared-domain/categoria-reglas");
const prisma_service_1 = require("../prisma/prisma.service");
let PlatformProvisionService = class PlatformProvisionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        await this.ensureRoles();
    }
    async ensureRoles() {
        const existing = await this.prisma.rol.count();
        if (existing > 0)
            return;
        await this.prisma.rol.createMany({
            data: [
                { nombre: 'mesero', descripcion: 'Toma pedidos y factura' },
                { nombre: 'chef', descripcion: 'Vista cocina' },
                { nombre: 'admin', descripcion: 'Administración' },
            ],
        });
    }
    async provision(dto) {
        const slug = dto.slug.trim().toLowerCase();
        const nombre = dto.nombre.trim();
        const plan = dto.plan?.trim() || 'core';
        const dominio = dto.dominio_email_interno?.trim().replace(/^@/, '') ||
            `${slug}.drewrest.local`;
        const adminEmail = dto.admin_email?.trim().toLowerCase() ||
            `admin@${dominio.replace(/\.drewrest\.local$/i, '')}.drewrest.local`;
        const mesasSalon = dto.mesas_salon ?? 10;
        const dup = await this.prisma.restaurante.findUnique({
            where: { slug },
            select: { idRestaurante: true },
        });
        if (dup) {
            throw new common_1.ConflictException(`El slug "${slug}" ya está en uso`);
        }
        const rolAdmin = await this.prisma.rol.findFirstOrThrow({
            where: { nombre: 'admin' },
        });
        const passwordHash = bcrypt.hashSync(dto.admin_password, 10);
        const result = await this.prisma.$transaction(async (tx) => {
            const restaurante = await tx.restaurante.create({
                data: { slug, nombre, plan, activo: true },
            });
            const tenantId = restaurante.idRestaurante;
            await tx.configRestaurante.create({
                data: {
                    idRestaurante: tenantId,
                    nombreComercial: nombre,
                    dominioEmailInterno: dominio,
                    moduloResumenDiarioActivo: true,
                    moduloMeserosOperativosActivo: true,
                },
            });
            await tx.configOperativa.create({
                data: {
                    idRestaurante: tenantId,
                    mazorcaActiva: false,
                    prioridadCocinaAutomatica: false,
                    prioridadCocinaModo: 'fifo',
                    numeroMesaParaLlevar: 98,
                    numeroMesaMostrador: 99,
                },
            });
            await tx.configDescuento.create({
                data: { idRestaurante: tenantId },
            });
            await tx.configVisual.create({
                data: { idRestaurante: tenantId },
            });
            await tx.permisosMeseroConfig.create({
                data: { idRestaurante: tenantId },
            });
            await tx.permisosChefConfig.create({
                data: { idRestaurante: tenantId },
            });
            for (let n = 1; n <= mesasSalon; n++) {
                await tx.mesa.create({
                    data: {
                        idRestaurante: tenantId,
                        numero: n,
                        capacidad: 4,
                        estado: 'libre',
                    },
                });
            }
            await tx.mesa.createMany({
                data: [
                    {
                        idRestaurante: tenantId,
                        numero: 98,
                        capacidad: 1,
                        estado: 'libre',
                    },
                    {
                        idRestaurante: tenantId,
                        numero: 99,
                        capacidad: 1,
                        estado: 'libre',
                    },
                ],
            });
            await this.seedMenuMinimal(tx, tenantId);
            await tx.usuario.create({
                data: {
                    idRestaurante: tenantId,
                    idRol: rolAdmin.idRol,
                    nombre: dto.admin_nombre?.trim() || 'Administrador',
                    apellido: '',
                    email: adminEmail,
                    passwordHash,
                    activo: true,
                },
            });
            return {
                id_restaurante: tenantId,
                slug,
                nombre,
                plan,
                admin_email: adminEmail,
                mesas_salon: mesasSalon,
            };
        });
        return result;
    }
    async seedMenuMinimal(tx, tenantId) {
        const categoriasData = [
            {
                nombre: 'Platos principales',
                productos: [{ nombre: 'Plato del día', precio: 25000 }],
            },
            {
                nombre: 'Bebidas',
                productos: [
                    { nombre: 'Agua', precio: 2000 },
                    { nombre: 'Gaseosa', precio: 4000 },
                ],
            },
        ];
        for (const cat of categoriasData) {
            const defaults = (0, categoria_reglas_1.reglasCategoriaPorDefecto)(cat.nombre);
            const esBebida = /bebida/i.test(cat.nombre);
            const esPlato = /plato/i.test(cat.nombre);
            await tx.categoria.create({
                data: {
                    idRestaurante: tenantId,
                    nombre: cat.nombre,
                    disponibleLunes: true,
                    disponibleMartes: true,
                    disponibleMiercoles: true,
                    disponibleJueves: true,
                    disponibleViernes: true,
                    disponibleSabado: true,
                    disponibleDomingo: true,
                    esBebida: esBebida || defaults.es_bebida,
                    cobraEmpaqueParaLlevar: defaults.cobra_empaque_para_llevar,
                    participaDescuentoSopas: defaults.participa_descuento_sopas,
                    esLineaEmpaque: defaults.es_linea_empaque,
                    visibleEnMostrador: esBebida || defaults.visible_en_mostrador,
                    tipoLineaCocinaDefault: defaults.tipo_linea_cocina_default,
                    esPlatoPrincipalDefault: esPlato || defaults.es_plato_principal_default,
                    prioridadCocinaBaja: false,
                    productos: {
                        create: cat.productos.map((p) => ({
                            nombre: p.nombre,
                            descripcion: null,
                            precio: p.precio,
                            activo: true,
                            tipoProteina: 'ninguno',
                            esPlatoPrincipal: esPlato,
                            esEmpacable: false,
                            enviaCocina: !esBebida,
                            usaSubitemsRepartibles: false,
                        })),
                    },
                },
            });
        }
    }
};
exports.PlatformProvisionService = PlatformProvisionService;
exports.PlatformProvisionService = PlatformProvisionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlatformProvisionService);
//# sourceMappingURL=platform-provision.service.js.map