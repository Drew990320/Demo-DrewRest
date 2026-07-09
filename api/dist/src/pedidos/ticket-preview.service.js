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
exports.TicketPreviewService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const comanda_escpos_builder_1 = require("./comanda-escpos.builder");
const factura_escpos_builder_1 = require("./factura-escpos.builder");
const escpos_buffer_decode_1 = require("./escpos-buffer-decode");
const ticket_preview_pdf_1 = require("./ticket-preview-pdf");
const ticket_preview_html_builder_1 = require("./ticket-preview-html.builder");
const ticket_preview_samples_1 = require("./ticket-preview.samples");
const pedidos_service_1 = require("./pedidos.service");
const ticket_preview_util_1 = require("./ticket-preview.util");
function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Tiempo agotado generando PDF')), ms);
        }),
    ]);
}
let TicketPreviewService = class TicketPreviewService {
    config;
    pedidos;
    constructor(config, pedidos) {
        this.config = config;
        this.pedidos = pedidos;
    }
    isEnabled() {
        return (0, ticket_preview_util_1.ticketPreviewEnabled)(this.config);
    }
    assertEnabled() {
        if (!this.isEnabled()) {
            throw new common_1.ServiceUnavailableException('Vista previa de tickets no disponible en este servidor');
        }
    }
    charWidth() {
        return (0, ticket_preview_util_1.ticketPreviewCharWidth)(this.config);
    }
    catalog() {
        return ticket_preview_samples_1.TICKET_PREVIEW_CATALOG;
    }
    bufferToHtml(buffer, subtitle) {
        const segments = (0, escpos_buffer_decode_1.decodeEscPosBuffer)(buffer, this.charWidth());
        return (0, ticket_preview_html_builder_1.segmentsToTicketPreviewHtml)(segments, { subtitle });
    }
    async bufferToPdf(buffer, subtitle) {
        return withTimeout((0, ticket_preview_pdf_1.escposBufferToPdf)(buffer, {
            subtitle,
            logoPng: null,
            charWidth: this.charWidth(),
        }), 12_000);
    }
    async demoHtml(tipo) {
        this.assertEnabled();
        const item = (0, ticket_preview_samples_1.catalogItemForTipo)(tipo);
        if (!item) {
            throw new common_1.NotFoundException(`Tipo de ticket no válido: ${tipo}`);
        }
        const buffer = await (0, ticket_preview_samples_1.buildSampleEscPosBuffer)(tipo, this.charWidth());
        return this.bufferToHtml(buffer, `${item.label} · demo 58 mm`);
    }
    async demoPdf(tipo) {
        this.assertEnabled();
        const item = (0, ticket_preview_samples_1.catalogItemForTipo)(tipo);
        if (!item) {
            throw new common_1.NotFoundException(`Tipo de ticket no válido: ${tipo}`);
        }
        const buffer = await (0, ticket_preview_samples_1.buildSampleEscPosBuffer)(tipo, this.charWidth());
        return this.bufferToPdf(buffer, `${item.label} · demo 58 mm`);
    }
    async pedidoComandaHtml(idPedido) {
        this.assertEnabled();
        const ticket = await this.pedidos.ticketComandaParaVistaPrevia(idPedido);
        const buffer = await (0, comanda_escpos_builder_1.buildComandaEscPos)(ticket, this.charWidth());
        return this.bufferToHtml(buffer, `Comanda pedido #${idPedido} · vista previa 58 mm`);
    }
    async pedidoComandaPdf(idPedido) {
        this.assertEnabled();
        const ticket = await this.pedidos.ticketComandaParaVistaPrevia(idPedido);
        const buffer = await (0, comanda_escpos_builder_1.buildComandaEscPos)(ticket, this.charWidth());
        return this.bufferToPdf(buffer, `Comanda pedido #${idPedido} · vista previa 58 mm`);
    }
    async facturaHtml(idFactura) {
        this.assertEnabled();
        const ticket = await this.pedidos.ticketFacturaParaVistaPrevia(idFactura);
        const buffer = await (0, factura_escpos_builder_1.buildFacturaEscPos)(ticket, this.charWidth());
        return this.bufferToHtml(buffer, `Factura #${idFactura} · vista previa 58 mm`);
    }
    async facturaPdf(idFactura) {
        this.assertEnabled();
        const ticket = await this.pedidos.ticketFacturaParaVistaPrevia(idFactura);
        const buffer = await (0, factura_escpos_builder_1.buildFacturaEscPos)(ticket, this.charWidth());
        return this.bufferToPdf(buffer, `Factura #${idFactura} · vista previa 58 mm`);
    }
};
exports.TicketPreviewService = TicketPreviewService;
exports.TicketPreviewService = TicketPreviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        pedidos_service_1.PedidosService])
], TicketPreviewService);
//# sourceMappingURL=ticket-preview.service.js.map