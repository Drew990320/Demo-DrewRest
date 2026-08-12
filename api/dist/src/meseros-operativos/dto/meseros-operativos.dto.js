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
exports.AsignarDelegacionCierreDto = exports.AplicarBeneficiosTurnoTodosDto = exports.AplicarBeneficioTurnoMeseroDto = exports.AplicarBeneficioTurnoDto = exports.UpdateBeneficioTurnoDto = exports.UpsertBeneficioTurnoDto = exports.RepartirPagoTurnoMeserosDto = exports.UpsertPagoTurnoMeseroDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class UpsertPagoTurnoMeseroDto {
    fecha;
    id_usuario;
    monto;
    notas;
}
exports.UpsertPagoTurnoMeseroDto = UpsertPagoTurnoMeseroDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertPagoTurnoMeseroDto.prototype, "fecha", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpsertPagoTurnoMeseroDto.prototype, "id_usuario", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpsertPagoTurnoMeseroDto.prototype, "monto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpsertPagoTurnoMeseroDto.prototype, "notas", void 0);
class RepartirPagoTurnoMeserosDto {
    fecha;
    monto_total;
    ids_usuarios;
    notas;
}
exports.RepartirPagoTurnoMeserosDto = RepartirPagoTurnoMeserosDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RepartirPagoTurnoMeserosDto.prototype, "fecha", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RepartirPagoTurnoMeserosDto.prototype, "monto_total", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ each: true }),
    __metadata("design:type", Array)
], RepartirPagoTurnoMeserosDto.prototype, "ids_usuarios", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], RepartirPagoTurnoMeserosDto.prototype, "notas", void 0);
class UpsertBeneficioTurnoDto {
    id_producto;
    monto_descuento;
    descontar_stock;
    activo;
    orden;
}
exports.UpsertBeneficioTurnoDto = UpsertBeneficioTurnoDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpsertBeneficioTurnoDto.prototype, "id_producto", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpsertBeneficioTurnoDto.prototype, "monto_descuento", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpsertBeneficioTurnoDto.prototype, "descontar_stock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpsertBeneficioTurnoDto.prototype, "activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpsertBeneficioTurnoDto.prototype, "orden", void 0);
class UpdateBeneficioTurnoDto {
    monto_descuento;
    descontar_stock;
    activo;
    orden;
}
exports.UpdateBeneficioTurnoDto = UpdateBeneficioTurnoDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateBeneficioTurnoDto.prototype, "monto_descuento", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateBeneficioTurnoDto.prototype, "descontar_stock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateBeneficioTurnoDto.prototype, "activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateBeneficioTurnoDto.prototype, "orden", void 0);
class AplicarBeneficioTurnoDto {
    fecha;
    id_beneficio_turno;
}
exports.AplicarBeneficioTurnoDto = AplicarBeneficioTurnoDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AplicarBeneficioTurnoDto.prototype, "fecha", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AplicarBeneficioTurnoDto.prototype, "id_beneficio_turno", void 0);
class AplicarBeneficioTurnoMeseroDto extends AplicarBeneficioTurnoDto {
    id_usuario;
}
exports.AplicarBeneficioTurnoMeseroDto = AplicarBeneficioTurnoMeseroDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AplicarBeneficioTurnoMeseroDto.prototype, "id_usuario", void 0);
class AplicarBeneficiosTurnoTodosDto {
    fecha;
    ids_beneficio_turno;
}
exports.AplicarBeneficiosTurnoTodosDto = AplicarBeneficiosTurnoTodosDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AplicarBeneficiosTurnoTodosDto.prototype, "fecha", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ each: true }),
    __metadata("design:type", Array)
], AplicarBeneficiosTurnoTodosDto.prototype, "ids_beneficio_turno", void 0);
class AsignarDelegacionCierreDto {
    fecha;
    id_usuario;
}
exports.AsignarDelegacionCierreDto = AsignarDelegacionCierreDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AsignarDelegacionCierreDto.prototype, "fecha", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Object)
], AsignarDelegacionCierreDto.prototype, "id_usuario", void 0);
//# sourceMappingURL=meseros-operativos.dto.js.map