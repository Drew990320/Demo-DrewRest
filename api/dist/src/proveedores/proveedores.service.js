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
exports.ProveedoresService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
let ProveedoresService = class ProveedoresService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    map(row) {
        return {
            id_proveedor: row.idProveedor,
            nombre: row.nombre,
            nit: row.nit,
            telefono: row.telefono,
            email: row.email,
            direccion: row.direccion,
            notas: row.notas,
            activo: row.activo,
            creado_en: row.creadoEn.toISOString(),
        };
    }
    async listar(soloActivos = true, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rows = await this.prisma.proveedor.findMany({
            where: {
                idRestaurante: tenantId,
                ...(soloActivos ? { activo: true } : {}),
            },
            orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
        });
        return rows.map((r) => this.map(r));
    }
    async crear(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const nombre = dto.nombre.trim();
        try {
            const row = await this.prisma.proveedor.create({
                data: {
                    idRestaurante: tenantId,
                    nombre,
                    nit: dto.nit?.trim() || null,
                    telefono: dto.telefono?.trim() || null,
                    email: dto.email?.trim() || null,
                    direccion: dto.direccion?.trim() || null,
                    notas: dto.notas?.trim() || null,
                },
            });
            return this.map(row);
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2002') {
                throw new common_1.ConflictException('Ya existe un proveedor con ese nombre');
            }
            throw e;
        }
    }
    async actualizar(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const actual = await this.prisma.proveedor.findFirst({
            where: { idProveedor: id, idRestaurante: tenantId },
        });
        if (!actual) {
            throw new common_1.NotFoundException('Proveedor no encontrado');
        }
        const row = await this.prisma.proveedor.update({
            where: { idProveedor: id },
            data: {
                ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
                ...(dto.nit !== undefined ? { nit: dto.nit.trim() || null } : {}),
                ...(dto.telefono !== undefined
                    ? { telefono: dto.telefono.trim() || null }
                    : {}),
                ...(dto.email !== undefined ? { email: dto.email.trim() || null } : {}),
                ...(dto.direccion !== undefined
                    ? { direccion: dto.direccion.trim() || null }
                    : {}),
                ...(dto.notas !== undefined ? { notas: dto.notas.trim() || null } : {}),
                ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
            },
        });
        return this.map(row);
    }
};
exports.ProveedoresService = ProveedoresService;
exports.ProveedoresService = ProveedoresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProveedoresService);
//# sourceMappingURL=proveedores.service.js.map