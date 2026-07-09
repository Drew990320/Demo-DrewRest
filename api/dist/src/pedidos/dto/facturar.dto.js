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
exports.FacturarDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const detalle_cobro_dto_1 = require("./detalle-cobro.dto");
class FacturarDto {
    metodo_pago;
    nombre_cliente_fiado;
    telefono_cliente_fiado;
    notas_fiado;
    imprimir_factura;
    factura_con_copia;
    id_detalles;
    detalles_cobro;
    persona_plan_indice;
    total_personas_plan;
    plan_personas_sobre_total;
    plan_combinado_sobre_seleccion;
    detalles_seleccion_referencia;
    monto_persona_plan;
    cobro_mixto_grupo;
    monto_transferencia;
    monto_recibido_efectivo;
    devolucion_exceso_metodo;
}
exports.FacturarDto = FacturarDto;
__decorate([
    (0, class_validator_1.IsIn)(['efectivo', 'transferencia', 'fiado']),
    __metadata("design:type", String)
], FacturarDto.prototype, "metodo_pago", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], FacturarDto.prototype, "nombre_cliente_fiado", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FacturarDto.prototype, "telefono_cliente_fiado", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FacturarDto.prototype, "notas_fiado", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FacturarDto.prototype, "imprimir_factura", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FacturarDto.prototype, "factura_con_copia", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInt)({ each: true }),
    __metadata("design:type", Array)
], FacturarDto.prototype, "id_detalles", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => detalle_cobro_dto_1.DetalleCobroDto),
    __metadata("design:type", Array)
], FacturarDto.prototype, "detalles_cobro", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], FacturarDto.prototype, "persona_plan_indice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2),
    __metadata("design:type", Number)
], FacturarDto.prototype, "total_personas_plan", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FacturarDto.prototype, "plan_personas_sobre_total", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FacturarDto.prototype, "plan_combinado_sobre_seleccion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => detalle_cobro_dto_1.DetalleCobroDto),
    __metadata("design:type", Array)
], FacturarDto.prototype, "detalles_seleccion_referencia", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], FacturarDto.prototype, "monto_persona_plan", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(2_147_483_647),
    __metadata("design:type", Number)
], FacturarDto.prototype, "cobro_mixto_grupo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], FacturarDto.prototype, "monto_transferencia", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], FacturarDto.prototype, "monto_recibido_efectivo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['efectivo', 'transferencia', 'domicilio', 'mesero']),
    __metadata("design:type", String)
], FacturarDto.prototype, "devolucion_exceso_metodo", void 0);
//# sourceMappingURL=facturar.dto.js.map