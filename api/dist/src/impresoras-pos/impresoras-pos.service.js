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
var ImpresorasPosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImpresorasPosService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs_1 = require("fs");
const path_1 = require("path");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const impresoras_pos_detect_1 = require("./impresoras-pos.detect");
const destinos_impresora_cache_1 = require("./destinos-impresora-cache");
let ImpresorasPosService = ImpresorasPosService_1 = class ImpresorasPosService {
    prisma;
    config;
    logger = new common_1.Logger(ImpresorasPosService_1.name);
    envMigrated = false;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async onModuleInit() {
        try {
            await this.asegurarMigracionEnv(tenant_constants_1.DEFAULT_TENANT_ID);
            await this.aplicarPendientesLauncher(tenant_constants_1.DEFAULT_TENANT_ID);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.warn(`Init impresoras POS: ${msg}`);
        }
    }
    pendingPaths() {
        const cwd = process.cwd();
        return [
            (0, path_1.join)(cwd, 'data', 'impresoras-pendientes.json'),
            (0, path_1.join)(cwd, '..', 'data', 'impresoras-pendientes.json'),
            (0, path_1.join)(cwd, '..', '..', 'data', 'impresoras-pendientes.json'),
        ];
    }
    async aplicarPendientesLauncher(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        for (const path of this.pendingPaths()) {
            if (!(0, fs_1.existsSync)(path))
                continue;
            try {
                const raw = (0, fs_1.readFileSync)(path, 'utf8');
                const data = JSON.parse(raw);
                const list = Array.isArray(data?.impresoras) ? data.impresoras : [];
                for (const item of list) {
                    if (!item?.destino?.trim())
                        continue;
                    await this.upsertPorDestino(tenantId, {
                        nombre: item.nombre?.trim() || item.destino.trim(),
                        destino: item.destino.trim(),
                        roles: item.roles?.length
                            ? item.roles
                            : ['cocina', 'factura', 'caja'],
                        baud_rate: item.baud_rate ?? null,
                        es_cocina_maestra: item.es_cocina_maestra ?? false,
                        activa: true,
                    });
                }
                (0, fs_1.unlinkSync)(path);
                this.logger.log(`Aplicadas ${list.length} impresora(s) pendientes desde ${path}`);
                this.enablePrinterEnv();
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                this.logger.warn(`No se pudo aplicar pendientes ${path}: ${msg}`);
            }
        }
    }
    async asegurarMigracionEnv(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        if (this.envMigrated)
            return;
        const count = await this.prisma.impresoraPos.count({
            where: { idRestaurante: tenantId },
        });
        if (count > 0) {
            this.envMigrated = true;
            return;
        }
        const raw = this.config.get('PRINTER_INTERFACE')?.trim() ||
            this.config.get('PRINTER_SERIAL_PORT')?.trim() ||
            '';
        if (!raw) {
            this.envMigrated = true;
            return;
        }
        const targets = raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        let orden = 0;
        for (const destino of targets) {
            const nombre = destino.startsWith('printer:')
                ? destino.slice('printer:'.length)
                : destino;
            const esPrimera = orden === 0;
            await this.prisma.impresoraPos.create({
                data: {
                    idRestaurante: tenantId,
                    nombre: nombre || destino,
                    destino,
                    activa: true,
                    orden: orden++,
                    roles: ['cocina', 'factura', 'caja'],
                    esCocinaMaestra: esPrimera,
                    baudRate: Number(this.config.get('PRINTER_BAUD_RATE')) || null,
                },
            });
        }
        this.envMigrated = true;
        this.logger.log(`Migradas ${targets.length} impresora(s) desde PRINTER_INTERFACE`);
    }
    enablePrinterEnv() {
        process.env.PRINTER_ENABLED = 'true';
    }
    serializar(row) {
        return {
            id_impresora: row.idImpresora,
            nombre: row.nombre,
            destino: row.destino,
            activa: row.activa,
            orden: row.orden,
            baud_rate: row.baudRate,
            roles: row.roles,
            es_cocina_maestra: row.esCocinaMaestra,
            reglas_cocina: (row.reglasCocina ?? []).map((r) => ({
                id_regla: r.idRegla,
                alcance: r.alcance,
                id_categoria: r.idCategoria,
                id_producto: r.idProducto,
                orden: r.orden,
                categoria_nombre: r.categoria?.nombre ?? null,
                producto_nombre: r.producto?.nombre ?? null,
            })),
        };
    }
    async listar(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.asegurarMigracionEnv(tenantId);
        await this.aplicarPendientesLauncher(tenantId);
        const rows = await this.prisma.impresoraPos.findMany({
            where: { idRestaurante: tenantId },
            include: {
                reglasCocina: {
                    orderBy: { orden: 'asc' },
                    include: {
                        categoria: { select: { nombre: true } },
                        producto: { select: { nombre: true } },
                    },
                },
            },
            orderBy: [{ orden: 'asc' }, { idImpresora: 'asc' }],
        });
        return rows.map((r) => this.serializar(r));
    }
    async obtener(id, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const row = await this.prisma.impresoraPos.findFirst({
            where: { idImpresora: id, idRestaurante: tenantId },
            include: {
                reglasCocina: {
                    orderBy: { orden: 'asc' },
                    include: {
                        categoria: { select: { nombre: true } },
                        producto: { select: { nombre: true } },
                    },
                },
            },
        });
        if (!row)
            throw new common_1.NotFoundException('Impresora no encontrada');
        return this.serializar(row);
    }
    async crear(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        this.validarDestino(dto.destino);
        if (!dto.roles?.length) {
            throw new common_1.BadRequestException('Asigne al menos un rol');
        }
        const maxOrden = await this.prisma.impresoraPos.aggregate({
            where: { idRestaurante: tenantId },
            _max: { orden: true },
        });
        const row = await this.prisma.impresoraPos.create({
            data: {
                idRestaurante: tenantId,
                nombre: dto.nombre.trim(),
                destino: dto.destino.trim(),
                activa: dto.activa ?? true,
                orden: dto.orden ?? (maxOrden._max.orden ?? -1) + 1,
                baudRate: dto.baud_rate ?? null,
                roles: dto.roles,
                esCocinaMaestra: dto.es_cocina_maestra ?? false,
            },
            include: { reglasCocina: true },
        });
        if (dto.es_cocina_maestra) {
            await this.prisma.impresoraPos.updateMany({
                where: {
                    idRestaurante: tenantId,
                    idImpresora: { not: row.idImpresora },
                    esCocinaMaestra: true,
                },
                data: { esCocinaMaestra: false },
            });
        }
        this.enablePrinterEnv();
        (0, destinos_impresora_cache_1.invalidateDestinosImpresoraCache)(tenantId);
        return this.serializar(row);
    }
    async actualizar(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.obtener(id, tenantId);
        if (dto.destino)
            this.validarDestino(dto.destino);
        if (dto.roles && dto.roles.length === 0) {
            throw new common_1.BadRequestException('Asigne al menos un rol');
        }
        const row = await this.prisma.impresoraPos.update({
            where: { idImpresora: id },
            data: {
                ...(dto.nombre != null ? { nombre: dto.nombre.trim() } : {}),
                ...(dto.destino != null ? { destino: dto.destino.trim() } : {}),
                ...(dto.activa != null ? { activa: dto.activa } : {}),
                ...(dto.orden != null ? { orden: dto.orden } : {}),
                ...(dto.baud_rate !== undefined ? { baudRate: dto.baud_rate } : {}),
                ...(dto.roles != null ? { roles: dto.roles } : {}),
                ...(dto.es_cocina_maestra != null
                    ? { esCocinaMaestra: dto.es_cocina_maestra }
                    : {}),
            },
            include: {
                reglasCocina: {
                    orderBy: { orden: 'asc' },
                    include: {
                        categoria: { select: { nombre: true } },
                        producto: { select: { nombre: true } },
                    },
                },
            },
        });
        if (dto.es_cocina_maestra === true) {
            await this.prisma.impresoraPos.updateMany({
                where: {
                    idRestaurante: tenantId,
                    idImpresora: { not: id },
                    esCocinaMaestra: true,
                },
                data: { esCocinaMaestra: false },
            });
        }
        if (row.activa)
            this.enablePrinterEnv();
        (0, destinos_impresora_cache_1.invalidateDestinosImpresoraCache)(tenantId);
        return this.serializar(row);
    }
    async eliminar(id, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.obtener(id, tenantId);
        await this.prisma.impresoraPos.delete({ where: { idImpresora: id } });
        (0, destinos_impresora_cache_1.invalidateDestinosImpresoraCache)(tenantId);
        return { ok: true };
    }
    async reemplazarReglas(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const impresora = await this.obtener(id, tenantId);
        if (!impresora.roles.includes('cocina')) {
            throw new common_1.BadRequestException('Solo impresoras con rol cocina pueden tener reglas de estación');
        }
        for (const r of dto.reglas) {
            if (r.alcance === 'categoria' && !r.id_categoria) {
                throw new common_1.BadRequestException('Regla categoría sin id_categoria');
            }
            if (r.alcance === 'producto' && !r.id_producto) {
                throw new common_1.BadRequestException('Regla producto sin id_producto');
            }
        }
        await this.prisma.$transaction([
            this.prisma.reglaImpresionCocina.deleteMany({ where: { idImpresora: id } }),
            ...dto.reglas.map((r, i) => this.prisma.reglaImpresionCocina.create({
                data: {
                    idImpresora: id,
                    alcance: r.alcance,
                    idCategoria: r.alcance === 'categoria' ? r.id_categoria : null,
                    idProducto: r.alcance === 'producto' ? r.id_producto : null,
                    orden: r.orden ?? i,
                },
            })),
        ]);
        (0, destinos_impresora_cache_1.invalidateDestinosImpresoraCache)(tenantId);
        return this.obtener(id, tenantId);
    }
    async detectar() {
        const detectadas = await (0, impresoras_pos_detect_1.detectarImpresorasSistema)();
        return { detectadas, plataforma: process.platform };
    }
    async upsertPorDestino(tenantId, data) {
        this.validarDestino(data.destino);
        const existing = await this.prisma.impresoraPos.findFirst({
            where: { idRestaurante: tenantId, destino: data.destino.trim() },
        });
        if (existing) {
            return this.actualizar(existing.idImpresora, {
                nombre: data.nombre,
                roles: data.roles,
                baud_rate: data.baud_rate,
                es_cocina_maestra: data.es_cocina_maestra,
                activa: data.activa,
            }, tenantId);
        }
        return this.crear({
            nombre: data.nombre,
            destino: data.destino,
            roles: data.roles,
            baud_rate: data.baud_rate,
            es_cocina_maestra: data.es_cocina_maestra,
            activa: data.activa,
        }, tenantId);
    }
    async destinosParaRol(rol, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const cached = (0, destinos_impresora_cache_1.getCachedDestinos)(tenantId, rol);
        if (cached)
            return cached;
        await this.asegurarMigracionEnv(tenantId);
        const rows = await this.prisma.impresoraPos.findMany({
            where: {
                idRestaurante: tenantId,
                activa: true,
                roles: { has: rol },
            },
            include: {
                reglasCocina: { orderBy: { orden: 'asc' } },
            },
            orderBy: [{ orden: 'asc' }, { idImpresora: 'asc' }],
        });
        let destinos;
        if (rows.length > 0) {
            destinos = rows.map((r) => ({
                id_impresora: r.idImpresora,
                nombre: r.nombre,
                destino: r.destino,
                baud_rate: r.baudRate,
                es_cocina_maestra: r.esCocinaMaestra,
                reglas: r.reglasCocina.map((regla) => ({
                    alcance: regla.alcance,
                    id_categoria: regla.idCategoria,
                    id_producto: regla.idProducto,
                })),
            }));
        }
        else {
            const raw = this.config.get('PRINTER_INTERFACE')?.trim() ||
                this.config.get('PRINTER_SERIAL_PORT')?.trim() ||
                '';
            if (!raw) {
                destinos = [];
            }
            else {
                destinos = raw
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((destino, i) => ({
                    id_impresora: null,
                    nombre: destino,
                    destino,
                    baud_rate: null,
                    es_cocina_maestra: i === 0,
                    reglas: [],
                }));
            }
        }
        (0, destinos_impresora_cache_1.setCachedDestinos)(tenantId, rol, destinos);
        return destinos;
    }
    validarDestino(destino) {
        const t = destino.trim();
        if (!t)
            throw new common_1.BadRequestException('Destino vacío');
        const lower = t.toLowerCase();
        if (lower.startsWith('printer:')) {
            if (!t.slice('printer:'.length).trim()) {
                throw new common_1.BadRequestException('Nombre de impresora Windows vacío');
            }
            return;
        }
        if (/^COM\d+$/i.test(t) || t.startsWith('\\\\.\\'))
            return;
        throw new common_1.BadRequestException('Destino inválido. Use printer:Nombre o COM3');
    }
};
exports.ImpresorasPosService = ImpresorasPosService;
exports.ImpresorasPosService = ImpresorasPosService = ImpresorasPosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], ImpresorasPosService);
//# sourceMappingURL=impresoras-pos.service.js.map