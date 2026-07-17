"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectarImpresorasSistema = detectarImpresorasSistema;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
function esImpresoraVirtual(nombre) {
    return /pdf|fax|onenote|xps|onedrive|microsoft print to pdf|adobe pdf|enviar a onenote|virtual/i.test(nombre);
}
async function detectarImpresorasSistema() {
    if (process.platform !== 'win32') {
        return [];
    }
    const out = [];
    try {
        const { stdout } = await execFileAsync('powershell.exe', [
            '-NoProfile',
            '-Command',
            "Get-Printer | Select-Object Name, PrinterStatus | ConvertTo-Json -Compress",
        ], { timeout: 15_000, windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
        const raw = stdout.trim();
        if (raw) {
            const parsed = JSON.parse(raw);
            const rows = Array.isArray(parsed) ? parsed : [parsed];
            for (const row of rows) {
                const name = String(row.Name ?? '').trim();
                if (!name)
                    continue;
                out.push({
                    tipo: 'windows',
                    nombre: name,
                    destino: `printer:${name}`,
                    estado: row.PrinterStatus != null ? String(row.PrinterStatus) : null,
                    virtual: esImpresoraVirtual(name),
                });
            }
        }
    }
    catch {
    }
    try {
        const { stdout } = await execFileAsync('powershell.exe', [
            '-NoProfile',
            '-Command',
            "[System.IO.Ports.SerialPort]::GetPortNames() | ConvertTo-Json -Compress",
        ], { timeout: 10_000, windowsHide: true });
        const raw = stdout.trim();
        if (raw) {
            const parsed = JSON.parse(raw);
            const ports = Array.isArray(parsed) ? parsed : [parsed];
            for (const p of ports) {
                const name = String(p ?? '').trim().toUpperCase();
                if (!/^COM\d+$/i.test(name))
                    continue;
                out.push({
                    tipo: 'com',
                    nombre: name,
                    destino: name,
                    estado: null,
                });
            }
        }
    }
    catch {
    }
    return out;
}
//# sourceMappingURL=impresoras-pos.detect.js.map