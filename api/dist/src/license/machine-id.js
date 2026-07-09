"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMachineId = getMachineId;
exports.formatMachineIdDisplay = formatMachineIdDisplay;
const crypto_1 = require("crypto");
const child_process_1 = require("child_process");
const os = __importStar(require("os"));
function normalize(value) {
    const v = (value ?? '').trim().toUpperCase();
    if (!v || v === 'TO BE FILLED BY O.E.M.' || v === 'DEFAULT STRING' || v === 'NONE') {
        return '';
    }
    return v;
}
function runPowerShell(script) {
    try {
        return (0, child_process_1.execFileSync)('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], { encoding: 'utf8', windowsHide: true, timeout: 15_000 }).trim();
    }
    catch {
        return '';
    }
}
function collectWindowsParts() {
    const script = [
        "$ErrorActionPreference = 'SilentlyContinue'",
        "$g = (Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Cryptography' -Name MachineGuid).MachineGuid",
        "$u = (Get-CimInstance Win32_ComputerSystemProduct).UUID",
        "$b = (Get-CimInstance Win32_BaseBoard).SerialNumber",
        "$s = (Get-CimInstance Win32_BIOS).SerialNumber",
        "Write-Output ('GUID=' + $g)",
        "Write-Output ('UUID=' + $u)",
        "Write-Output ('BOARD=' + $b)",
        "Write-Output ('BIOS=' + $s)",
    ].join('; ');
    const out = runPowerShell(script);
    const map = {};
    for (const line of out.split(/\r?\n/)) {
        const i = line.indexOf('=');
        if (i <= 0)
            continue;
        map[line.slice(0, i)] = line.slice(i + 1);
    }
    return [
        normalize(map.GUID),
        normalize(map.UUID),
        normalize(map.BOARD),
        normalize(map.BIOS),
    ].filter(Boolean);
}
function collectFallbackParts() {
    return [
        normalize(os.hostname()),
        normalize(os.userInfo().username),
        normalize(os.arch()),
        normalize(os.platform()),
    ].filter(Boolean);
}
function getMachineId() {
    const parts = process.platform === 'win32' ? collectWindowsParts() : collectFallbackParts();
    const material = parts.length > 0 ? parts.join('|') : `fallback|${os.hostname()}`;
    return (0, crypto_1.createHash)('sha256').update(material, 'utf8').digest('hex');
}
function formatMachineIdDisplay(machineId) {
    const short = machineId.slice(0, 16).toUpperCase();
    return short.match(/.{1,4}/g)?.join('-') ?? short;
}
//# sourceMappingURL=machine-id.js.map