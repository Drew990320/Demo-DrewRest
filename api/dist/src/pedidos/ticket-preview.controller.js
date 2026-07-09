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
exports.TicketPreviewController = exports.TicketPreviewEnabledGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const ticket_preview_service_1 = require("./ticket-preview.service");
function sendPdf(res, pdf, filename) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(pdf.length));
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.send(pdf);
}
function sendHtml(res, html) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.send(html);
}
let TicketPreviewEnabledGuard = class TicketPreviewEnabledGuard {
    preview;
    constructor(preview) {
        this.preview = preview;
    }
    canActivate(_ctx) {
        if (!this.preview.isEnabled()) {
            throw new common_1.NotFoundException();
        }
        return true;
    }
};
exports.TicketPreviewEnabledGuard = TicketPreviewEnabledGuard;
exports.TicketPreviewEnabledGuard = TicketPreviewEnabledGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ticket_preview_service_1.TicketPreviewService])
], TicketPreviewEnabledGuard);
let TicketPreviewController = class TicketPreviewController {
    preview;
    constructor(preview) {
        this.preview = preview;
    }
    catalog() {
        return {
            ancho_mm: 58,
            items: this.preview.catalog(),
        };
    }
    async demoHtml(tipo, res) {
        const html = await this.preview.demoHtml(tipo);
        sendHtml(res, html);
    }
    async demo(tipo, res) {
        try {
            const pdf = await this.preview.demoPdf(tipo);
            sendPdf(res, pdf, `drewrest-ticket-${tipo}.pdf`);
        }
        catch (e) {
            if (e instanceof common_1.ServiceUnavailableException)
                throw e;
            if (e instanceof common_1.NotFoundException)
                throw e;
            const html = await this.preview.demoHtml(tipo);
            sendHtml(res, html);
        }
    }
    async pedidoComandaHtml(id, res) {
        const html = await this.preview.pedidoComandaHtml(id);
        sendHtml(res, html);
    }
    async pedidoComanda(id, res) {
        try {
            const pdf = await this.preview.pedidoComandaPdf(id);
            sendPdf(res, pdf, `drewrest-comanda-pedido-${id}.pdf`);
        }
        catch {
            const html = await this.preview.pedidoComandaHtml(id);
            sendHtml(res, html);
        }
    }
    async facturaHtml(id, res) {
        const html = await this.preview.facturaHtml(id);
        sendHtml(res, html);
    }
    async factura(id, res) {
        try {
            const pdf = await this.preview.facturaPdf(id);
            sendPdf(res, pdf, `drewrest-factura-${id}.pdf`);
        }
        catch {
            const html = await this.preview.facturaHtml(id);
            sendHtml(res, html);
        }
    }
};
exports.TicketPreviewController = TicketPreviewController;
__decorate([
    (0, common_1.Get)('catalog'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TicketPreviewController.prototype, "catalog", null);
__decorate([
    (0, common_1.Get)('demo/:tipo/html'),
    __param(0, (0, common_1.Param)('tipo')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TicketPreviewController.prototype, "demoHtml", null);
__decorate([
    (0, common_1.Get)('demo/:tipo'),
    __param(0, (0, common_1.Param)('tipo')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TicketPreviewController.prototype, "demo", null);
__decorate([
    (0, common_1.Get)('pedido/:id/comanda/html'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TicketPreviewController.prototype, "pedidoComandaHtml", null);
__decorate([
    (0, common_1.Get)('pedido/:id/comanda'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TicketPreviewController.prototype, "pedidoComanda", null);
__decorate([
    (0, common_1.Get)('factura/:id/html'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TicketPreviewController.prototype, "facturaHtml", null);
__decorate([
    (0, common_1.Get)('factura/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TicketPreviewController.prototype, "factura", null);
exports.TicketPreviewController = TicketPreviewController = __decorate([
    (0, common_1.Controller)('ticket-preview'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, TicketPreviewEnabledGuard),
    __metadata("design:paramtypes", [ticket_preview_service_1.TicketPreviewService])
], TicketPreviewController);
//# sourceMappingURL=ticket-preview.controller.js.map