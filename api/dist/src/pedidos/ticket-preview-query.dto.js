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
exports.TicketFechaPreviewQueryDto = exports.TicketFacturaPreviewQueryDto = exports.TicketComandaPreviewQueryDto = void 0;
const class_validator_1 = require("class-validator");
class TicketComandaPreviewQueryDto {
    modo;
    detalles;
}
exports.TicketComandaPreviewQueryDto = TicketComandaPreviewQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['ultimo_envio', 'reimpresion', 'completa']),
    __metadata("design:type", String)
], TicketComandaPreviewQueryDto.prototype, "modo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TicketComandaPreviewQueryDto.prototype, "detalles", void 0);
class TicketFacturaPreviewQueryDto {
    reimpresion;
}
exports.TicketFacturaPreviewQueryDto = TicketFacturaPreviewQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['0', '1', 'true', 'false']),
    __metadata("design:type", String)
], TicketFacturaPreviewQueryDto.prototype, "reimpresion", void 0);
class TicketFechaPreviewQueryDto {
    fecha;
}
exports.TicketFechaPreviewQueryDto = TicketFechaPreviewQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TicketFechaPreviewQueryDto.prototype, "fecha", void 0);
//# sourceMappingURL=ticket-preview-query.dto.js.map