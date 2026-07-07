import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ComandaTicket } from './comanda-ticket';
import type { FacturaTicket } from './factura-ticket';
import { buildComandaEscPos } from './comanda-escpos.builder';
import { buildFacturaEscPos } from './factura-escpos.builder';
import { buildBaseCajaCierreEscPos, buildBaseCajaEscPos, buildCierreCajaEscPos, buildMovimientoCajaEscPos } from './cierre-caja-escpos.builder';
import { buildCuentasDivididasEscPos } from './cuentas-divididas-escpos.builder';
import type { BaseCajaCierreTicket, BaseCajaTicket, CierreCajaTicket, MovimientoCajaTicket } from './cierre-caja-ticket';
import type { CuentasDivididasTicket } from './cuentas-divididas-ticket';
import { consultarPapelSerial } from './escpos-paper-status';
import { loadSerialPortClass } from './serialport-loader';
import { printRawWindows } from './windows-raw-print';
import { consultarPapelWindows } from './windows-printer-status';
import { mensajeImpresionRequiereDrewTech } from '@la-reserva/shared-domain/impresion-soporte';
import {
  buildComandaPreviewHtml,
  buildFacturaPreviewHtml,
  buildBaseCajaPreviewHtml,
  buildBaseCajaCierrePreviewHtml,
  buildMovimientoCajaPreviewHtml,
  buildCierreCajaPreviewHtml,
} from './ticket-preview.builder';

const DEFAULT_CHARS = 32;

export type CodigoErrorImpresion =
  | 'sin_papel'
  | 'papel_bajo'
  | 'offline'
  | 'no_disponible'
  | 'otro';

export type ResultadoImpresion = {
  impreso: boolean;
  error?: string;
  codigo_error?: CodigoErrorImpresion;
  destino?: string;
  /** Cobro sin impresión solicitada por el usuario. */
  omitido?: boolean;
  /** Ticket encolado; la impresión continúa en segundo plano. */
  en_cola?: boolean;
  /** Vista previa HTML del ticket POS (demo sin impresora). */
  preview_html?: string;
};

@Injectable()
export class ComandaPrinterService {
  private readonly logger = new Logger(ComandaPrinterService.name);
  /** Encadena trabajos para no mandar dos tickets a la vez a la misma impresora. */
  private colaImpresion: Promise<unknown> = Promise.resolve();
  private trabajosEnCola = 0;
  /** Sin pausa entre tickets (resumen diario / cierre en lote). */
  private impresionRapida = false;

  constructor(private readonly config: ConfigService) {}

  /** Indica si la impresora térmica está activa en este servidor. */
  isEnabled(): boolean {
    return this.enabled();
  }

  private enabled(): boolean {
    const v = this.config.get<string>('PRINTER_ENABLED');
    return v === '1' || v === 'true' || v === 'yes';
  }

  private resultadoVistaPreviaDemo(preview_html: string): ResultadoImpresion {
    return {
      impreso: false,
      codigo_error: 'no_disponible',
      error: 'Vista previa demo',
      preview_html,
    };
  }

  private charWidth(): number {
    const n = Number(this.config.get<string>('PRINTER_WIDTH') ?? DEFAULT_CHARS);
    return Number.isFinite(n) && n >= 24 && n <= 48 ? n : DEFAULT_CHARS;
  }

  private baudRate(): number {
    const n = Number(this.config.get<string>('PRINTER_BAUD_RATE') ?? 9600);
    return Number.isFinite(n) && n > 0 ? n : 9600;
  }

