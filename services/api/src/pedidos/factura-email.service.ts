import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { restaurantEmailSuffix, restaurantModuloEnvioCorreoActivo, restaurantName, restaurantPrefijoAsuntoCorreo } from '../common/restaurant-branding';
import {
  buildFacturaEmailHtml,
  buildFacturaEmailText,
} from './factura-email.builder';
import type { FacturaTicket } from './factura-ticket';

export type ResultadoEnvioFacturaCorreo = {
  enviado: boolean;
  email: string;
  error?: string;
};

@Injectable()
export class FacturaEmailService {
  private readonly logger = new Logger(FacturaEmailService.name);

  constructor(private readonly config: ConfigService) {}

  /** SMTP configurado en el servidor (requiere internet hacia el proveedor). */
  estaConfigurado(): boolean {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    const from = this.config.get<string>('SMTP_FROM')?.trim();
    const enabled = this.config.get<string>('FACTURA_EMAIL_ENABLED');
    if (enabled === 'false' || enabled === '0') return false;
    return Boolean(host && from);
  }

  private crearTransporter(): Transporter | null {
    if (!this.estaConfigurado()) return null;
    const host = this.config.get<string>('SMTP_HOST')!.trim();
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    const secure =
      this.config.get<string>('SMTP_SECURE') === 'true' ||
      this.config.get<string>('SMTP_SECURE') === '1' ||
      port === 465;
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS')?.trim();

    return nodemailer.createTransport({
      host,
      port: Number.isFinite(port) ? port : 587,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      connectionTimeout: 12_000,
      greetingTimeout: 12_000,
      socketTimeout: 20_000,
    });
  }

  async enviarFactura(
    ticket: FacturaTicket,
    emailDestino: string,
  ): Promise<ResultadoEnvioFacturaCorreo> {
    const email = emailDestino.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { enviado: false, email, error: 'Correo del cliente no válido' };
    }

    if (!this.estaConfigurado()) {
      return {
        enviado: false,
        email,
        error:
          'El envío por correo no está configurado en el servidor (SMTP_HOST / SMTP_FROM).',
      };
    }

    if (!restaurantModuloEnvioCorreoActivo()) {
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

    const from =
      this.config.get<string>('SMTP_FROM')?.trim() ||
      `${restaurantName()} <noreply${restaurantEmailSuffix()}>`;
    const prefijo = restaurantPrefijoAsuntoCorreo() || restaurantName();
    const idRef = ticket.id_factura ?? ticket.id_pedido;
    const subject = `${prefijo} · Factura #${idRef} · ${ticket.mesa_etiqueta}`;

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject,
        text: buildFacturaEmailText(ticket),
        html: buildFacturaEmailHtml(ticket),
      });
      this.logger.log(
        `Factura enviada a ${email} (pedido ${ticket.id_pedido}, factura ${ticket.id_factura ?? '—'})`,
      );
      return { enviado: true, email };
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Error desconocido al enviar correo';
      this.logger.warn(`Fallo envío factura a ${email}: ${msg}`);
      const sinRed =
        /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ECONNRESET|network|getaddrinfo/i.test(
          msg,
        );
      return {
        enviado: false,
        email,
        error: sinRed
          ? 'No hay conexión a internet o el servidor de correo no responde.'
          : `No se pudo enviar el correo: ${msg}`,
      };
    }
  }
}
