"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsService = void 0;
const promises_1 = require("fs/promises");
const logs_paths_1 = require("./logs-paths");
const MAX_BYTES = 512_000;
const MAX_LINEAS = 500;
const REDACT_PATTERNS = [
    /("password"\s*:\s*")[^"]*(")/gi,
    /("token"\s*:\s*")[^"]*(")/gi,
    /("refresh_token"\s*:\s*")[^"]*(")/gi,
    /(Bearer\s+)\S+/gi,
    /(authorization"\s*:\s*")[^"]*(")/gi,
];
function redactLine(line) {
    let s = line;
    for (const re of REDACT_PATTERNS) {
        s = s.replace(re, (_m, p1, p2) => (p2 ? `${p1}***${p2}` : `${p1}***`));
    }
    return s;
}
async function readTailText(filePath, maxBytes = MAX_BYTES) {
    const info = await (0, promises_1.stat)(filePath);
    if (info.size <= maxBytes) {
        return { text: await (0, promises_1.readFile)(filePath, 'utf8'), truncado: false };
    }
    const fh = await (0, promises_1.open)(filePath, 'r');
    try {
        const buf = Buffer.alloc(maxBytes);
        await fh.read(buf, 0, maxBytes, info.size - maxBytes);
        return { text: buf.toString('utf8'), truncado: true };
    }
    finally {
        await fh.close();
    }
}
function splitLines(text) {
    return text.split(/\r?\n/).filter((l) => l.length > 0);
}
function parseApiLine(line) {
    try {
        const o = JSON.parse(line);
        const nivel = o.level ?? null;
        const ts = o.ts ?? null;
        const resumen = [o.method, o.path, o.status != null ? String(o.status) : null, o.ms != null ? `${o.ms}ms` : null]
            .filter(Boolean)
            .join(' ');
        return { texto: resumen || line, nivel, ts };
    }
    catch {
        return { texto: line, nivel: null, ts: null };
    }
}
function parseLauncherLine(line) {
    const m = line.match(/^\[([^\]]+)\]\s+\[(INFO|WARN|ERROR)\]\s+(.*)$/);
    if (!m)
        return { texto: line, nivel: null, ts: null };
    const nivel = m[2].toLowerCase();
    return { texto: m[3], nivel, ts: m[1] };
}
function parseLifecycleLine(line) {
    try {
        const o = JSON.parse(line);
        const texto = [o.phase, o.message].filter(Boolean).join(' — ') || line;
        return { texto, nivel: o.level ?? null, ts: o.ts ?? null };
    }
    catch {
        return { texto: line, nivel: null, ts: null };
    }
}
function matchesNivel(nivel, filtro) {
    if (!filtro || filtro === 'todos')
        return true;
    if (!nivel)
        return filtro === 'info';
    return nivel.toLowerCase() === filtro.toLowerCase();
}
function matchesBusqueda(texto, q) {
    if (!q?.trim())
        return true;
    return texto.toLowerCase().includes(q.trim().toLowerCase());
}
class LogsService {
    async listarFuentes() {
        const layout = (0, logs_paths_1.resolveLogsLayout)();
        const fuentes = [];
        let apiFiles = [];
        if ((0, logs_paths_1.fileExists)(layout.apiLogDir)) {
            try {
                const names = await (0, promises_1.readdir)(layout.apiLogDir);
                apiFiles = names
                    .filter((n) => /^api-\d{4}-\d{2}-\d{2}\.log$/.test(n))
                    .sort()
                    .reverse()
                    .map((n) => n.replace(/^api-/, '').replace(/\.log$/, ''));
            }
            catch {
                apiFiles = [];
            }
        }
        fuentes.push({
            id: 'api',
            etiqueta: 'API (peticiones HTTP)',
            disponible: apiFiles.length > 0,
            archivos: apiFiles,
        });
        fuentes.push({
            id: 'launcher',
            etiqueta: 'Launcher DrewRest',
            disponible: (0, logs_paths_1.fileExists)(layout.launcherLog),
            archivos: (0, logs_paths_1.fileExists)(layout.launcherLog) ? ['launcher.log'] : [],
        });
        let lifecycleFiles = [];
        if ((0, logs_paths_1.fileExists)(layout.lifecycleLogDir)) {
            try {
                const names = await (0, promises_1.readdir)(layout.lifecycleLogDir);
                lifecycleFiles = names
                    .filter((n) => /^lifecycle-\d{8}\.jsonl$/.test(n))
                    .sort()
                    .reverse()
                    .map((n) => n.replace(/^lifecycle-/, '').replace(/\.jsonl$/, ''));
            }
            catch {
                lifecycleFiles = [];
            }
        }
        fuentes.push({
            id: 'lifecycle',
            etiqueta: 'Ciclo de vida (arranque/updates)',
            disponible: lifecycleFiles.length > 0,
            archivos: lifecycleFiles,
        });
        return {
            generado_en: new Date().toISOString(),
            fuentes,
            nota: 'Solo lectura de archivos locales del servidor. En nube puede faltar launcher/ciclo de vida.',
        };
    }
    async consultar(opts) {
        const layout = (0, logs_paths_1.resolveLogsLayout)();
        const maxLineas = Math.min(Math.max(opts.lineas ?? 200, 1), MAX_LINEAS);
        const filtroNivel = opts.nivel?.trim() || 'todos';
        let filePath = null;
        let archivo = null;
        if (opts.fuente === 'api') {
            const day = opts.fecha?.trim() || new Date().toISOString().slice(0, 10);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
                return {
                    fuente: 'api',
                    archivo: null,
                    existe: false,
                    truncado: false,
                    lineas: [],
                    total_devueltas: 0,
                    mensaje: 'Fecha inválida (use YYYY-MM-DD)',
                };
            }
            const name = `api-${day}.log`;
            archivo = name;
            if (!(0, logs_paths_1.fileExists)(layout.apiLogDir)) {
                return emptyResult('api', name, 'No hay carpeta de logs de la API');
            }
            try {
                filePath = (0, logs_paths_1.assertAllowedApiLogFile)(layout.apiLogDir, name);
            }
            catch {
                return emptyResult('api', name, 'Archivo no permitido');
            }
        }
        else if (opts.fuente === 'launcher') {
            archivo = 'launcher.log';
            if (!(0, logs_paths_1.fileExists)(layout.launcherLog)) {
                return emptyResult('launcher', archivo, 'No hay launcher.log (solo instalación on-prem)');
            }
            filePath = (0, logs_paths_1.assertLauncherLog)(layout.launcherLog, layout.launcherLog);
        }
        else {
            const day = opts.fecha?.trim() ||
                (await this.latestLifecycleDay(layout.lifecycleLogDir));
            if (!day || !/^\d{8}$/.test(day)) {
                return emptyResult('lifecycle', null, 'No hay logs de ciclo de vida');
            }
            const name = `lifecycle-${day}.jsonl`;
            archivo = name;
            if (!(0, logs_paths_1.fileExists)(layout.lifecycleLogDir)) {
                return emptyResult('lifecycle', name, 'No hay carpeta data/logs');
            }
            try {
                filePath = (0, logs_paths_1.assertAllowedLifecycleFile)(layout.lifecycleLogDir, name);
            }
            catch {
                return emptyResult('lifecycle', name, 'Archivo no permitido');
            }
        }
        if (!filePath || !(0, logs_paths_1.fileExists)(filePath)) {
            return emptyResult(opts.fuente, archivo, 'Archivo no encontrado');
        }
        const { text, truncado } = await readTailText(filePath);
        const rawLines = splitLines(text);
        const parse = opts.fuente === 'api'
            ? parseApiLine
            : opts.fuente === 'launcher'
                ? parseLauncherLine
                : parseLifecycleLine;
        const parsed = rawLines
            .map((l) => {
            const redacted = redactLine(l);
            const row = parse(redacted);
            return { ...row, texto: row.texto || redacted };
        })
            .filter((row) => matchesNivel(row.nivel, filtroNivel))
            .filter((row) => matchesBusqueda(`${row.texto} ${row.ts ?? ''}`, opts.busqueda));
        const lineas = parsed.slice(-maxLineas);
        return {
            fuente: opts.fuente,
            archivo,
            existe: true,
            truncado,
            lineas,
            total_devueltas: lineas.length,
            mensaje: truncado
                ? 'Se muestra el final del archivo (archivo grande).'
                : undefined,
        };
    }
    async latestLifecycleDay(dir) {
        if (!(0, logs_paths_1.fileExists)(dir))
            return null;
        try {
            const names = await (0, promises_1.readdir)(dir);
            const sorted = names
                .filter((n) => /^lifecycle-\d{8}\.jsonl$/.test(n))
                .sort()
                .reverse();
            const first = sorted[0];
            return first ? first.replace(/^lifecycle-/, '').replace(/\.jsonl$/, '') : null;
        }
        catch {
            return null;
        }
    }
}
exports.LogsService = LogsService;
function emptyResult(fuente, archivo, mensaje) {
    return {
        fuente,
        archivo,
        existe: false,
        truncado: false,
        lineas: [],
        total_devueltas: 0,
        mensaje,
    };
}
//# sourceMappingURL=logs.service.js.map