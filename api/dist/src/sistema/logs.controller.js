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
exports.LogsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const logs_service_1 = require("./logs.service");
let LogsController = class LogsController {
    logs;
    constructor(logs) {
        this.logs = logs;
    }
    fuentes() {
        return this.logs.listarFuentes();
    }
    consultar(fuente = 'api', fecha, nivel, busqueda, lineas) {
        const f = fuente === 'launcher' || fuente === 'lifecycle' ? fuente : 'api';
        const n = lineas ? Number.parseInt(lineas, 10) : undefined;
        return this.logs.consultar({
            fuente: f,
            fecha: fecha?.trim() || undefined,
            nivel: nivel?.trim() || undefined,
            busqueda: busqueda?.trim() || undefined,
            lineas: Number.isFinite(n) ? n : undefined,
        });
    }
};
exports.LogsController = LogsController;
__decorate([
    (0, common_1.Get)('logs/fuentes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LogsController.prototype, "fuentes", null);
__decorate([
    (0, common_1.Get)('logs'),
    __param(0, (0, common_1.Query)('fuente')),
    __param(1, (0, common_1.Query)('fecha')),
    __param(2, (0, common_1.Query)('nivel')),
    __param(3, (0, common_1.Query)('busqueda')),
    __param(4, (0, common_1.Query)('lineas')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], LogsController.prototype, "consultar", null);
exports.LogsController = LogsController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('superadmin'),
    __metadata("design:paramtypes", [logs_service_1.LogsService])
], LogsController);
//# sourceMappingURL=logs.controller.js.map