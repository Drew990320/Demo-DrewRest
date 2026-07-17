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
exports.EnqueueFromPreviewDto = exports.PrintAgentPreviewSourceDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class PrintAgentPreviewSourceDto {
    type;
    label;
    demoTipo;
    idPedido;
    modo;
    detalles;
    idFactura;
    reimpresion;
    idMovimiento;
    fecha;
    precuentaBody;
}
exports.PrintAgentPreviewSourceDto = PrintAgentPreviewSourceDto;
__decorate([
    (0, class_validator_1.IsIn)([
        'demo',
        'comanda',
        'factura',
        'precuenta',
        'pedido_total',
        'movimiento_caja',
        'cierre_caja',
        'base_caja',
        'base_caja_cierre',
        'test',
    ]),
    __metadata("design:type", String)
], PrintAgentPreviewSourceDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], PrintAgentPreviewSourceDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], PrintAgentPreviewSourceDto.prototype, "demoTipo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PrintAgentPreviewSourceDto.prototype, "idPedido", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['ultimo_envio', 'reimpresion', 'completa']),
    __metadata("design:type", String)
], PrintAgentPreviewSourceDto.prototype, "modo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], PrintAgentPreviewSourceDto.prototype, "detalles", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PrintAgentPreviewSourceDto.prototype, "idFactura", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PrintAgentPreviewSourceDto.prototype, "reimpresion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PrintAgentPreviewSourceDto.prototype, "idMovimiento", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], PrintAgentPreviewSourceDto.prototype, "fecha", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PrintAgentPreviewSourceDto.prototype, "precuentaBody", void 0);
class EnqueueFromPreviewDto {
    source;
}
exports.EnqueueFromPreviewDto = EnqueueFromPreviewDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PrintAgentPreviewSourceDto),
    __metadata("design:type", PrintAgentPreviewSourceDto)
], EnqueueFromPreviewDto.prototype, "source", void 0);
//# sourceMappingURL=print-agent-preview.dto.js.map