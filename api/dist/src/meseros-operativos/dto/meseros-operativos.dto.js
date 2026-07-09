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
exports.AsignarDelegacionCierreDto = exports.AplicarSodaMeseroDto = exports.AplicarSodaAlmuerzoDto = exports.UpsertPagoTurnoMeseroDto = void 0;
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
class AplicarSodaAlmuerzoDto {
    fecha;
}
exports.AplicarSodaAlmuerzoDto = AplicarSodaAlmuerzoDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AplicarSodaAlmuerzoDto.prototype, "fecha", void 0);
class AplicarSodaMeseroDto extends AplicarSodaAlmuerzoDto {
    id_usuario;
}
exports.AplicarSodaMeseroDto = AplicarSodaMeseroDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AplicarSodaMeseroDto.prototype, "id_usuario", void 0);
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