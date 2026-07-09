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
exports.ProductoSubitemsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const producto_subitem_dto_1 = require("./dto/producto-subitem.dto");
const producto_subitems_service_1 = require("./producto-subitems.service");
let ProductoSubitemsController = class ProductoSubitemsController {
    subitems;
    constructor(subitems) {
        this.subitems = subitems;
    }
    listar(idProducto) {
        return this.subitems.listarPorProducto(idProducto);
    }
    crear(idProducto, dto) {
        return this.subitems.crear(idProducto, dto);
    }
    actualizar(idSubitem, dto) {
        return this.subitems.actualizar(idSubitem, dto);
    }
    eliminar(idSubitem) {
        return this.subitems.eliminar(idSubitem);
    }
};
exports.ProductoSubitemsController = ProductoSubitemsController;
__decorate([
    (0, common_1.Get)('productos/:idProducto/subitems'),
    __param(0, (0, common_1.Param)('idProducto', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProductoSubitemsController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)('productos/:idProducto/subitems'),
    __param(0, (0, common_1.Param)('idProducto', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, producto_subitem_dto_1.CreateProductoSubitemDto]),
    __metadata("design:returntype", void 0)
], ProductoSubitemsController.prototype, "crear", null);
__decorate([
    (0, common_1.Patch)('subitems/:idSubitem'),
    __param(0, (0, common_1.Param)('idSubitem', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, producto_subitem_dto_1.UpdateProductoSubitemDto]),
    __metadata("design:returntype", void 0)
], ProductoSubitemsController.prototype, "actualizar", null);
__decorate([
    (0, common_1.Delete)('subitems/:idSubitem'),
    __param(0, (0, common_1.Param)('idSubitem', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProductoSubitemsController.prototype, "eliminar", null);
exports.ProductoSubitemsController = ProductoSubitemsController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:paramtypes", [producto_subitems_service_1.ProductoSubitemsService])
], ProductoSubitemsController);
//# sourceMappingURL=producto-subitems.controller.js.map