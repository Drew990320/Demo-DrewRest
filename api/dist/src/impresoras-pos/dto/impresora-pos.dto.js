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
exports.ReplaceReglasCocinaDto = exports.ReglaImpresionCocinaDto = exports.UpdateImpresoraPosDto = exports.CreateImpresoraPosDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const impresoras_pos_types_1 = require("../impresoras-pos.types");
class CreateImpresoraPosDto {
    nombre;
    destino;
    activa;
    orden;
    baud_rate;
    roles;
    es_cocina_maestra;
}
exports.CreateImpresoraPosDto = CreateImpresoraPosDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateImpresoraPosDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateImpresoraPosDto.prototype, "destino", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateImpresoraPosDto.prototype, "activa", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateImpresoraPosDto.prototype, "orden", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1200),
    __metadata("design:type", Object)
], CreateImpresoraPosDto.prototype, "baud_rate", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsIn)([...impresoras_pos_types_1.ROLES_IMPRESORA_POS], { each: true }),
    __metadata("design:type", Array)
], CreateImpresoraPosDto.prototype, "roles", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateImpresoraPosDto.prototype, "es_cocina_maestra", void 0);
class UpdateImpresoraPosDto {
    nombre;
    destino;
    activa;
    orden;
    baud_rate;
    roles;
    es_cocina_maestra;
}
exports.UpdateImpresoraPosDto = UpdateImpresoraPosDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateImpresoraPosDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateImpresoraPosDto.prototype, "destino", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateImpresoraPosDto.prototype, "activa", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateImpresoraPosDto.prototype, "orden", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1200),
    __metadata("design:type", Object)
], UpdateImpresoraPosDto.prototype, "baud_rate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsIn)([...impresoras_pos_types_1.ROLES_IMPRESORA_POS], { each: true }),
    __metadata("design:type", Array)
], UpdateImpresoraPosDto.prototype, "roles", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateImpresoraPosDto.prototype, "es_cocina_maestra", void 0);
class ReglaImpresionCocinaDto {
    alcance;
    id_categoria;
    id_producto;
    orden;
}
exports.ReglaImpresionCocinaDto = ReglaImpresionCocinaDto;
__decorate([
    (0, class_validator_1.IsIn)(['categoria', 'producto']),
    __metadata("design:type", String)
], ReglaImpresionCocinaDto.prototype, "alcance", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Object)
], ReglaImpresionCocinaDto.prototype, "id_categoria", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Object)
], ReglaImpresionCocinaDto.prototype, "id_producto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ReglaImpresionCocinaDto.prototype, "orden", void 0);
class ReplaceReglasCocinaDto {
    reglas;
}
exports.ReplaceReglasCocinaDto = ReplaceReglasCocinaDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ReglaImpresionCocinaDto),
    __metadata("design:type", Array)
], ReplaceReglasCocinaDto.prototype, "reglas", void 0);
//# sourceMappingURL=impresora-pos.dto.js.map