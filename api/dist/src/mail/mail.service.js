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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer_1 = __importDefault(require("nodemailer"));
const restaurant_branding_1 = require("../common/restaurant-branding");
let MailService = MailService_1 = class MailService {
    config;
    logger = new common_1.Logger(MailService_1.name);
    constructor(config) {
        this.config = config;
    }
    estaConfigurado() {
        const host = this.config.get('SMTP_HOST')?.trim();
        const from = this.config.get('SMTP_FROM')?.trim();
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
    async enviar(opts) {
        const email = opts.to.trim().toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { enviado: false, email, error: 'Correo no válido' };
        }
        if (!this.estaConfigurado()) {
            return {
                enviado: false,
                email,
                error: 'El envío por correo no está configurado en el servidor (SMTP_HOST / SMTP_FROM).',
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
        try {
            await transporter.sendMail({
                from,
                to: email,
                subject: opts.subject,
                text: opts.text,
                html: opts.html,
            });
            this.logger.log(`Correo enviado a ${email}: ${opts.subject}`);
            return { enviado: true, email };
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : 'Error desconocido al enviar correo';
            this.logger.warn(`Fallo envío a ${email}: ${msg}`);
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
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map