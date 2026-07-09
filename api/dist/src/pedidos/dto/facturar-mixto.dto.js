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
exports.FacturarMixtoDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const detalle_cobro_dto_1 = require("./detalle-cobro.dto");
class FacturarMixtoDto {
    monto_transferencia;
    monto_recibido_efectivo;
    imprimir_factura;
    factura_con_copia;
    detalles_cobro;
    persona_plan_indice;
    total_personas_plan;
    plan_personas_sobre_total;
    plan_combinado_sobre_seleccion;
    detalles_seleccion_referencia;
    monto_persona_plan;
    devolucion_exceso_metodo;
}
exports.FacturarMixtoDto = FacturarMixtoDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], FacturarMixtoDto.prototype, "monto_transferencia", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], FacturarMixtoDto.prototype, "monto_recibido_efectivo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FacturarMixtoDto.prototype, "imprimir_factura", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FacturarMixtoDto.prototype, "factura_con_copia", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => detalle_cobro_dto_1.DetalleCobroDto),
    __metadata("design:type", Array)
], FacturarMixtoDto.prototype, "detalles_cobro", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], FacturarMixtoDto.prototype, "persona_plan_indice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2),
    __metadata("design:type", Number)
], FacturarMixtoDto.prototype, "total_personas_plan", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FacturarMixtoDto.prototype, "plan_personas_sobre_total", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FacturarMixtoDto.prototype, "plan_combinado_sobre_seleccion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => detalle_cobro_dto_1.DetalleCobroDto),
    __metadata("design:type", Array)
], FacturarMixtoDto.prototype, "detalles_seleccion_referencia", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], FacturarMixtoDto.prototype, "monto_persona_plan", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['efectivo', 'transferencia', 'domicilio', 'mesero']),
    __metadata("design:type", String)
], FacturarMixtoDto.prototype, "devolucion_exceso_metodo", void 0);
//# sourceMappingURL=facturar-mixto.dto.js.map