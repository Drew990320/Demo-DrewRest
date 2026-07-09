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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var FacturaEmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacturaEmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer_1 = __importDefault(require("nodemailer"));
const restaurant_branding_1 = require("../common/restaurant-branding");
const factura_email_builder_1 = require("./factura-email.builder");
let FacturaEmailService = FacturaEmailService_1 = class FacturaEmailService {
    config;
    logger = new common_1.Logger(FacturaEmailService_1.name);
    constructor(config) {
        this.config = config;
    }
    estaConfigurado() {
        const host = this.config.get('SMTP_HOST')?.trim();
        const from = this.config.get('SMTP_FROM')?.trim();
        const enabled = this.config.get('FACTURA_EMAIL_ENABLED');
        if (enabled === 'false' || enabled === '0')
            return false;
        return Boolean(host && from);
    }
    crearTransporter() {
        if (!this.estaConfigurado())
            return null;
        const host = this.config.get('SMTP_HOST').trim();
        const port = Number(this.config.get('SMTP_PORT') ?? 587);
        const secure = this.config.get('SMTP_SECURE') === 'true' ||
            this.config.get('SMTP_SECURE') === '1' ||
            port === 465;
        const user = this.config.get('SMTP_USER')?.trim();
        const pass = this.config.get('SMTP_PASS')?.trim();
        return nodemailer_1.default.createTransport({
            host,
            port: Number.isFinite(port) ? port : 587,
            secure,
            auth: user && pass ? { user, pass } : undefined,
            connectionTimeout: 12_000,
            greetingTimeout: 12_000,
            socketTimeout: 20_000,
        });
    }
    async enviarFactura(ticket, emailDestino) {
        const email = emailDestino.trim().toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { enviado: false, email, error: 'Correo del cliente no válido' };
        }
        if (!this.estaConfigurado()) {
            return {
                enviado: false,
                email,
                error: 'El envío por correo no está configurado en el servidor (SMTP_HOST / SMTP_FROM).',
            };
        }
        if (!(0, restaurant_branding_1.restaurantModuloEnvioCorreoActivo)()) {
            return {
                enviado: false,
                email,
                error: 'El envío de factura por correo está desactivado en configuración.',
            };
        }
        const transporter = this.crearTransporter();
        if (!transporter) {
            return {
                enviado: false,
                email,
                error: 'No se pudo inicializar el envío de correo.',
            };
        }
        const from = this.config.get('SMTP_FROM')?.trim() ||
            `${(0, restaurant_branding_1.restaurantName)()} <noreply${(0, restaurant_branding_1.restaurantEmailSuffix)()}>`;
        const prefijo = (0, restaurant_branding_1.restaurantPrefijoAsuntoCorreo)() || (0, restaurant_branding_1.restaurantName)();
        const idRef = ticket.id_factura ?? ticket.id_pedido;
        const subject = `${prefijo} · Factura #${idRef} · ${ticket.mesa_etiqueta}`;
        try {
            await transporter.sendMail({
                from,
                to: email,
                subject,
                text: (0, factura_email_builder_1.buildFacturaEmailText)(ticket),
                html: (0, factura_email_builder_1.buildFacturaEmailHtml)(ticket),
            });
            this.logger.log(`Factura enviada a ${email} (pedido ${ticket.id_pedido}, factura ${ticket.id_factura ?? '—'})`);
            return { enviado: true, email };
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : 'Error desconocido al enviar correo';
            this.logger.warn(`Fallo envío factura a ${email}: ${msg}`);
            const sinRed = /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ECONNRESET|network|getaddrinfo/i.test(msg);
            return {
                enviado: false,
                email,
                error: sinRed
                    ? 'No hay conexión a internet o el servidor de correo no responde.'
                    : `No se pudo enviar el correo: ${msg}`,
            };
        }
    }
};
exports.FacturaEmailService = FacturaEmailService;
exports.FacturaEmailService = FacturaEmailService = FacturaEmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FacturaEmailService);
//# sourceMappingURL=factura-email.service.js.map