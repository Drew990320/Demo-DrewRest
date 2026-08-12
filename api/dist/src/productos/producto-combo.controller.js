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
exports.ProductoComboController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const combo_elegibles_dto_1 = require("./dto/combo-elegibles.dto");
const producto_combo_service_1 = require("./producto-combo.service");
let ProductoComboController = class ProductoComboController {
    combo;
    constructor(combo) {
        this.combo = combo;
    }
    listar(idProducto, tenantId) {
        return this.combo.listarElegibles(idProducto, tenantId);
    }
    reemplazar(idProducto, dto, tenantId) {
        return this.combo.reemplazarElegibles(idProducto, dto.id_productos ?? [], tenantId);
    }
};
exports.ProductoComboController = ProductoComboController;
__decorate([
    (0, common_1.Get)('productos/:idProducto/combo-elegibles'),
    __param(0, (0, common_1.Param)('idProducto', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ProductoComboController.prototype, "listar", null);
__decorate([
    (0, common_1.Put)('productos/:idProducto/combo-elegibles'),
    __param(0, (0, common_1.Param)('idProducto', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, combo_elegibles_dto_1.PutComboElegiblesDto, Number]),
    __metadata("design:returntype", void 0)
], ProductoComboController.prototype, "reemplazar", null);
exports.ProductoComboController = ProductoComboController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __metadata("design:paramtypes", [producto_combo_service_1.ProductoComboService])
], ProductoComboController);
//# sourceMappingURL=producto-combo.controller.js.map