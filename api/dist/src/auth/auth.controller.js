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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const setup_superadmin_dto_1 = require("./dto/setup-superadmin.dto");
const verify_password_dto_1 = require("./dto/verify-password.dto");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const roles_guard_1 = require("./roles.guard");
const roles_decorator_1 = require("./roles.decorator");
const usuario_display_1 = require("../usuarios/usuario-display");
let AuthController = class AuthController {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    setupStatus() {
        return this.auth.setupStatus();
    }
    setupSuperadmin(dto) {
        return this.auth.setupSuperadmin(dto);
    }
    login(dto) {
        return this.auth.login(dto);
    }
    me(req) {
        const u = req.user;
        const { nombre, apellido } = (0, usuario_display_1.nombreUsuarioPublico)(u.nombre, u.apellido, u.rol.nombre);
        return {
            id: u.idUsuario,
            nombre,
            apellido,
            email: u.email,
            rol: u.rol.nombre,
        };
    }
    refresh(req) {
        return this.auth.refresh(req.user);
    }
    verifyPassword(dto, req) {
        return this.auth.verifyPassword(req.user, dto.password);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('setup-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "setupStatus", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.Post)('setup-superadmin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [setup_superadmin_dto_1.SetupSuperadminDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "setupSuperadmin", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 12, ttl: 60_000 } }),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('superadmin'),
    (0, common_1.Post)('verify-password'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_password_dto_1.VerifyPasswordDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map