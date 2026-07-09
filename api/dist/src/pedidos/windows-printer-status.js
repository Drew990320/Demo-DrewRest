"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultarPapelWindows = consultarPapelWindows;
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
async function consultarPapelWindows(printerName) {
    if (process.platform !== 'win32')
        return null;
    const escaped = printerName.replace(/'/g, "''");
    const ps = `
$p = Get-CimInstance Win32_Printer -Filter "Name='${escaped}'" -ErrorAction SilentlyContinue
if (-not $p) { Write-Output "UNKNOWN"; exit 0 }
Write-Output $p.DetectedErrorState
`.trim();
    try {
        const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps], { timeout: 8000, windowsHide: true });
        const raw = stdout.trim();
        if (raw === 'UNKNOWN' || raw === '')
            return null;
        const state = Number(raw);
        if (!Number.isFinite(state))
            return null;
        return {
            sinPapel: state === 4,
            papelBajo: state === 3,
        };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=windows-printer-status.js.map