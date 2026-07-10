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
exports.PERMISOS_MESERO_KEYS = exports.AsignarDelegacionCierreDto = exports.PatchPermisosChefDto = exports.PatchPermisosMeseroDto = void 0;
const class_validator_1 = require("class-validator");
const permisos_mesero_1 = require("@drewrest/shared-domain/permisos-mesero");
Object.defineProperty(exports, "PERMISOS_MESERO_KEYS", { enumerable: true, get: function () { return permisos_mesero_1.PERMISOS_MESERO_KEYS; } });
class PatchPermisosMeseroDto {
    agregar_items;
    editar_cantidades;
    quitar_lineas;
    enviar_cocina;
    reimprimir_comanda;
    cobrar;
    precuenta;
    reimprimir_factura;
    cancelar_pedido;
    transferir_mesa;
    agrupar_mesas;
    ayuda_companeros;
}
exports.PatchPermisosMeseroDto = PatchPermisosMeseroDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchPermisosMeseroDto.prototype, "agregar_items", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchPermisosMeseroDto.prototype, "editar_cantidades", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchPermisosMeseroDto.prototype, "quitar_lineas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchPermisosMeseroDto.prototype, "enviar_cocina", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchPermisosMeseroDto.prototype, "reimprimir_comanda", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchPermisosMeseroDto.prototype, "cobrar", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchPermisosMeseroDto.prototype, "precuenta", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchPermisosMeseroDto.prototype, "reimprimir_factura", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchPermisosMeseroDto.prototype, "cancelar_pedido", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchPermisosMeseroDto.prototype, "transferir_mesa", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchPermisosMeseroDto.prototype, "agrupar_mesas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchPermisosMeseroDto.prototype, "ayuda_companeros", void 0);
class PatchPermisosChefDto {
    ver_cola_cocina;
    marcar_listo;
    reimprimir_comanda;
    anular_linea_cocina;
}
exports.PatchPermisosChefDto = PatchPermisosChefDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchPermisosChefDto.prototype, "ver_cola_cocina", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchPermisosChefDto.prototype, "marcar_listo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchPermisosChefDto.prototype, "reimprimir_comanda", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchPermisosChefDto.prototype, "anular_linea_cocina", void 0);
class AsignarDelegacionCierreDto {
    fecha;
    id_usuario;
}
exports.AsignarDelegacionCierreDto = AsignarDelegacionCierreDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AsignarDelegacionCierreDto.prototype, "fecha", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.id_usuario != null),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Object)
], AsignarDelegacionCierreDto.prototype, "id_usuario", void 0);
//# sourceMappingURL=permisos.dto.js.map