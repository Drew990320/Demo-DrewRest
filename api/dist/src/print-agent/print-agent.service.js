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
exports.PrintAgentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const ticket_preview_util_1 = require("../pedidos/ticket-preview.util");
const ticket_preview_service_1 = require("../pedidos/ticket-preview.service");
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const JOB_TTL_MS = 10 * 60 * 1000;
let PrintAgentService = class PrintAgentService {
    config;
    ticketPreview;
    session = null;
    constructor(config, ticketPreview) {
        this.config = config;
        this.ticketPreview = ticketPreview;
    }
    isEnabled() {
        return (0, ticket_preview_util_1.ticketPreviewEnabled)(this.config);
    }
    assertEnabled() {
        if (!this.isEnabled()) {
            throw new common_1.NotFoundException('Puente de impresión demo no habilitado en este servidor');
        }
    }
    getSessionStatus() {
        this.purgeExpired();
        const s = this.session;
        if (!s) {
            return {
                active: false,
                code: null,
                expiresAt: null,
                agentOnline: false,
                printerName: null,
                pendingJobs: 0,
                paired: false,
            };
        }
        return {
            active: true,
            code: s.agentToken ? null : s.code,
            expiresAt: new Date(s.expiresAt).toISOString(),
            agentOnline: this.isAgentFresh(s),
            printerName: s.printerName,
            pendingJobs: s.jobs.filter((j) => j.status === 'pending').length,
            paired: Boolean(s.agentToken),
        };
    }
    createOrRefreshSession(userId) {
        this.assertEnabled();
        this.purgeExpired();
        const now = Date.now();
        const code = String((0, crypto_1.randomInt)(100000, 999999));
        this.session = {
            code,
            agentToken: null,
            createdAt: now,
            expiresAt: now + SESSION_TTL_MS,
            createdByUserId: userId,
            agentOnline: false,
            printerName: null,
            lastHeartbeatAt: null,
            jobs: [],
        };
        return {
            code,
            expiresAt: new Date(this.session.expiresAt).toISOString(),
            message: 'Abre DrewRest.PrintAgent.exe en el PC con la impresora e introduce este código.',
        };
    }
    endSession() {
        this.session = null;
        return { ok: true };
    }
    claim(code) {
        this.assertEnabled();
        this.purgeExpired();
        const s = this.session;
        if (!s || s.code !== code.trim()) {
            throw new common_1.UnauthorizedException('Código inválido o sesión expirada');
        }
        if (s.agentToken) {
            throw new common_1.UnauthorizedException('Este código ya fue usado. Genera uno nuevo en la demo.');
        }
        s.agentToken = (0, crypto_1.randomBytes)(24).toString('hex');
        s.agentOnline = true;
        s.lastHeartbeatAt = Date.now();
        return {
            agentToken: s.agentToken,
            expiresAt: new Date(s.expiresAt).toISOString(),
            message: 'Emparejado. Deja esta ventana abierta durante la presentación.',
        };
    }
    heartbeat(token, printerName, ready) {
        const s = this.requireAgent(token);
        s.lastHeartbeatAt = Date.now();
        s.agentOnline = ready !== false;
        if (printerName != null)
            s.printerName = printerName || null;
        return { ok: true, expiresAt: new Date(s.expiresAt).toISOString() };
    }
    pullJobs(token) {
        const s = this.requireAgent(token);
        this.dropOldJobs(s);
        const pending = s.jobs.filter((j) => j.status === 'pending');
        return {
            jobs: pending.map((j) => ({
                id: j.id,
                label: j.label,
                kind: j.kind,
                text: j.text,
                escposBase64: j.escposBase64,
            })),
        };
    }
    ack(token, jobId, ok, error) {
        const s = this.requireAgent(token);
        const job = s.jobs.find((j) => j.id === jobId);
        if (!job)
            throw new common_1.NotFoundException('Job no encontrado');
        job.status = ok ? 'done' : 'error';
        job.error = ok ? undefined : error || 'Error de impresión';
        return { ok: true };
    }
    enqueue(opts) {
        this.assertEnabled();
        this.purgeExpired();
        const s = this.requirePairedSession();
        this.dropOldJobs(s);
        const kind = opts.kind ??
            (opts.escposBase64 ? 'escpos' : opts.text ? 'text' : 'test');
        const job = {
            id: (0, crypto_1.randomBytes)(8).toString('hex'),
            label: opts.label?.trim() || 'Ticket demo',
            kind,
            text: opts.text,
            escposBase64: opts.escposBase64,
            createdAt: Date.now(),
            status: 'pending',
        };
        if (kind === 'test' && !job.text && !job.escposBase64) {
            job.text = [
                '================================',
                '         DREWREST',
                '   Ticket desde la nube',
                '================================',
                `Fecha: ${new Date().toLocaleString('es-CO')}`,
                '--------------------------------',
                'Demo cloud → agente local → POS',
                'Si lees esto, el puente funciona.',
                '--------------------------------',
                'DrewTech',
                '================================',
            ].join('\n');
            job.kind = 'text';
        }
        s.jobs.push(job);
        return {
            id: job.id,
            label: job.label,
            pendingJobs: s.jobs.filter((j) => j.status === 'pending').length,
            agentOnline: this.isAgentFresh(s),
            printerName: s.printerName,
        };
    }
    async enqueueFromPreview(source, tenantId) {
        const built = await this.ticketPreview.escposForAgentSource(source, tenantId);
        return this.enqueue({
            label: built.label,
            escposBase64: built.escposBase64,
            kind: 'escpos',
        });
    }
    requirePairedSession() {
        const s = this.session;
        if (!s) {
            throw new common_1.NotFoundException('No hay sesión de puente. Genera un código de empareje primero.');
        }
        if (!s.agentToken) {
            throw new common_1.NotFoundException('Todavía no hay un PC emparejado. Abre el PrintAgent e introduce el código.');
        }
        return s;
    }
    requireAgent(token) {
        this.assertEnabled();
        this.purgeExpired();
        const s = this.session;
        if (!s?.agentToken || s.agentToken !== token) {
            throw new common_1.UnauthorizedException('Agente no autorizado o sesión expirada');
        }
        return s;
    }
    isAgentFresh(s) {
        if (!s.agentToken || !s.lastHeartbeatAt)
            return false;
        return Date.now() - s.lastHeartbeatAt < 15_000;
    }
    purgeExpired() {
        if (!this.session)
            return;
        if (Date.now() > this.session.expiresAt) {
            this.session = null;
        }
    }
    dropOldJobs(s) {
        const cutoff = Date.now() - JOB_TTL_MS;
        s.jobs = s.jobs.filter((j) => j.status === 'pending' || j.createdAt >= cutoff);
    }
};
exports.PrintAgentService = PrintAgentService;
exports.PrintAgentService = PrintAgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        ticket_preview_service_1.TicketPreviewService])
], PrintAgentService);
//# sourceMappingURL=print-agent.service.js.map