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
exports.ReversarAsientoDto = exports.AsientoManualDto = exports.CrearCategoriaContableDto = exports.MovimientoSimpleDto = exports.UpsertConfigContabilidadDto = void 0;
const class_validator_1 = require("class-validator");
class UpsertConfigContabilidadDto {
    posteo_automatico;
    modo_ui_default;
    id_plan_activo;
}
exports.UpsertConfigContabilidadDto = UpsertConfigContabilidadDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpsertConfigContabilidadDto.prototype, "posteo_automatico", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertConfigContabilidadDto.prototype, "modo_ui_default", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpsertConfigContabilidadDto.prototype, "id_plan_activo", void 0);
class MovimientoSimpleDto {
    id_categoria;
    monto;
    fecha;
    motivo;
    descripcion;
}
exports.MovimientoSimpleDto = MovimientoSimpleDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MovimientoSimpleDto.prototype, "id_categoria", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], MovimientoSimpleDto.prototype, "monto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MovimientoSimpleDto.prototype, "fecha", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MovimientoSimpleDto.prototype, "motivo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MovimientoSimpleDto.prototype, "descripcion", void 0);
class CrearCategoriaContableDto {
    codigo;
    nombre;
    grupo;
    orden;
    id_cuenta_debito;
    id_cuenta_credito;
}
exports.CrearCategoriaContableDto = CrearCategoriaContableDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], CrearCategoriaContableDto.prototype, "codigo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], CrearCategoriaContableDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CrearCategoriaContableDto.prototype, "grupo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CrearCategoriaContableDto.prototype, "orden", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CrearCategoriaContableDto.prototype, "id_cuenta_debito", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CrearCategoriaContableDto.prototype, "id_cuenta_credito", void 0);
class AsientoManualDto {
    descripcion;
    fecha;
    lineas_json;
}
exports.AsientoManualDto = AsientoManualDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], AsientoManualDto.prototype, "descripcion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AsientoManualDto.prototype, "fecha", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AsientoManualDto.prototype, "lineas_json", void 0);
class ReversarAsientoDto {
    motivo;
}
exports.ReversarAsientoDto = ReversarAsientoDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReversarAsientoDto.prototype, "motivo", void 0);
//# sourceMappingURL=contabilidad.dto.js.map