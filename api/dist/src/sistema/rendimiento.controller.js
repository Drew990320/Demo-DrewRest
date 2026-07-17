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
exports.RendimientoController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const latency_metrics_1 = require("../common/latency-metrics");
const pedidos_gateway_1 = require("../pedidos/pedidos.gateway");
let RendimientoController = class RendimientoController {
    gateway;
    constructor(gateway) {
        this.gateway = gateway;
    }
    rendimiento() {
        let sockets = 0;
        try {
            sockets = this.gateway?.server?.engine?.clientsCount ?? 0;
        }
        catch {
            sockets = 0;
        }
        return (0, latency_metrics_1.snapshotRendimiento)({ socketsConectados: sockets });
    }
};
exports.RendimientoController = RendimientoController;
__decorate([
    (0, common_1.Get)('rendimiento'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RendimientoController.prototype, "rendimiento", null);
exports.RendimientoController = RendimientoController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('superadmin'),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [pedidos_gateway_1.PedidosGateway])
], RendimientoController);
//# sourceMappingURL=rendimiento.controller.js.map