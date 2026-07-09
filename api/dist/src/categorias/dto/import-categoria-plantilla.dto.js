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
exports.ImportCategoriaPlantillaDto = exports.CategoriaPlantillaItemDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CategoriaPlantillaItemDto {
    nombre;
    icono_menu;
    activo;
    disponible_lunes;
    disponible_martes;
    disponible_miercoles;
    disponible_jueves;
    disponible_viernes;
    disponible_sabado;
    disponible_domingo;
    es_bebida;
    cobra_empaque_para_llevar;
    participa_descuento_sopas;
    es_linea_empaque;
    visible_en_mostrador;
    tipo_linea_cocina_default;
    es_plato_principal_default;
    prioridad_cocina_baja;
}
exports.CategoriaPlantillaItemDto = CategoriaPlantillaItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CategoriaPlantillaItemDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", Object)
], CategoriaPlantillaItemDto.prototype, "icono_menu", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CategoriaPlantillaItemDto.prototype, "activo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CategoriaPlantillaItemDto.prototype, "disponible_lunes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CategoriaPlantillaItemDto.prototype, "disponible_martes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CategoriaPlantillaItemDto.prototype, "disponible_miercoles", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CategoriaPlantillaItemDto.prototype, "disponible_jueves", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CategoriaPlantillaItemDto.prototype, "disponible_viernes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CategoriaPlantillaItemDto.prototype, "disponible_sabado", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CategoriaPlantillaItemDto.prototype, "disponible_domingo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CategoriaPlantillaItemDto.prototype, "es_bebida", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CategoriaPlantillaItemDto.prototype, "cobra_empaque_para_llevar", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CategoriaPlantillaItemDto.prototype, "participa_descuento_sopas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CategoriaPlantillaItemDto.prototype, "es_linea_empaque", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CategoriaPlantillaItemDto.prototype, "visible_en_mostrador", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CategoriaPlantillaItemDto.prototype, "tipo_linea_cocina_default", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CategoriaPlantillaItemDto.prototype, "es_plato_principal_default", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CategoriaPlantillaItemDto.prototype, "prioridad_cocina_baja", void 0);
class ImportCategoriaPlantillaDto {
    modo;
    categorias;
}
exports.ImportCategoriaPlantillaDto = ImportCategoriaPlantillaDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['merge', 'skip_existing']),
    __metadata("design:type", String)
], ImportCategoriaPlantillaDto.prototype, "modo", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CategoriaPlantillaItemDto),
    __metadata("design:type", Array)
], ImportCategoriaPlantillaDto.prototype, "categorias", void 0);
//# sourceMappingURL=import-categoria-plantilla.dto.js.map