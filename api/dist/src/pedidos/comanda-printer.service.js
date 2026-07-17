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
var ComandaPrinterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComandaPrinterService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const latency_metrics_1 = require("../common/latency-metrics");
const impresoras_pos_service_1 = require("../impresoras-pos/impresoras-pos.service");
const comanda_escpos_builder_1 = require("./comanda-escpos.builder");
const factura_escpos_builder_1 = require("./factura-escpos.builder");
const prueba_impresora_escpos_builder_1 = require("./prueba-impresora-escpos.builder");
const cierre_caja_escpos_builder_1 = require("./cierre-caja-escpos.builder");
const cuentas_divididas_escpos_builder_1 = require("./cuentas-divididas-escpos.builder");
const escpos_paper_status_1 = require("./escpos-paper-status");
const serialport_loader_1 = require("./serialport-loader");
const pedidos_gateway_1 = require("./pedidos.gateway");
const windows_raw_print_1 = require("./windows-raw-print");
const windows_printer_status_1 = require("./windows-printer-status");
const DEFAULT_CHARS = 32;
const MAX_PRINT_RETRIES = 2;
const DEFAULT_BURST_WINDOW_MS = 5_000;
const DEFAULT_INTER_JOB_DELAY_MS = 2_000;
let ComandaPrinterService = ComandaPrinterService_1 = class ComandaPrinterService {
    config;
    impresorasPos;
    gateway;
    logger = new common_1.Logger(ComandaPrinterService_1.name);
    colasPorDestino = new Map();
    trabajosPorDestino = new Map();
    encoladosRecientes = new Map();
    impresionRapida = false;
    constructor(config, impresorasPos, gateway) {
        this.config = config;
        this.impresorasPos = impresorasPos;
        this.gateway = gateway;
    }
    enabled() {
        const live = process.env.PRINTER_ENABLED?.trim();
        const v = (live || this.config.get('PRINTER_ENABLED') || '')
            .trim()
            .toLowerCase();
        return v === '1' || v === 'true' || v === 'yes';
    }
    charWidth() {
        const n = Number(this.config.get('PRINTER_WIDTH') ?? DEFAULT_CHARS);
        return Number.isFinite(n) && n >= 24 && n <= 48 ? n : DEFAULT_CHARS;
    }
    baudRateDefault() {
        const n = Number(this.config.get('PRINTER_BAUD_RATE') ?? 9600);
        return Number.isFinite(n) && n > 0 ? n : 9600;
    }
    jobCooldownMs() {
        const n = Number(this.config.get('PRINTER_JOB_COOLDOWN_MS') ?? DEFAULT_INTER_JOB_DELAY_MS);
        return Number.isFinite(n) && n >= 0 ? n : DEFAULT_INTER_JOB_DELAY_MS;
    }
    burstWindowMs() {
        const n = Number(this.config.get('PRINTER_BURST_WINDOW_MS') ?? DEFAULT_BURST_WINDOW_MS);
        return Number.isFinite(n) && n >= 0 ? n : DEFAULT_BURST_WINDOW_MS;
    }
    registrarEncolado(destinoKey) {
        const now = Date.now();
        const windowMs = this.burstWindowMs();
        const prev = this.encoladosRecientes.get(destinoKey) ?? [];
        const recent = prev.filter((t) => now - t <= windowMs);
        recent.push(now);
        this.encoladosRecientes.set(destinoKey, recent);
    }
    hayRafagaActiva(destinoKey) {
        const now = Date.now();
        const windowMs = this.burstWindowMs();
        const recent = (this.encoladosRecientes.get(destinoKey) ?? []).filter((t) => now - t <= windowMs);
        this.encoladosRecientes.set(destinoKey, recent);
        return recent.length >= 2;
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
    nuevoJobId() {
        return `pj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }
    emitirEstadoImpresion(jobId, estado, destino, extra) {
        try {
            this.gateway?.emitImpresionEstado({
                jobId,
                estado,
                destino,
                error: extra?.error,
                retries: extra?.retries,
                at: new Date().toISOString(),
            });
        }
        catch {
        }
    }
    esErrorReintentable(r) {
        if (r.impreso)
            return false;
        if (r.codigo_error === 'sin_papel' ||
            r.codigo_error === 'papel_bajo' ||
            r.codigo_error === 'sin_impresora_configurada') {
            return false;
        }
        return true;
    }
    encolarEnDestino(destino, job) {
        const key = destino.trim().toLowerCase();
        const jobId = this.nuevoJobId();
        const porDelante = this.trabajosPorDestino.get(key) ?? 0;
        this.trabajosPorDestino.set(key, porDelante + 1);
        this.registrarEncolado(key);
        (0, latency_metrics_1.trackPrintJobQueued)(jobId, destino);
        this.emitirEstadoImpresion(jobId, 'queued', destino);
        const prev = this.colasPorDestino.get(key) ?? Promise.resolve();
        const run = prev.then(async () => {
            if (porDelante > 0) {
                this.logger.log(`Cola ${destino}: ${porDelante} ticket(s) por delante…`);
            }
            (0, latency_metrics_1.trackPrintJobSent)(jobId);
            this.emitirEstadoImpresion(jobId, 'sent', destino);
            let result = {
                impreso: false,
                error: 'Sin resultado',
                codigo_error: 'otro',
            };
            for (let attempt = 0; attempt <= MAX_PRINT_RETRIES; attempt++) {
                if (attempt > 0) {
                    (0, latency_metrics_1.trackPrintRetry)(jobId);
                    await this.sleep(200 * attempt);
                }
                result = await job();
                result = { ...result, job_id: jobId, destino: result.destino ?? destino };
                if (result.impreso || !this.esErrorReintentable(result))
                    break;
                this.logger.warn(`Reintento impresión ${destino} (${attempt + 1}/${MAX_PRINT_RETRIES}): ${result.error}`);
            }
            const ok = Boolean(result.impreso);
            (0, latency_metrics_1.trackPrintJobFinished)(jobId, ok, result.error);
            this.emitirEstadoImpresion(jobId, ok ? 'completed' : 'error', destino, { error: result.error });
            const remainingAfter = (this.trabajosPorDestino.get(key) ?? 1) - 1;
            if (ok &&
                remainingAfter > 0 &&
                !this.impresionRapida &&
                this.hayRafagaActiva(key)) {
                const ms = this.jobCooldownMs();
                if (ms > 0) {
                    this.logger.log(`Ticket impreso en ${destino}; pausa ${ms / 1000}s (ráfaga, ${remainingAfter} en cola)`);
                    await this.sleep(ms);
                }
            }
            return result;
        });
        this.colasPorDestino.set(key, run.then(() => undefined, () => undefined));
        return run.finally(() => {
            const n = (this.trabajosPorDestino.get(key) ?? 1) - 1;
            if (n <= 0)
                this.trabajosPorDestino.delete(key);
            else
                this.trabajosPorDestino.set(key, n);
        });
    }
    filtrarComandaParaEstacion(ticket, destino) {
        const reglas = destino.reglas ?? [];
        if (reglas.length === 0)
            return null;
        const lineas = ticket.lineas.filter((l) => reglas.some((r) => {
            if (r.alcance === 'producto' && r.id_producto != null) {
                return l.id_producto === r.id_producto;
            }
            if (r.alcance === 'categoria' && r.id_categoria != null) {
                return l.id_categoria === r.id_categoria;
            }
            return false;
        }));
        if (lineas.length === 0)
            return null;
        return { ...ticket, lineas };
    }
    async imprimirComanda(ticket) {
        const destinos = await this.impresorasPos.destinosParaRol('cocina');
        if (destinos.length === 0) {
            return {
                impreso: false,
                error: 'Sin impresora de cocina configurada',
                codigo_error: 'sin_impresora_configurada',
            };
        }
        const jobs = [];
        const hayMaestra = destinos.some((d) => d.es_cocina_maestra);
        const hayEstaciones = destinos.some((d) => !d.es_cocina_maestra && (d.reglas?.length ?? 0) > 0);
        for (const d of destinos) {
            if (d.es_cocina_maestra) {
                jobs.push({ destino: d, ticket });
                continue;
            }
            if ((d.reglas?.length ?? 0) > 0) {
                const filtrada = this.filtrarComandaParaEstacion(ticket, d);
                if (filtrada)
                    jobs.push({ destino: d, ticket: filtrada });
                continue;
            }
            if (!hayMaestra && !hayEstaciones) {
                jobs.push({ destino: d, ticket });
            }
        }
        if (jobs.length === 0) {
            jobs.push({ destino: destinos[0], ticket });
        }
        const resultados = await Promise.all(jobs.map(({ destino, ticket: t }) => this.imprimirComandaEnDestino(t, destino)));
        const ok = resultados.find((r) => r.impreso);
        if (ok) {
            const fallos = resultados.filter((r) => !r.impreso);
            if (fallos.length) {
                this.logger.warn(`Comanda parcial: ${fallos.map((f) => f.error).join(' | ')}`);
            }
            return ok;
        }
        return (resultados[0] ?? {
            impreso: false,
            error: 'No se pudo imprimir la comanda',
            codigo_error: 'otro',
        });
    }
    async imprimirComandaEnDestino(ticket, destino) {
        let buffer;
        try {
            buffer = await (0, comanda_escpos_builder_1.buildComandaEscPos)(ticket, this.charWidth());
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.error(`Error generando ESC/POS comanda: ${msg}`);
            return { impreso: false, error: `Error generando ticket: ${msg}` };
        }
        return this.encolarEnDestino(destino.destino, () => this.enviarBufferATargets(buffer, 'comanda', [destino.destino], destino.baud_rate));
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
        return this.enviarPorRol(buffer, 'factura', 'factura');
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
        return this.enviarPorRol(buffer, 'cierre', 'caja');
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
        return this.enviarPorRol(buffer, 'cierre', 'caja');
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
        return this.enviarPorRol(buffer, 'cierre', 'caja');
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
        return this.enviarPorRol(buffer, 'cierre', 'caja');
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
        return this.enviarPorRol(buffer, 'cierre', 'caja');
    }
    async enviarPorRol(buffer, tipo, rol) {
        const destinos = await this.impresorasPos.destinosParaRol(rol);
        if (destinos.length === 0) {
            return {
                impreso: false,
                error: `Sin impresora de ${rol} configurada`,
                codigo_error: 'sin_impresora_configurada',
            };
        }
        const targets = destinos.map((d) => d.destino);
        const baud = destinos[0]?.baud_rate ?? null;
        return this.encolarEnDestino(targets[0], () => this.enviarBufferATargets(buffer, tipo, targets, baud));
    }
    async enviarBufferATargets(buffer, tipo, targets, baudRate, opts = {}) {
        if (!this.enabled()) {
            return {
                impreso: false,
                error: 'Impresora deshabilitada. Active PRINTER_ENABLED o una impresora en Impresoras POS.',
            };
        }
        if (targets.length === 0) {
            return {
                impreso: false,
                error: 'Sin destino de impresión',
                codigo_error: 'sin_impresora_configurada',
            };
        }
        const errors = [];
        for (const target of targets) {
            if (!opts.ignorarSensorPapel) {
                const papel = await this.consultarPapel(target, baudRate);
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
            }
            try {
                await this.sendBuffer(target, buffer, baudRate);
                this.logger.log(`${tipo} impresa vía ${target}`);
                return { impreso: true, destino: target };
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                errors.push(`${target}: ${msg}`);
                this.logger.warn(`Impresión ${tipo} falló (${target}): ${msg}`);
                if (!opts.ignorarSensorPapel) {
                    const trasFallo = await this.consultarPapel(target, baudRate);
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
        }
        return {
            impreso: false,
            error: errors.join(' | '),
            codigo_error: 'otro',
        };
    }
    async consultarEstadoPapel() {
        const destinos = await this.impresorasPos.destinosParaRol('cocina');
        const fallback = destinos[0] ??
            (await this.impresorasPos.destinosParaRol('factura'))[0] ??
            (await this.impresorasPos.destinosParaRol('caja'))[0];
        if (!fallback) {
            return {
                destino: null,
                sin_papel: null,
                papel_bajo: null,
                error: 'Sin impresora configurada',
            };
        }
        return this.consultarEstadoPapelDestino(fallback.destino, fallback.baud_rate);
    }
    async consultarEstadoPapelDestino(destino, baudRate = null) {
        if (!this.enabled()) {
            return {
                destino: null,
                sin_papel: null,
                papel_bajo: null,
                error: 'Impresora deshabilitada (PRINTER_ENABLED)',
            };
        }
        const papel = await this.consultarPapel(destino, baudRate);
        if (!papel) {
            return {
                destino,
                sin_papel: null,
                papel_bajo: null,
                error: 'No se pudo leer el sensor de papel (revise conexión USB/COM)',
            };
        }
        return {
            destino,
            sin_papel: papel.sinPapel,
            papel_bajo: papel.papelBajo,
        };
    }
    async consultarPapel(target, baudRate) {
        const lower = target.toLowerCase();
        if (lower.startsWith('printer:')) {
            const name = target.slice('printer:'.length).trim();
            if (!name)
                return null;
            return (0, windows_printer_status_1.consultarPapelWindows)(name);
        }
        try {
            const comPath = this.normalizeComPath(target);
            return (0, escpos_paper_status_1.consultarPapelSerial)(comPath, baudRate && baudRate > 0 ? baudRate : this.baudRateDefault());
        }
        catch {
            return null;
        }
    }
    async sendBuffer(target, buffer, baudRate) {
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
        await this.sendSerial(comPath, buffer, baudRate && baudRate > 0 ? baudRate : this.baudRateDefault());
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
    async sendSerial(path, buffer, baud) {
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
        const destinos = await this.impresorasPos.destinosParaRol('cocina');
        const destino = destinos[0]?.destino ??
            (await this.impresorasPos.destinosParaRol('factura'))[0]?.destino ??
            'printer:POS';
        return this.imprimirPruebaADestino(destino, destinos[0]?.baud_rate ?? null);
    }
    async imprimirPruebaADestino(destino, baudRate = null) {
        let buffer;
        try {
            buffer = await (0, prueba_impresora_escpos_builder_1.buildPruebaImpresoraEscPos)(destino, this.charWidth());
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            return { impreso: false, error: `Error generando ticket: ${msg}` };
        }
        return this.encolarEnDestino(destino, () => this.enviarBufferATargets(buffer, 'comanda', [destino], baudRate, {
            ignorarSensorPapel: true,
        }));
    }
};
exports.ComandaPrinterService = ComandaPrinterService;
exports.ComandaPrinterService = ComandaPrinterService = ComandaPrinterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => impresoras_pos_service_1.ImpresorasPosService))),
    __param(2, (0, common_1.Optional)()),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => pedidos_gateway_1.PedidosGateway))),
    __metadata("design:paramtypes", [config_1.ConfigService,
        impresoras_pos_service_1.ImpresorasPosService,
        pedidos_gateway_1.PedidosGateway])
], ComandaPrinterService);
//# sourceMappingURL=comanda-printer.service.js.map