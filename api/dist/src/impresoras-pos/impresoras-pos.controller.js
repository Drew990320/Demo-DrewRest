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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImpresorasPosController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const comanda_printer_service_1 = require("../pedidos/comanda-printer.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const impresora_pos_dto_1 = require("./dto/impresora-pos.dto");
const impresoras_pos_service_1 = require("./impresoras-pos.service");
const localhost_guard_1 = require("./localhost.guard");
let ImpresorasPosController = class ImpresorasPosController {
    impresoras;
    printer;
    constructor(impresoras, printer) {
        this.impresoras = impresoras;
        this.printer = printer;
    }
    listar(req) {
        return this.impresoras.listar(req.user.idRestaurante);
    }
    detectar() {
        return this.impresoras.detectar();
    }
    detectarLocal() {
        return this.impresoras.detectar();
    }
    async registrarLocal(body) {
        const row = await this.impresoras.upsertPorDestino(tenant_constants_1.DEFAULT_TENANT_ID, {
            nombre: body.nombre,
            destino: body.destino,
            roles: body.roles?.length
                ? body.roles
                : ['cocina', 'factura', 'caja'],
            baud_rate: body.baud_rate,
            es_cocina_maestra: body.es_cocina_maestra,
            activa: true,
        });
        return row;
    }
    async pruebaLocal(id) {
        const row = await this.impresoras.obtener(id, tenant_constants_1.DEFAULT_TENANT_ID);
        return this.printer.imprimirPruebaADestino(row.destino, row.baud_rate);
    }
    obtener(id, req) {
        return this.impresoras.obtener(id, req.user.idRestaurante);
    }
    crear(dto, req) {
        return this.impresoras.crear(dto, req.user.idRestaurante);
    }
    actualizar(id, dto, req) {
        return this.impresoras.actualizar(id, dto, req.user.idRestaurante);
    }
    eliminar(id, req) {
        return this.impresoras.eliminar(id, req.user.idRestaurante);
    }
    reglas(id, dto, req) {
        return this.impresoras.reemplazarReglas(id, dto, req.user.idRestaurante);
    }
    async prueba(id, req) {
        const row = await this.impresoras.obtener(id, req.user.idRestaurante);
        return this.printer.imprimirPruebaADestino(row.destino, row.baud_rate);
    }
    async estado(id, req) {
        const row = await this.impresoras.obtener(id, req.user.idRestaurante);
        return this.printer.consultarEstadoPapelDestino(row.destino, row.baud_rate);
    }
};
exports.ImpresorasPosController = ImpresorasPosController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ImpresorasPosController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)('detectar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ImpresorasPosController.prototype, "detectar", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('local/detectar'),
    (0, common_1.UseGuards)(localhost_guard_1.LocalhostGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ImpresorasPosController.prototype, "detectarLocal", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Post)('local/registrar'),
    (0, common_1.UseGuards)(localhost_guard_1.LocalhostGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ImpresorasPosController.prototype, "registrarLocal", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Post)('local/:id/prueba'),
    (0, common_1.UseGuards)(localhost_guard_1.LocalhostGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ImpresorasPosController.prototype, "pruebaLocal", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ImpresorasPosController.prototype, "obtener", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [impresora_pos_dto_1.CreateImpresoraPosDto, Object]),
    __metadata("design:returntype", void 0)
], ImpresorasPosController.prototype, "crear", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, impresora_pos_dto_1.UpdateImpresoraPosDto, Object]),
    __metadata("design:returntype", void 0)
], ImpresorasPosController.prototype, "actualizar", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ImpresorasPosController.prototype, "eliminar", null);
__decorate([
    (0, common_1.Put)(':id/reglas-cocina'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, impresora_pos_dto_1.ReplaceReglasCocinaDto, Object]),
    __metadata("design:returntype", void 0)
], ImpresorasPosController.prototype, "reglas", null);
__decorate([
    (0, common_1.Post)(':id/prueba'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ImpresorasPosController.prototype, "prueba", null);
__decorate([
    (0, common_1.Get)(':id/estado'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ImpresorasPosController.prototype, "estado", null);
exports.ImpresorasPosController = ImpresorasPosController = __decorate([
    (0, common_1.Controller)('impresoras-pos'),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => comanda_printer_service_1.ComandaPrinterService))),
    __metadata("design:paramtypes", [impresoras_pos_service_1.ImpresorasPosService,
        comanda_printer_service_1.ComandaPrinterService])
], ImpresorasPosController);
//# sourceMappingURL=impresoras-pos.controller.js.map