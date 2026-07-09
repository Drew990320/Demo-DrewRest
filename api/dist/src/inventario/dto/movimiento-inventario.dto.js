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
exports.MovimientoInventarioDto = void 0;
const class_validator_1 = require("class-validator");
class MovimientoInventarioDto {
    tipo_mov;
    cantidad;
    observacion;
}
exports.MovimientoInventarioDto = MovimientoInventarioDto;
__decorate([
    (0, class_validator_1.IsIn)(['entrada', 'consumo', 'ajuste']),
    __metadata("design:type", String)
], MovimientoInventarioDto.prototype, "tipo_mov", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MovimientoInventarioDto.prototype, "cantidad", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MovimientoInventarioDto.prototype, "observacion", void 0);
//# sourceMappingURL=movimiento-inventario.dto.js.map