  /**
   * Pausa entre tickets impresos (ms). Da tiempo a cortar el papel antes del siguiente.
   * 0 = solo serializar la cola, sin espera extra.
   * No aplica al resumen diario (impresión de cierre en lote).
   */
  private jobCooldownMs(): number {
    const n = Number(this.config.get<string>('PRINTER_JOB_COOLDOWN_MS') ?? 10000);
    return Number.isFinite(n) && n >= 0 ? n : 10000;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Impresiones de cierre / resumen diario: encadena tickets sin la pausa
   * entre trabajos (PRINTER_JOB_COOLDOWN_MS). La cola sigue siendo serial.
   */
  async runWithImpresionRapida<T>(fn: () => Promise<T>): Promise<T> {
    const prev = this.impresionRapida;
    this.impresionRapida = true;
    try {
      return await fn();
    } finally {
      this.impresionRapida = prev;
    }
  }

  /** Un solo trabajo físico a la vez; pausa opcional tras impresión exitosa. */
  private encolarImpresion<T>(job: () => Promise<T>): Promise<T> {
    const porDelante = this.trabajosEnCola;
    this.trabajosEnCola += 1;

    const run = this.colaImpresion.then(async () => {
      if (porDelante > 0) {
        this.logger.log(
          `Cola de impresión: ${porDelante} ticket(s) por delante; esperando turno…`,
        );
      }
      const result = await job();
      if (
        this.debeEsperarTrasImpresion(result) &&
        !this.impresionRapida
      ) {
        const ms = this.jobCooldownMs();
        if (ms > 0) {
          this.logger.log(
            `Ticket impreso; esperando ${ms / 1000}s antes del siguiente (corte de papel)`,
          );
          await this.sleep(ms);
        }
      }
      return result;
    });

    this.colaImpresion = run.then(
      () => undefined,
      () => undefined,
    );
    return run.finally(() => {
      this.trabajosEnCola -= 1;
    });
  }

  private debeEsperarTrasImpresion(result: unknown): boolean {
    return (
      typeof result === 'object' &&
      result !== null &&
      'impreso' in result &&
      (result as ResultadoImpresion).impreso === true
    );
  }

  /** Lista de destinos: printer:Nombre, COM3, \\.\COM4 (separados por coma). */
  private targets(): string[] {
    const raw =
      this.config.get<string>('PRINTER_INTERFACE')?.trim() ||
      this.config.get<string>('PRINTER_SERIAL_PORT')?.trim() ||
      '';
    if (!raw) return [];
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /** Imprime comanda ESC/POS 58 mm. Prueba varios destinos hasta que uno funcione. */
  async imprimirComanda(ticket: ComandaTicket): Promise<ResultadoImpresion> {
    if (!this.enabled()) {
      return this.resultadoVistaPreviaDemo(buildComandaPreviewHtml(ticket));
    }
    let buffer: Buffer;
    try {
      buffer = await buildComandaEscPos(ticket, this.charWidth());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Error generando ESC/POS comanda: ${msg}`);
      return { impreso: false, error: `Error generando ticket: ${msg}` };
    }
    return this.encolarImpresion(() => this.enviarBuffer(buffer, 'comanda'));
  }

  /** Imprime cuenta/factura con detalle y precios. */
  async imprimirFactura(ticket: FacturaTicket): Promise<ResultadoImpresion> {
    if (!this.enabled()) {
      return this.resultadoVistaPreviaDemo(buildFacturaPreviewHtml(ticket));
    }
    let buffer: Buffer;
    try {
      buffer = await buildFacturaEscPos(ticket, this.charWidth());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Error generando ESC/POS factura: ${msg}`);
      return { impreso: false, error: `Error generando factura: ${msg}` };
    }
    return this.encolarImpresion(() => this.enviarBuffer(buffer, 'factura'));
  }

  /** Ticket de cierre diario (solo totales). */
  async imprimirCierreCaja(ticket: CierreCajaTicket): Promise<ResultadoImpresion> {
    if (!this.enabled()) {
      return this.resultadoVistaPreviaDemo(buildCierreCajaPreviewHtml(ticket));
    }
    let buffer: Buffer;
    try {
      buffer = await buildCierreCajaEscPos(ticket, this.charWidth());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Error generando ESC/POS cierre: ${msg}`);
      return { impreso: false, error: `Error generando cierre: ${msg}` };
    }
    return this.encolarImpresion(() => this.enviarBuffer(buffer, 'cierre'));
  }

  /** Detalle de pedidos cobrados en varias facturas (cuenta dividida). */
  async imprimirCuentasDivididas(
    ticket: CuentasDivididasTicket,
  ): Promise<ResultadoImpresion> {
    let buffer: Buffer;
    try {
      buffer = await buildCuentasDivididasEscPos(ticket, this.charWidth());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Error generando ESC/POS cuentas divididas: ${msg}`);
      return { impreso: false, error: `Error generando cuentas divididas: ${msg}` };
    }
    return this.encolarImpresion(() => this.enviarBuffer(buffer, 'cierre'));
  }

