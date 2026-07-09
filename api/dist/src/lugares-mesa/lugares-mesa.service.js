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
exports.LugaresMesaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
let LugaresMesaService = class LugaresMesaService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    map(row) {
        return {
            id_lugar: row.idLugar,
            nombre: row.nombre,
            orden: row.orden,
            activo: row.activo,
            creado_en: row.creadoEn.toISOString(),
            total_mesas: row._count?.mesas ?? 0,
        };
    }
    async ensureNombreDisponible(tenantId, nombre, excludeId) {
        const rows = await this.prisma.lugarMesa.findMany({
            where: {
                idRestaurante: tenantId,
                ...(excludeId ? { idLugar: { not: excludeId } } : {}),
            },
            select: { idLugar: true, nombre: true, activo: true },
        });
        const duplicado = rows.find((row) => row.activo && row.nombre.trim().toLowerCase() === nombre.toLowerCase());
        if (duplicado) {
            throw new common_1.ConflictException('Ya existe un lugar activo con ese nombre');
        }
    }
    async listar(todos = true, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rows = await this.prisma.lugarMesa.findMany({
            where: {
                idRestaurante: tenantId,
                ...(todos ? {} : { activo: true }),
            },
            include: { _count: { select: { mesas: true } } },
            orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
        });
        return rows.map((row) => this.map(row));
    }
    async crear(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const nombre = dto.nombre.trim();
        await this.ensureNombreDisponible(tenantId, nombre);
        const row = await this.prisma.lugarMesa.create({
            data: {
                idRestaurante: tenantId,
                nombre,
                orden: dto.orden ?? 1,
                activo: dto.activo ?? true,
            },
            include: { _count: { select: { mesas: true } } },
        });
        return this.map(row);
    }
    async actualizar(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const actual = await this.prisma.lugarMesa.findFirst({
            where: { idLugar: id, idRestaurante: tenantId },
            include: { _count: { select: { mesas: true } } },
        });
        if (!actual) {
            throw new common_1.NotFoundException('Lugar no encontrado');
        }
        const nombre = dto.nombre?.trim();
        if (nombre) {
            await this.ensureNombreDisponible(tenantId, nombre, id);
        }
        const row = await this.prisma.lugarMesa.update({
            where: { idLugar: id },
            data: {
                ...(nombre !== undefined ? { nombre } : {}),
                ...(dto.orden !== undefined ? { orden: dto.orden } : {}),
                ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
            },
            include: { _count: { select: { mesas: true } } },
        });
        return this.map(row);
    }
    async eliminar(id, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const actual = await this.prisma.lugarMesa.findFirst({
            where: { idLugar: id, idRestaurante: tenantId },
        });
        if (!actual) {
            throw new common_1.NotFoundException('Lugar no encontrado');
        }
        throw new common_1.ConflictException(`No se permite eliminar lugares. Usa "activo = false" para ocultar "${actual.nombre}" y conservar historial, devoluciones y referencias de mesas.`);
    }
};
exports.LugaresMesaService = LugaresMesaService;
exports.LugaresMesaService = LugaresMesaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LugaresMesaService);
//# sourceMappingURL=lugares-mesa.service.js.map