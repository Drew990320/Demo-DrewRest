"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalhostGuard = void 0;
const common_1 = require("@nestjs/common");
let LocalhostGuard = class LocalhostGuard {
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const ip = (req.ip || req.socket.remoteAddress || '').replace(/^::ffff:/, '');
        if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
            return true;
        }
        throw new common_1.ForbiddenException('Solo disponible desde el PC del servidor');
    }
};
exports.LocalhostGuard = LocalhostGuard;
exports.LocalhostGuard = LocalhostGuard = __decorate([
    (0, common_1.Injectable)()
], LocalhostGuard);
//# sourceMappingURL=localhost.guard.js.map