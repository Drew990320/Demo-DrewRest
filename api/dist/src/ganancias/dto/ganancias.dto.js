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
exports.PatchProductoCostoDto = exports.PatchGastoExtraDto = exports.UpsertGastoExtraDto = exports.RegistrarPagoFondoDto = exports.CuotaDiaGastoDto = exports.CuotaDiaFechaDto = exports.PatchGastoFijoDto = exports.UpsertGastoFijoDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class UpsertGastoFijoDto {
    nombre;
    monto_mensual;
    activo;
    notas;
    usa_fondo_diario;
    cuota_diaria;
    modo_registro_fondo;
}
exports.UpsertGastoFijoDto = UpsertGastoFijoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpsertGastoFijoDto.prototype, "nombre", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpsertGastoFijoDto.prototype, "monto_mensual", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpsertGastoFijoDto.prototype, "activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", Object)
], UpsertGastoFijoDto.prototype, "notas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpsertGastoFijoDto.prototype, "usa_fondo_diario", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Object)
], UpsertGastoFijoDto.prototype, "cuota_diaria", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['automatico', 'confirmar']),
    __metadata("design:type", String)
], UpsertGastoFijoDto.prototype, "modo_registro_fondo", void 0);
class PatchGastoFijoDto {
    nombre;
    monto_mensual;
    activo;
    notas;
    usa_fondo_diario;
    cuota_diaria;
    modo_registro_fondo;
}
exports.PatchGastoFijoDto = PatchGastoFijoDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], PatchGastoFijoDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PatchGastoFijoDto.prototype, "monto_mensual", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchGastoFijoDto.prototype, "activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", Object)
], PatchGastoFijoDto.prototype, "notas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchGastoFijoDto.prototype, "usa_fondo_diario", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Object)
], PatchGastoFijoDto.prototype, "cuota_diaria", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['automatico', 'confirmar']),
    __metadata("design:type", String)
], PatchGastoFijoDto.prototype, "modo_registro_fondo", void 0);
class CuotaDiaFechaDto {
    fecha;
}
exports.CuotaDiaFechaDto = CuotaDiaFechaDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CuotaDiaFechaDto.prototype, "fecha", void 0);
class CuotaDiaGastoDto {
    id_gasto_fijo;
    fecha;
}
exports.CuotaDiaGastoDto = CuotaDiaGastoDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CuotaDiaGastoDto.prototype, "id_gasto_fijo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CuotaDiaGastoDto.prototype, "fecha", void 0);
class RegistrarPagoFondoDto {
    id_gasto_fijo;
    monto;
    fecha;
    notas;
}
exports.RegistrarPagoFondoDto = RegistrarPagoFondoDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RegistrarPagoFondoDto.prototype, "id_gasto_fijo", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RegistrarPagoFondoDto.prototype, "monto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegistrarPagoFondoDto.prototype, "fecha", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", Object)
], RegistrarPagoFondoDto.prototype, "notas", void 0);
class UpsertGastoExtraDto {
    nombre;
    monto;
    fecha;
    notas;
}
exports.UpsertGastoExtraDto = UpsertGastoExtraDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpsertGastoExtraDto.prototype, "nombre", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpsertGastoExtraDto.prototype, "monto", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], UpsertGastoExtraDto.prototype, "fecha", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", Object)
], UpsertGastoExtraDto.prototype, "notas", void 0);
class PatchGastoExtraDto {
    nombre;
    monto;
    fecha;
    notas;
}
exports.PatchGastoExtraDto = PatchGastoExtraDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], PatchGastoExtraDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PatchGastoExtraDto.prototype, "monto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], PatchGastoExtraDto.prototype, "fecha", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", Object)
], PatchGastoExtraDto.prototype, "notas", void 0);
class PatchProductoCostoDto {
    precio_costo;
}
exports.PatchProductoCostoDto = PatchProductoCostoDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Object)
], PatchProductoCostoDto.prototype, "precio_costo", void 0);
//# sourceMappingURL=ganancias.dto.js.map