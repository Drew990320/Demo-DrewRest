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
exports.UpsertConfigInventarioDto = void 0;
const class_validator_1 = require("class-validator");
const inventario_deduccion_1 = require("@drewrest/shared-domain/inventario-deduccion");
class UpsertConfigInventarioDto {
    evento_deduccion_receta;
    evento_deduccion_comercial;
    evento_deduccion_consumible;
}
exports.UpsertConfigInventarioDto = UpsertConfigInventarioDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([...inventario_deduccion_1.EVENTOS_DEDUCCION]),
    __metadata("design:type", String)
], UpsertConfigInventarioDto.prototype, "evento_deduccion_receta", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([...inventario_deduccion_1.EVENTOS_DEDUCCION]),
    __metadata("design:type", String)
], UpsertConfigInventarioDto.prototype, "evento_deduccion_comercial", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v != null && v !== ''),
    (0, class_validator_1.IsIn)([...inventario_deduccion_1.EVENTOS_DEDUCCION]),
    __metadata("design:type", Object)
], UpsertConfigInventarioDto.prototype, "evento_deduccion_consumible", void 0);
//# sourceMappingURL=upsert-config-inventario.dto.js.map