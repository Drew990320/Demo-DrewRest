"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordHttpLatency = recordHttpLatency;
exports.trackPrintJobQueued = trackPrintJobQueued;
exports.trackPrintJobSent = trackPrintJobSent;
exports.trackPrintJobFinished = trackPrintJobFinished;
exports.trackPrintRetry = trackPrintRetry;
exports.countPendingPrintJobs = countPendingPrintJobs;
exports.snapshotRendimiento = snapshotRendimiento;
const MAX_SAMPLES = 200;
const MAX_PRINT_HISTORY = 100;
const routes = new Map();
const printActive = new Map();
const printHistory = [];
let printErrors = 0;
let printCompleted = 0;
let printTotalQueueToSentMs = 0;
let printQueueToSentCount = 0;
function percentile(sorted, p) {
    if (!sorted.length)
        return 0;
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
    return sorted[idx] ?? 0;
}
function recordHttpLatency(method, route, ms, isError) {
    const key = `${method} ${route}`;
    let row = routes.get(key);
    if (!row) {
        row = {
            route: key,
            count: 0,
            errors: 0,
            totalMs: 0,
            maxMs: 0,
            samples: [],
        };
        routes.set(key, row);
    }
    row.count += 1;
    if (isError)
        row.errors += 1;
    row.totalMs += ms;
    if (ms > row.maxMs)
        row.maxMs = ms;
    row.samples.push(ms);
    if (row.samples.length > MAX_SAMPLES) {
        row.samples.splice(0, row.samples.length - MAX_SAMPLES);
    }
}
function trackPrintJobQueued(jobId, destino) {
    const job = {
        jobId,
        destino,
        estado: 'queued',
        queuedAt: Date.now(),
        retries: 0,
    };
    printActive.set(jobId, job);
    return job;
}
function trackPrintJobSent(jobId) {
    const job = printActive.get(jobId);
    if (!job)
        return;
    job.estado = 'sent';
    job.sentAt = Date.now();
    printTotalQueueToSentMs += job.sentAt - job.queuedAt;
    printQueueToSentCount += 1;
}
function trackPrintJobFinished(jobId, ok, error) {
    const job = printActive.get(jobId);
    if (!job)
        return;
    job.finishedAt = Date.now();
    job.estado = ok ? 'completed' : 'error';
    if (error)
        job.error = error;
    if (ok)
        printCompleted += 1;
    else
        printErrors += 1;
    printActive.delete(jobId);
    printHistory.unshift({ ...job });
    if (printHistory.length > MAX_PRINT_HISTORY) {
        printHistory.length = MAX_PRINT_HISTORY;
    }
}
function trackPrintRetry(jobId) {
    const job = printActive.get(jobId);
    if (job)
        job.retries += 1;
}
function countPendingPrintJobs() {
    return printActive.size;
}
function snapshotRendimiento(extra) {
    const mem = process.memoryUsage();
    const endpoints = [...routes.values()]
        .map((r) => {
        const sorted = [...r.samples].sort((a, b) => a - b);
        return {
            route: r.route,
            count: r.count,
            errors: r.errors,
            avg_ms: r.count ? Math.round(r.totalMs / r.count) : 0,
            p50_ms: Math.round(percentile(sorted, 50)),
            p95_ms: Math.round(percentile(sorted, 95)),
            max_ms: Math.round(r.maxMs),
        };
    })
        .sort((a, b) => b.avg_ms - a.avg_ms);
    const avgAll = endpoints.reduce((s, e) => s + e.avg_ms * e.count, 0) /
        Math.max(1, endpoints.reduce((s, e) => s + e.count, 0));
    return {
        generado_en: new Date().toISOString(),
        nota: 'Métricas en memoria del proceso API. No se cachean pedidos/caja. Ideal LAN: <50ms GET, mutaciones <100ms.',
        servidor: {
            avg_ms: Math.round(avgAll),
            memoria_rss_mb: Math.round(mem.rss / 1024 / 1024),
            memoria_heap_mb: Math.round(mem.heapUsed / 1024 / 1024),
            uptime_s: Math.round(process.uptime()),
            sockets_conectados: extra?.socketsConectados ?? null,
        },
        impresion: {
            pendientes: countPendingPrintJobs(),
            completadas: printCompleted,
            errores: printErrors,
            avg_cola_a_envio_ms: printQueueToSentCount
                ? Math.round(printTotalQueueToSentMs / printQueueToSentCount)
                : null,
            activas: [...printActive.values()].map((j) => ({
                job_id: j.jobId,
                destino: j.destino,
                estado: j.estado,
                retries: j.retries,
                edad_ms: Date.now() - j.queuedAt,
            })),
            recientes: printHistory.slice(0, 20).map((j) => ({
                job_id: j.jobId,
                destino: j.destino,
                estado: j.estado,
                retries: j.retries,
                cola_a_envio_ms: j.sentAt != null ? j.sentAt - j.queuedAt : null,
                total_ms: j.finishedAt != null ? j.finishedAt - j.queuedAt : null,
                error: j.error ?? null,
            })),
        },
        endpoints: endpoints.slice(0, 40),
    };
}
//# sourceMappingURL=latency-metrics.js.map