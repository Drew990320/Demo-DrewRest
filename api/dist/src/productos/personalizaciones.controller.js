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
exports.PersonalizacionesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const personalizacion_dto_1 = require("./dto/personalizacion.dto");
const personalizaciones_service_1 = require("./personalizaciones.service");
let PersonalizacionesController = class PersonalizacionesController {
    personalizaciones;
    constructor(personalizaciones) {
        this.personalizaciones = personalizaciones;
    }
    listar(idProducto) {
        return this.personalizaciones.listarPorProducto(idProducto);
    }
    crear(idProducto, dto) {
        return this.personalizaciones.crear(idProducto, dto);
    }
    actualizar(idOpcion, dto) {
        return this.personalizaciones.actualizar(idOpcion, dto);
    }
    eliminar(idOpcion) {
        return this.personalizaciones.eliminar(idOpcion);
    }
};
exports.PersonalizacionesController = PersonalizacionesController;
__decorate([
    (0, common_1.Get)('productos/:idProducto/personalizaciones'),
    __param(0, (0, common_1.Param)('idProducto', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PersonalizacionesController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)('productos/:idProducto/personalizaciones'),
    __param(0, (0, common_1.Param)('idProducto', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, personalizacion_dto_1.CreatePersonalizacionDto]),
    __metadata("design:returntype", void 0)
], PersonalizacionesController.prototype, "crear", null);
__decorate([
    (0, common_1.Patch)('personalizaciones/:idOpcion'),
    __param(0, (0, common_1.Param)('idOpcion', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, personalizacion_dto_1.UpdatePersonalizacionDto]),
    __metadata("design:returntype", void 0)
], PersonalizacionesController.prototype, "actualizar", null);
__decorate([
    (0, common_1.Delete)('personalizaciones/:idOpcion'),
    __param(0, (0, common_1.Param)('idOpcion', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PersonalizacionesController.prototype, "eliminar", null);
exports.PersonalizacionesController = PersonalizacionesController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:paramtypes", [personalizaciones_service_1.PersonalizacionesService])
], PersonalizacionesController);
//# sourceMappingURL=personalizaciones.controller.js.map