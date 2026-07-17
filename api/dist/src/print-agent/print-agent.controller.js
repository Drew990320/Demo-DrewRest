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
exports.PrintAgentController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const print_agent_preview_dto_1 = require("./print-agent-preview.dto");
const print_agent_service_1 = require("./print-agent.service");
class ClaimDto {
    code;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    (0, class_validator_1.MaxLength)(12),
    __metadata("design:type", String)
], ClaimDto.prototype, "code", void 0);
class HeartbeatDto {
    printerName;
    ready;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], HeartbeatDto.prototype, "printerName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], HeartbeatDto.prototype, "ready", void 0);
class EnqueueDto {
    label;
    text;
    escposBase64;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], EnqueueDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20_000),
    __metadata("design:type", String)
], EnqueueDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200_000),
    __metadata("design:type", String)
], EnqueueDto.prototype, "escposBase64", void 0);
class AckDto {
    ok;
    error;
}
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AckDto.prototype, "ok", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], AckDto.prototype, "error", void 0);
let PrintAgentController = class PrintAgentController {
    agent;
    constructor(agent) {
        this.agent = agent;
    }
    sessionStatus() {
        return this.agent.getSessionStatus();
    }
    createSession(req) {
        return this.agent.createOrRefreshSession(req.user.idUsuario);
    }
    endSession() {
        return this.agent.endSession();
    }
    enqueue(dto) {
        return this.agent.enqueue({
            label: dto.label,
            text: dto.text,
            escposBase64: dto.escposBase64,
        });
    }
    enqueueFromPreview(dto, tenantId) {
        return this.agent.enqueueFromPreview(dto.source, tenantId);
    }
    claim(dto) {
        return this.agent.claim(dto.code);
    }
    heartbeat(token, dto) {
        return this.agent.heartbeat(token ?? '', dto.printerName, dto.ready);
    }
    pullJobs(token) {
        return this.agent.pullJobs(token ?? '');
    }
    ack(token, id, dto) {
        return this.agent.ack(token ?? '', id, dto.ok, dto.error);
    }
};
exports.PrintAgentController = PrintAgentController;
__decorate([
    (0, common_1.Get)('session'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PrintAgentController.prototype, "sessionStatus", null);
__decorate([
    (0, common_1.Post)('session'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PrintAgentController.prototype, "createSession", null);
__decorate([
    (0, common_1.Post)('session/end'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PrintAgentController.prototype, "endSession", null);
__decorate([
    (0, common_1.Post)('jobs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [EnqueueDto]),
    __metadata("design:returntype", void 0)
], PrintAgentController.prototype, "enqueue", null);
__decorate([
    (0, common_1.Post)('jobs/from-preview'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [print_agent_preview_dto_1.EnqueueFromPreviewDto, Object]),
    __metadata("design:returntype", void 0)
], PrintAgentController.prototype, "enqueueFromPreview", null);
__decorate([
    (0, common_1.Post)('agent/claim'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ClaimDto]),
    __metadata("design:returntype", void 0)
], PrintAgentController.prototype, "claim", null);
__decorate([
    (0, common_1.Post)('agent/heartbeat'),
    __param(0, (0, common_1.Headers)('x-print-agent-token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, HeartbeatDto]),
    __metadata("design:returntype", void 0)
], PrintAgentController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Get)('agent/jobs'),
    __param(0, (0, common_1.Headers)('x-print-agent-token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PrintAgentController.prototype, "pullJobs", null);
__decorate([
    (0, common_1.Post)('agent/jobs/:id/ack'),
    __param(0, (0, common_1.Headers)('x-print-agent-token')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, AckDto]),
    __metadata("design:returntype", void 0)
], PrintAgentController.prototype, "ack", null);
exports.PrintAgentController = PrintAgentController = __decorate([
    (0, common_1.Controller)('print-agent'),
    __metadata("design:paramtypes", [print_agent_service_1.PrintAgentService])
], PrintAgentController);
//# sourceMappingURL=print-agent.controller.js.map