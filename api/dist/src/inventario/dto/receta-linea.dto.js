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
exports.UpsertRecetaDto = exports.RecetaLineaDto = exports.SustitucionRecetaDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class SustitucionRecetaDto {
    id_articulo;
    factor;
}
exports.SustitucionRecetaDto = SustitucionRecetaDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SustitucionRecetaDto.prototype, "id_articulo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.000001),
    __metadata("design:type", Number)
], SustitucionRecetaDto.prototype, "factor", void 0);
class RecetaLineaDto {
    id_inventario;
    id_recurso;
    id_subreceta;
    cantidad;
    unidad;
    opcional;
    orden;
    sustituciones;
}
exports.RecetaLineaDto = RecetaLineaDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RecetaLineaDto.prototype, "id_inventario", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RecetaLineaDto.prototype, "id_recurso", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RecetaLineaDto.prototype, "id_subreceta", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.000001),
    __metadata("design:type", Number)
], RecetaLineaDto.prototype, "cantidad", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], RecetaLineaDto.prototype, "unidad", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RecetaLineaDto.prototype, "opcional", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RecetaLineaDto.prototype, "orden", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SustitucionRecetaDto),
    __metadata("design:type", Array)
], RecetaLineaDto.prototype, "sustituciones", void 0);
class UpsertRecetaDto {
    id_producto;
    lineas;
}
exports.UpsertRecetaDto = UpsertRecetaDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpsertRecetaDto.prototype, "id_producto", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RecetaLineaDto),
    __metadata("design:type", Array)
], UpsertRecetaDto.prototype, "lineas", void 0);
//# sourceMappingURL=receta-linea.dto.js.map