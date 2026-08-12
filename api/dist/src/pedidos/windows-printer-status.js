"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultarPapelWindows = consultarPapelWindows;
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
const CACHE_TTL_MS = 30_000;
const cache = new Map();
async function consultarPapelWindows(printerName) {
    if (process.platform !== 'win32')
        return null;
    const key = printerName.trim().toLowerCase();
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now())
        return hit.estado;
    const escaped = printerName.replace(/'/g, "''");
    const ps = `
$p = Get-CimInstance Win32_Printer -Filter "Name='${escaped}'" -ErrorAction SilentlyContinue
if (-not $p) { Write-Output "UNKNOWN"; exit 0 }
Write-Output $p.DetectedErrorState
`.trim();
    let estado = null;
    try {
        const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps], { timeout: 8000, windowsHide: true });
        const raw = stdout.trim();
        if (raw !== 'UNKNOWN' && raw !== '') {
            const state = Number(raw);
            if (Number.isFinite(state)) {
                estado = {
                    sinPapel: state === 4,
                    papelBajo: state === 3,
                };
            }
        }
    }
    catch {
        estado = null;
    }
    cache.set(key, { estado, expiresAt: Date.now() + CACHE_TTL_MS });
    return estado;
}
//# sourceMappingURL=windows-printer-status.js.map