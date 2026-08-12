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
exports.PasswordResetConfirmDto = void 0;
const class_validator_1 = require("class-validator");
class PasswordResetConfirmDto {
    email;
    code;
    password;
    tenant_slug;
}
exports.PasswordResetConfirmDto = PasswordResetConfirmDto;
__decorate([
    (0, class_validator_1.IsEmail)({ require_tld: true }, { message: 'Indica un correo válido' }),
    __metadata("design:type", String)
], PasswordResetConfirmDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{6}$/, { message: 'El código debe tener 6 dígitos' }),
    __metadata("design:type", String)
], PasswordResetConfirmDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], PasswordResetConfirmDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], PasswordResetConfirmDto.prototype, "tenant_slug", void 0);
//# sourceMappingURL=password-reset-confirm.dto.js.map