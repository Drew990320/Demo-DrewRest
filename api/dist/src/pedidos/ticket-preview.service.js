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
const cierre_caja_escpos_builder_1 = require("./cierre-caja-escpos.builder");
const comanda_escpos_builder_1 = require("./comanda-escpos.builder");
const factura_escpos_builder_1 = require("./factura-escpos.builder");
const escpos_buffer_decode_1 = require("./escpos-buffer-decode");
const ticket_preview_pdf_1 = require("./ticket-preview-pdf");
const ticket_preview_html_builder_1 = require("./ticket-preview-html.builder");
const ticket_preview_samples_1 = require("./ticket-preview.samples");
const pedidos_service_1 = require("./pedidos.service");
const ticket_preview_util_1 = require("./ticket-preview.util");
const escpos_utils_1 = require("./escpos-utils");
function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Tiempo agotado generando PDF')), ms);
        }),
    ]);
}
function parseIdDetalles(raw) {
    if (!raw?.trim())
        return undefined;
    const ids = raw
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
    return ids.length > 0 ? ids : undefined;
}
function parseReimpresion(raw) {
    return raw === '1' || raw === 'true';
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
    charWidth(anchoMm) {
        if (anchoMm != null && anchoMm !== '') {
            return (0, ticket_preview_util_1.ticketPreviewCharsForMm)((0, ticket_preview_util_1.ticketPreviewAnchoMm)(this.config, anchoMm));
        }
        return (0, ticket_preview_util_1.ticketPreviewCharWidth)(this.config);
    }
    anchoMm(override) {
        return (0, ticket_preview_util_1.ticketPreviewAnchoMm)(this.config, override);
    }
    async previewLogoPng(charWidth) {
        return (0, escpos_utils_1.ticketLogoPngBufferForPreview)(charWidth);
    }
    logoDataUrlFromPng(logoPng) {
        if (!logoPng?.length)
            return null;
        return `data:image/png;base64,${logoPng.toString('base64')}`;
    }
    async bufferToHtml(buffer, subtitle, anchoMmOverride) {
        const mm = this.anchoMm(anchoMmOverride);
        const chars = this.charWidth(mm);
        const logoPng = await this.previewLogoPng(chars);
        const segments = (0, escpos_buffer_decode_1.decodeEscPosBuffer)(buffer, chars);
        return (0, ticket_preview_html_builder_1.segmentsToTicketPreviewHtml)(segments, {
            subtitle,
            logoDataUrl: this.logoDataUrlFromPng(logoPng),
            anchoMm: mm,
        });
    }
    async bufferToPdf(buffer, subtitle, anchoMmOverride) {
        const mm = this.anchoMm(anchoMmOverride);
        const chars = this.charWidth(mm);
        const logoPng = await this.previewLogoPng(chars);
        return withTimeout((0, ticket_preview_pdf_1.escposBufferToPdf)(buffer, {
            subtitle,
            logoPng,
            charWidth: chars,
            anchoMm: mm,
        }), 12_000);
    }
    catalog() {
        return {
            ancho_mm: this.anchoMm(),
            anchos_mm: [58, 80],
            items: ticket_preview_samples_1.TICKET_PREVIEW_CATALOG,
        };
    }
    async demoHtml(tipo, anchoMm) {
        this.assertEnabled();
        const item = (0, ticket_preview_samples_1.catalogItemForTipo)(tipo);
        if (!item) {
            throw new common_1.NotFoundException(`Tipo de ticket no válido: ${tipo}`);
        }
        const mm = this.anchoMm(anchoMm);
        const buffer = await (0, ticket_preview_samples_1.buildSampleEscPosBuffer)(tipo, this.charWidth(mm));
        return this.bufferToHtml(buffer, `${item.label} · demo ${mm} mm`, mm);
    }
    async demoPdf(tipo, anchoMm) {
        this.assertEnabled();
        const item = (0, ticket_preview_samples_1.catalogItemForTipo)(tipo);
        if (!item) {
            throw new common_1.NotFoundException(`Tipo de ticket no válido: ${tipo}`);
        }
        const mm = this.anchoMm(anchoMm);
        const buffer = await (0, ticket_preview_samples_1.buildSampleEscPosBuffer)(tipo, this.charWidth(mm));
        return this.bufferToPdf(buffer, `${item.label} · demo ${mm} mm`, mm);
    }
    async pedidoComandaHtml(idPedido, opts = {}) {
        this.assertEnabled();
        const ticket = await this.pedidos.ticketComandaParaVistaPrevia(idPedido, {
            modo: opts.modo ?? 'ultimo_envio',
            idDetalles: parseIdDetalles(opts.detalles),
        });
        const buffer = await (0, comanda_escpos_builder_1.buildComandaEscPos)(ticket, this.charWidth());
        const etiqueta = ticket.es_reimpresion
            ? 'Reimpresión comanda'
            : ticket.es_adicional
                ? 'Comanda adicional'
                : 'Comanda';
        return this.bufferToHtml(buffer, `${etiqueta} pedido #${idPedido} · datos reales`);
    }
    async pedidoComandaPdf(idPedido, opts = {}) {
        this.assertEnabled();
        const ticket = await this.pedidos.ticketComandaParaVistaPrevia(idPedido, {
            modo: opts.modo ?? 'ultimo_envio',
            idDetalles: parseIdDetalles(opts.detalles),
        });
        const buffer = await (0, comanda_escpos_builder_1.buildComandaEscPos)(ticket, this.charWidth());
        return this.bufferToPdf(buffer, `Comanda pedido #${idPedido}`);
    }
    async pedidoPrecuentaHtml(idPedido, dto) {
        this.assertEnabled();
        const ticket = await this.pedidos.ticketPrecuentaParaVistaPrevia(idPedido, dto);
        const buffer = await (0, factura_escpos_builder_1.buildFacturaEscPos)(ticket, this.charWidth());
        return this.bufferToHtml(buffer, `Pre-cuenta pedido #${idPedido} · datos reales`);
    }
    async facturaHtml(idFactura, reimpresion = false) {
        this.assertEnabled();
        const ticket = await this.pedidos.ticketFacturaParaVistaPrevia(idFactura, reimpresion);
        const buffer = await (0, factura_escpos_builder_1.buildFacturaEscPos)(ticket, this.charWidth());
        return this.bufferToHtml(buffer, `${reimpresion ? 'Reimpresión factura' : 'Factura'} #${idFactura} · datos reales`);
    }
    async facturaPdf(idFactura, reimpresion = false) {
        this.assertEnabled();
        const ticket = await this.pedidos.ticketFacturaParaVistaPrevia(idFactura, reimpresion);
        const buffer = await (0, factura_escpos_builder_1.buildFacturaEscPos)(ticket, this.charWidth());
        return this.bufferToPdf(buffer, `Factura #${idFactura}`);
    }
    async pedidoTotalHtml(idPedido) {
        this.assertEnabled();
        const ticket = await this.pedidos.ticketPedidoTotalParaVistaPrevia(idPedido);
        const buffer = await (0, factura_escpos_builder_1.buildFacturaEscPos)(ticket, this.charWidth());
        return this.bufferToHtml(buffer, `Total pedido #${idPedido} · datos reales`);
    }
    async movimientoCajaHtml(idMovimiento) {
        this.assertEnabled();
        const ticket = await this.pedidos.ticketMovimientoCajaParaVistaPrevia(idMovimiento);
        const buffer = await (0, cierre_caja_escpos_builder_1.buildMovimientoCajaEscPos)(ticket, this.charWidth());
        return this.bufferToHtml(buffer, `Movimiento caja #${idMovimiento} · datos reales`);
    }
    async cierreCajaHtml(fecha, tenantId) {
        this.assertEnabled();
        const ticket = await this.pedidos.ticketCierreCajaParaVistaPrevia(fecha, tenantId);
        const buffer = await (0, cierre_caja_escpos_builder_1.buildCierreCajaEscPos)(ticket, this.charWidth());
        return this.bufferToHtml(buffer, `Cierre ${ticket.fecha} · datos reales`);
    }
    async baseCajaHtml(fecha, tenantId) {
        this.assertEnabled();
        const ticket = await this.pedidos.ticketBaseCajaParaVistaPrevia(fecha, tenantId);
        const buffer = await (0, cierre_caja_escpos_builder_1.buildBaseCajaEscPos)(ticket, this.charWidth());
        return this.bufferToHtml(buffer, `Base caja ${ticket.fecha} · datos reales`);
    }
    async baseCajaCierreHtml(fecha, tenantId) {
        this.assertEnabled();
        const ticket = await this.pedidos.ticketBaseCajaCierreParaVistaPrevia(fecha, tenantId);
        const buffer = await (0, cierre_caja_escpos_builder_1.buildBaseCajaCierreEscPos)(ticket, this.charWidth());
        return this.bufferToHtml(buffer, `Arqueo cierre ${ticket.fecha} · datos reales`);
    }
    async escposForAgentSource(source, tenantId) {
        this.assertEnabled();
        const w = this.charWidth();
        let buffer;
        let label = source.label?.trim() || 'Ticket demo';
        switch (source.type) {
            case 'demo': {
                const tipo = source.demoTipo?.trim();
                if (!tipo)
                    throw new common_1.NotFoundException('Falta demoTipo');
                const item = (0, ticket_preview_samples_1.catalogItemForTipo)(tipo);
                if (!item)
                    throw new common_1.NotFoundException(`Tipo demo no válido: ${tipo}`);
                buffer = await (0, ticket_preview_samples_1.buildSampleEscPosBuffer)(tipo, w);
                label = source.label?.trim() || item.label;
                break;
            }
            case 'comanda': {
                if (!source.idPedido)
                    throw new common_1.NotFoundException('Falta idPedido');
                const ticket = await this.pedidos.ticketComandaParaVistaPrevia(source.idPedido, {
                    modo: source.modo ?? 'ultimo_envio',
                    idDetalles: parseIdDetalles(source.detalles),
                });
                buffer = await (0, comanda_escpos_builder_1.buildComandaEscPos)(ticket, w);
                label =
                    source.label?.trim() ||
                        (ticket.es_reimpresion
                            ? `Reimpresión comanda #${source.idPedido}`
                            : ticket.es_adicional
                                ? `Comanda adicional #${source.idPedido}`
                                : `Comanda #${source.idPedido}`);
                break;
            }
            case 'factura': {
                if (!source.idFactura)
                    throw new common_1.NotFoundException('Falta idFactura');
                const ticket = await this.pedidos.ticketFacturaParaVistaPrevia(source.idFactura, Boolean(source.reimpresion));
                buffer = await (0, factura_escpos_builder_1.buildFacturaEscPos)(ticket, w);
                label =
                    source.label?.trim() ||
                        (source.reimpresion
                            ? `Reimpresión factura #${source.idFactura}`
                            : `Factura #${source.idFactura}`);
                break;
            }
            case 'precuenta': {
                if (!source.idPedido)
                    throw new common_1.NotFoundException('Falta idPedido');
                const dto = (source.precuentaBody ?? {});
                const ticket = await this.pedidos.ticketPrecuentaParaVistaPrevia(source.idPedido, dto);
                buffer = await (0, factura_escpos_builder_1.buildFacturaEscPos)(ticket, w);
                label = source.label?.trim() || `Pre-cuenta #${source.idPedido}`;
                break;
            }
            case 'pedido_total': {
                if (!source.idPedido)
                    throw new common_1.NotFoundException('Falta idPedido');
                const ticket = await this.pedidos.ticketPedidoTotalParaVistaPrevia(source.idPedido);
                buffer = await (0, factura_escpos_builder_1.buildFacturaEscPos)(ticket, w);
                label = source.label?.trim() || `Total pedido #${source.idPedido}`;
                break;
            }
            case 'movimiento_caja': {
                if (!source.idMovimiento) {
                    throw new common_1.NotFoundException('Falta idMovimiento');
                }
                const ticket = await this.pedidos.ticketMovimientoCajaParaVistaPrevia(source.idMovimiento);
                buffer = await (0, cierre_caja_escpos_builder_1.buildMovimientoCajaEscPos)(ticket, w);
                label =
                    source.label?.trim() || `Movimiento caja #${source.idMovimiento}`;
                break;
            }
            case 'cierre_caja': {
                const ticket = await this.pedidos.ticketCierreCajaParaVistaPrevia(source.fecha, tenantId);
                buffer = await (0, cierre_caja_escpos_builder_1.buildCierreCajaEscPos)(ticket, w);
                label = source.label?.trim() || `Cierre ${ticket.fecha}`;
                break;
            }
            case 'base_caja': {
                const ticket = await this.pedidos.ticketBaseCajaParaVistaPrevia(source.fecha, tenantId);
                buffer = await (0, cierre_caja_escpos_builder_1.buildBaseCajaEscPos)(ticket, w);
                label = source.label?.trim() || `Base caja ${ticket.fecha}`;
                break;
            }
            case 'base_caja_cierre': {
                const ticket = await this.pedidos.ticketBaseCajaCierreParaVistaPrevia(source.fecha, tenantId);
                buffer = await (0, cierre_caja_escpos_builder_1.buildBaseCajaCierreEscPos)(ticket, w);
                label = source.label?.trim() || `Arqueo ${ticket.fecha}`;
                break;
            }
            case 'test':
            default: {
                const lines = [
                    '================================',
                    '         DREWREST',
                    '   Ticket desde la nube',
                    '================================',
                    `Fecha: ${new Date().toLocaleString('es-CO')}`,
                    '--------------------------------',
                    'Demo cloud -> agente local -> POS',
                    'Si lees esto, el puente funciona.',
                    '--------------------------------',
                    'DrewTech',
                    '================================',
                    '',
                    '',
                ];
                const body = Buffer.from(lines.join('\n'), 'latin1');
                buffer = Buffer.concat([
                    Buffer.from([0x1b, 0x40]),
                    body,
                    Buffer.from([0x1d, 0x56, 0x00]),
                ]);
                label = source.label?.trim() || 'Prueba puente POS';
                break;
            }
        }
        return { label, escposBase64: buffer.toString('base64') };
    }
};
exports.TicketPreviewService = TicketPreviewService;
exports.TicketPreviewService = TicketPreviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        pedidos_service_1.PedidosService])
], TicketPreviewService);
//# sourceMappingURL=ticket-preview.service.js.map