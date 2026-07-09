"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentTenantId = void 0;
const common_1 = require("@nestjs/common");
const tenant_constants_1 = require("./tenant.constants");
exports.CurrentTenantId = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user?.idRestaurante ?? tenant_constants_1.DEFAULT_TENANT_ID;
});
//# sourceMappingURL=current-tenant.decorator.js.map