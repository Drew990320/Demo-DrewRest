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
var FacturaEmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacturaEmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mail_service_1 = require("../mail/mail.service");
const restaurant_branding_1 = require("../common/restaurant-branding");
const factura_email_builder_1 = require("./factura-email.builder");
let FacturaEmailService = FacturaEmailService_1 = class FacturaEmailService {
    config;
    mail;
    logger = new common_1.Logger(FacturaEmailService_1.name);
    constructor(config, mail) {
        this.config = config;
        this.mail = mail;
    }
    estaConfigurado() {
        const enabled = this.config.get('FACTURA_EMAIL_ENABLED');
        if (enabled === 'false' || enabled === '0')
            return false;
        return this.mail.estaConfigurado();
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
        const prefijo = (0, restaurant_branding_1.restaurantPrefijoAsuntoCorreo)() || (0, restaurant_branding_1.restaurantName)();
        const idRef = ticket.id_factura ?? ticket.id_pedido;
        const subject = `${prefijo} · Factura #${idRef} · ${ticket.mesa_etiqueta}`;
        const result = await this.mail.enviar({
            to: email,
            subject,
            text: (0, factura_email_builder_1.buildFacturaEmailText)(ticket),
            html: (0, factura_email_builder_1.buildFacturaEmailHtml)(ticket),
        });
        if (result.enviado) {
            this.logger.log(`Factura enviada a ${email} (pedido ${ticket.id_pedido}, factura ${ticket.id_factura ?? '—'})`);
        }
        return result;
    }
};
exports.FacturaEmailService = FacturaEmailService;
exports.FacturaEmailService = FacturaEmailService = FacturaEmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mail_service_1.MailService])
], FacturaEmailService);
//# sourceMappingURL=factura-email.service.js.map