  /** Comprobante de base de caja al abrir el día. */
  async imprimirBaseCaja(ticket: BaseCajaTicket): Promise<ResultadoImpresion> {
    if (!this.enabled()) {
      return this.resultadoVistaPreviaDemo(buildBaseCajaPreviewHtml(ticket));
    }
    let buffer: Buffer;
    try {
      buffer = await buildBaseCajaEscPos(ticket, this.charWidth());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Error generando ESC/POS base caja: ${msg}`);
      return { impreso: false, error: `Error generando base caja: ${msg}` };
    }
    return this.encolarImpresion(() => this.enviarBuffer(buffer, 'cierre'));
  }

  /** Comprobante de arqueo al cerrar caja del día. */
  async imprimirBaseCajaCierre(
    ticket: BaseCajaCierreTicket,
  ): Promise<ResultadoImpresion> {
    if (!this.enabled()) {
      return this.resultadoVistaPreviaDemo(buildBaseCajaCierrePreviewHtml(ticket));
    }
    let buffer: Buffer;
    try {
      buffer = await buildBaseCajaCierreEscPos(ticket, this.charWidth());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Error generando ESC/POS base cierre: ${msg}`);
      return { impreso: false, error: `Error generando base cierre: ${msg}` };
    }
    return this.encolarImpresion(() => this.enviarBuffer(buffer, 'cierre'));
  }

  /** Comprobante de entrada o salida manual de caja. */
  async imprimirMovimientoCaja(
    ticket: MovimientoCajaTicket,
  ): Promise<ResultadoImpresion> {
    if (!this.enabled()) {
      return this.resultadoVistaPreviaDemo(buildMovimientoCajaPreviewHtml(ticket));
    }
    let buffer: Buffer;
    try {
      buffer = await buildMovimientoCajaEscPos(ticket, this.charWidth());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Error generando ESC/POS movimiento caja: ${msg}`);
      return {
        impreso: false,
        error: `Error generando comprobante de caja: ${msg}`,
      };
    }
    return this.encolarImpresion(() => this.enviarBuffer(buffer, 'cierre'));
  }

  private async enviarBuffer(
    buffer: Buffer,
    tipo: 'comanda' | 'factura' | 'cierre',
  ): Promise<ResultadoImpresion> {
    if (!this.enabled()) {
      return {
        impreso: false,
        codigo_error: 'no_disponible',
        error: mensajeImpresionRequiereDrewTech(),
      };
    }

    const targets = this.targets();
    if (targets.length === 0) {
      return {
        impreso: false,
        error:
          'Configure PRINTER_INTERFACE (ej. printer:POS-58,COM3). Vea .env.example',
      };
    }

    const errors: string[] = [];
    for (const target of targets) {
      const papel = await this.consultarPapel(target);
      if (papel?.sinPapel) {
        const msg = `Sin papel en ${target}. Recargue el rollo en la impresora POS.`;
        this.logger.warn(msg);
        return {
          impreso: false,
          error: msg,
          codigo_error: 'sin_papel',
          destino: target,
        };
      }
      if (papel?.papelBajo) {
        this.logger.warn(`Papel bajo en ${target}`);
      }

      try {
        await this.sendBuffer(target, buffer);
        this.logger.log(`${tipo} impresa vía ${target}`);
        return { impreso: true, destino: target };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${target}: ${msg}`);
        this.logger.warn(`Impresión ${tipo} falló (${target}): ${msg}`);

        const trasFallo = await this.consultarPapel(target);
        if (trasFallo?.sinPapel) {
          return {
            impreso: false,
            error: `Sin papel en ${target}. Recargue el rollo en la impresora POS.`,
            codigo_error: 'sin_papel',
            destino: target,
          };
        }
      }
    }

    return {
      impreso: false,
      error: errors.join(' | '),
      codigo_error: 'otro',
    };
  }

  /** Estado del papel en el primer destino configurado (diagnóstico). */
  async consultarEstadoPapel(): Promise<{
    destino: string | null;
    sin_papel: boolean | null;
    papel_bajo: boolean | null;
    error?: string;
  }> {
    if (!this.enabled()) {
      return {
        destino: null,
        sin_papel: null,
        papel_bajo: null,
        error: mensajeImpresionRequiereDrewTech(),
      };
    }
    const targets = this.targets();
    if (targets.length === 0) {
      return {
        destino: null,
        sin_papel: null,
        papel_bajo: null,
        error: 'Sin PRINTER_INTERFACE configurado',
      };
    }
    const target = targets[0];
    const papel = await this.consultarPapel(target);
    if (!papel) {
      return {
        destino: target,
        sin_papel: null,
        papel_bajo: null,
        error: 'No se pudo leer el sensor de papel (revise conexión USB/COM)',
      };
    }
    return {
      destino: target,
      sin_papel: papel.sinPapel,
      papel_bajo: papel.papelBajo,
    };
  }

  private async consultarPapel(
    target: string,
  ): Promise<{ sinPapel: boolean; papelBajo: boolean } | null> {
    const lower = target.toLowerCase();
    if (lower.startsWith('printer:')) {
      const name = target.slice('printer:'.length).trim();
      if (!name) return null;
      return consultarPapelWindows(name);
    }
    try {
      const comPath = this.normalizeComPath(target);
      return consultarPapelSerial(comPath, this.baudRate());
    } catch {
      return null;
    }
  }

  private async sendBuffer(target: string, buffer: Buffer): Promise<void> {
    const lower = target.toLowerCase();

    if (lower.startsWith('printer:')) {
      const name = target.slice('printer:'.length).trim();
      if (!name) throw new Error('Nombre de impresora vacío');
      if (process.platform !== 'win32') {
        throw new Error('printer: solo en Windows');
      }
      await printRawWindows(name, buffer);
      return;
    }

    const comPath = this.normalizeComPath(target);
    await this.sendSerial(comPath, buffer);
  }

  private normalizeComPath(target: string): string {
    const t = target.trim();
    if (/^COM\d+$/i.test(t)) {
      return `\\\\.\\${t.toUpperCase()}`;
    }
    if (t.startsWith('\\\\.\\')) {
      return t;
    }
    throw new Error(`Destino no reconocido: ${target}`);
  }

  private async sendSerial(path: string, buffer: Buffer): Promise<void> {
    const baud = this.baudRate();
    const SerialPort = await loadSerialPortClass();
    return new Promise((resolve, reject) => {
      const port = new SerialPort(
        { path, baudRate: baud, autoOpen: false },
        (err) => {
          if (err) reject(err);
        },
      );

      port.open((openErr) => {
        if (openErr) {
          reject(openErr);
          return;
        }
        port.write(buffer, (writeErr) => {
          if (writeErr) {
            port.close(() => reject(writeErr));
            return;
          }
          port.drain((drainErr) => {
            port.close(() => {
              if (drainErr) reject(drainErr);
              else resolve();
            });
          });
        });
      });
    });
  }

  /** Ticket de prueba (admin / diagnóstico). */
  async imprimirPrueba(): Promise<{
    impreso: boolean;
    error?: string;
    destino?: string;
  }> {
    return this.imprimirComanda({
      id_pedido: 0,
      mesa_numero: 1,
      mesa_etiqueta: 'Mesa 1',
      num_comensales: 2,
      mesero: 'Prueba',
      modo_servicio: 'en_mesa',
      lineas: [
        {
          id_detalle: 1,
          cantidad: 1,
          nombre_producto: 'Prueba de impresion',
          nota_cocina: 'Sin cebolla',
          personalizaciones: ['Aderezo aparte'],
        },
      ],
      emitida_en: new Date().toISOString(),
    });
  }
}
