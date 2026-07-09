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
exports.UpsertConfigVisualDto = void 0;
const class_validator_1 = require("class-validator");
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
class UpsertConfigVisualDto {
    color_primary;
    color_primary_dark;
    color_secondary;
    color_background;
    color_background_alt;
    color_surface;
    color_text;
    color_text_muted;
    color_border;
    iconos_nav;
    iconos_accion;
    estilo_visual;
    mesa_forma;
    mesa_vista;
}
exports.UpsertConfigVisualDto = UpsertConfigVisualDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v != null && v !== ''),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(HEX_COLOR, { message: 'color_primary debe ser #RRGGBB' }),
    __metadata("design:type", Object)
], UpsertConfigVisualDto.prototype, "color_primary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v != null && v !== ''),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(HEX_COLOR),
    __metadata("design:type", Object)
], UpsertConfigVisualDto.prototype, "color_primary_dark", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v != null && v !== ''),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(HEX_COLOR),
    __metadata("design:type", Object)
], UpsertConfigVisualDto.prototype, "color_secondary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v != null && v !== ''),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(HEX_COLOR),
    __metadata("design:type", Object)
], UpsertConfigVisualDto.prototype, "color_background", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v != null && v !== ''),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(HEX_COLOR),
    __metadata("design:type", Object)
], UpsertConfigVisualDto.prototype, "color_background_alt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v != null && v !== ''),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(HEX_COLOR),
    __metadata("design:type", Object)
], UpsertConfigVisualDto.prototype, "color_surface", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v != null && v !== ''),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(HEX_COLOR),
    __metadata("design:type", Object)
], UpsertConfigVisualDto.prototype, "color_text", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v != null && v !== ''),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(HEX_COLOR),
    __metadata("design:type", Object)
], UpsertConfigVisualDto.prototype, "color_text_muted", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v != null && v !== ''),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(HEX_COLOR),
    __metadata("design:type", Object)
], UpsertConfigVisualDto.prototype, "color_border", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpsertConfigVisualDto.prototype, "iconos_nav", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpsertConfigVisualDto.prototype, "iconos_accion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v != null && v !== ''),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpsertConfigVisualDto.prototype, "estilo_visual", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v != null && v !== ''),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpsertConfigVisualDto.prototype, "mesa_forma", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v != null && v !== ''),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpsertConfigVisualDto.prototype, "mesa_vista", void 0);
//# sourceMappingURL=upsert-config-visual.dto.js.map