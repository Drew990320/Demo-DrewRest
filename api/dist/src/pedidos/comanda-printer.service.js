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
var ComandaPrinterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComandaPrinterService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const comanda_escpos_builder_1 = require("./comanda-escpos.builder");
const factura_escpos_builder_1 = require("./factura-escpos.builder");
const cierre_caja_escpos_builder_1 = require("./cierre-caja-escpos.builder");
const cuentas_divididas_escpos_builder_1 = require("./cuentas-divididas-escpos.builder");
const escpos_paper_status_1 = require("./escpos-paper-status");
const serialport_loader_1 = require("./serialport-loader");
const windows_raw_print_1 = require("./windows-raw-print");
const windows_printer_status_1 = require("./windows-printer-status");
const DEFAULT_CHARS = 32;
let ComandaPrinterService = ComandaPrinterService_1 = class ComandaPrinterService {
    config;
    logger = new common_1.Logger(ComandaPrinterService_1.name);
    colaImpresion = Promise.resolve();
    trabajosEnCola = 0;
    impresionRapida = false;
    constructor(config) {
        this.config = config;
    }
    enabled() {
        const v = this.config.get('PRINTER_ENABLED');
        return v === '1' || v === 'true' || v === 'yes';
    }
    charWidth() {
        const n = Number(this.config.get('PRINTER_WIDTH') ?? DEFAULT_CHARS);
        return Number.isFinite(n) && n >= 24 && n <= 48 ? n : DEFAULT_CHARS;
    }
    baudRate() {
        const n = Number(this.config.get('PRINTER_BAUD_RATE') ?? 9600);
        return Number.isFinite(n) && n > 0 ? n : 9600;
    }
    jobCooldownMs() {
        const n = Number(this.config.get('PRINTER_JOB_COOLDOWN_MS') ?? 10000);
        return Number.isFinite(n) && n >= 0 ? n : 10000;
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async runWithImpresionRapida(fn) {
        const prev = this.impresionRapida;
        this.impresionRapida = true;
        try {
            return await fn();
        }
        finally {
            this.impresionRapida = prev;
        }
    }
    encolarImpresion(job) {
        const porDelante = this.trabajosEnCola;
        this.trabajosEnCola += 1;
        const run = this.colaImpresion.then(async () => {
            if (porDelante > 0) {
                this.logger.log(`Cola de impresión: ${porDelante} ticket(s) por delante; esperando turno…`);
            }
            const result = await job();
            if (this.debeEsperarTrasImpresion(result) &&
                !this.impresionRapida) {
                const ms = this.jobCooldownMs();
                if (ms > 0) {
                    this.logger.log(`Ticket impreso; esperando ${ms / 1000}s antes del siguiente (corte de papel)`);
                    await this.sleep(ms);
                }
            }
            return result;
        });
        this.colaImpresion = run.then(() => undefined, () => undefined);
        return run.finally(() => {
            this.trabajosEnCola -= 1;
        });
    }
    debeEsperarTrasImpresion(result) {
        return (typeof result === 'object' &&
            result !== null &&
            'impreso' in result &&
            result.impreso === true);
    }
    targets() {
        const raw = this.config.get('PRINTER_INTERFACE')?.trim() ||
            this.config.get('PRINTER_SERIAL_PORT')?.trim() ||
            '';
        if (!raw)
            return [];
        return raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    async imprimirComanda(ticket) {
        let buffer;
        try {
            buffer = await (0, comanda_escpos_builder_1.buildComandaEscPos)(ticket, this.charWidth());
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.error(`Error generando ESC/POS comanda: ${msg}`);
            return { impreso: false, error: `Error generando ticket: ${msg}` };
        }
        return this.encolarImpresion(() => this.enviarBuffer(buffer, 'comanda'));
    }
    async imprimirFactura(ticket) {
        let buffer;
        try {
            buffer = await (0, factura_escpos_builder_1.buildFacturaEscPos)(ticket, this.charWidth());
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.error(`Error generando ESC/POS factura: ${msg}`);
            return { impreso: false, error: `Error generando factura: ${msg}` };
        }
        return this.encolarImpresion(() => this.enviarBuffer(buffer, 'factura'));
    }
    async imprimirCierreCaja(ticket) {
        let buffer;
        try {
            buffer = await (0, cierre_caja_escpos_builder_1.buildCierreCajaEscPos)(ticket, this.charWidth());
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.error(`Error generando ESC/POS cierre: ${msg}`);
            return { impreso: false, error: `Error generando cierre: ${msg}` };
        }
        return this.encolarImpresion(() => this.enviarBuffer(buffer, 'cierre'));
    }
    async imprimirCuentasDivididas(ticket) {
        let buffer;
        try {
            buffer = await (0, cuentas_divididas_escpos_builder_1.buildCuentasDivididasEscPos)(ticket, this.charWidth());
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.error(`Error generando ESC/POS cuentas divididas: ${msg}`);
            return { impreso: false, error: `Error generando cuentas divididas: ${msg}` };
        }
        return this.encolarImpresion(() => this.enviarBuffer(buffer, 'cierre'));
    }
    async imprimirBaseCaja(ticket) {
        let buffer;
        try {
            buffer = await (0, cierre_caja_escpos_builder_1.buildBaseCajaEscPos)(ticket, this.charWidth());
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.error(`Error generando ESC/POS base caja: ${msg}`);
            return { impreso: false, error: `Error generando base caja: ${msg}` };
        }
        return this.encolarImpresion(() => this.enviarBuffer(buffer, 'cierre'));
    }
    async imprimirBaseCajaCierre(ticket) {
        let buffer;
        try {
            buffer = await (0, cierre_caja_escpos_builder_1.buildBaseCajaCierreEscPos)(ticket, this.charWidth());
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.error(`Error generando ESC/POS base cierre: ${msg}`);
            return { impreso: false, error: `Error generando base cierre: ${msg}` };
        }
        return this.encolarImpresion(() => this.enviarBuffer(buffer, 'cierre'));
    }
    async imprimirMovimientoCaja(ticket) {
        let buffer;
        try {
            buffer = await (0, cierre_caja_escpos_builder_1.buildMovimientoCajaEscPos)(ticket, this.charWidth());
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.error(`Error generando ESC/POS movimiento caja: ${msg}`);
            return {
                impreso: false,
                error: `Error generando comprobante de caja: ${msg}`,
            };
        }
        return this.encolarImpresion(() => this.enviarBuffer(buffer, 'cierre'));
    }
    async enviarBuffer(buffer, tipo) {
        if (!this.enabled()) {
            return {
                impreso: false,
                error: 'Impresora deshabilitada. En api/.env (DrewRest) o services/api/.env pon PRINTER_ENABLED=true',
            };
        }
        const targets = this.targets();
        if (targets.length === 0) {
            return {
                impreso: false,
                error: 'Configure PRINTER_INTERFACE (ej. printer:POS-58,COM3). Vea .env.example',
            };
        }
        const errors = [];
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
            }
            catch (e) {
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
    async consultarEstadoPapel() {
        if (!this.enabled()) {
            return {
                destino: null,
                sin_papel: null,
                papel_bajo: null,
                error: 'Impresora deshabilitada (PRINTER_ENABLED)',
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
    async consultarPapel(target) {
        const lower = target.toLowerCase();
        if (lower.startsWith('printer:')) {
            const name = target.slice('printer:'.length).trim();
            if (!name)
                return null;
            return (0, windows_printer_status_1.consultarPapelWindows)(name);
        }
        try {
            const comPath = this.normalizeComPath(target);
            return (0, escpos_paper_status_1.consultarPapelSerial)(comPath, this.baudRate());
        }
        catch {
            return null;
        }
    }
    async sendBuffer(target, buffer) {
        const lower = target.toLowerCase();
        if (lower.startsWith('printer:')) {
            const name = target.slice('printer:'.length).trim();
            if (!name)
                throw new Error('Nombre de impresora vacío');
            if (process.platform !== 'win32') {
                throw new Error('printer: solo en Windows');
            }
            await (0, windows_raw_print_1.printRawWindows)(name, buffer);
            return;
        }
        const comPath = this.normalizeComPath(target);
        await this.sendSerial(comPath, buffer);
    }
    normalizeComPath(target) {
        const t = target.trim();
        if (/^COM\d+$/i.test(t)) {
            return `\\\\.\\${t.toUpperCase()}`;
        }
        if (t.startsWith('\\\\.\\')) {
            return t;
        }
        throw new Error(`Destino no reconocido: ${target}`);
    }
    async sendSerial(path, buffer) {
        const baud = this.baudRate();
        const SerialPort = await (0, serialport_loader_1.loadSerialPortClass)();
        return new Promise((resolve, reject) => {
            const port = new SerialPort({ path, baudRate: baud, autoOpen: false }, (err) => {
                if (err)
                    reject(err);
            });
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
                            if (drainErr)
                                reject(drainErr);
                            else
                                resolve();
                        });
                    });
                });
            });
        });
    }
    async imprimirPrueba() {
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
};
exports.ComandaPrinterService = ComandaPrinterService;
exports.ComandaPrinterService = ComandaPrinterService = ComandaPrinterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ComandaPrinterService);
//# sourceMappingURL=comanda-printer.service.js.map