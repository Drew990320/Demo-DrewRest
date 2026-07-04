import { createHash } from 'crypto';
import { execFileSync } from 'child_process';
import * as os from 'os';

function normalize(value: string | null | undefined): string {
  const v = (value ?? '').trim().toUpperCase();
  if (!v || v === 'TO BE FILLED BY O.E.M.' || v === 'DEFAULT STRING' || v === 'NONE') {
    return '';
  }
  return v;
}

function runPowerShell(script: string): string {
  try {
    return execFileSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
      { encoding: 'utf8', windowsHide: true, timeout: 15_000 },
    ).trim();
  } catch {
    return '';
  }
}

function collectWindowsParts(): string[] {
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
  const map: Record<string, string> = {};
  for (const line of out.split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i <= 0) continue;
    map[line.slice(0, i)] = line.slice(i + 1);
  }

  return [
    normalize(map.GUID),
    normalize(map.UUID),
    normalize(map.BOARD),
    normalize(map.BIOS),
  ].filter(Boolean);
}

function collectFallbackParts(): string[] {
  return [
    normalize(os.hostname()),
    normalize(os.userInfo().username),
    normalize(os.arch()),
    normalize(os.platform()),
  ].filter(Boolean);
}

/**
 * Identificador estable del PC (huella de hardware).
 * En Windows usa MachineGuid + UUID + placa + BIOS.
 */
export function getMachineId(): string {
  const parts =
    process.platform === 'win32' ? collectWindowsParts() : collectFallbackParts();
  const material = parts.length > 0 ? parts.join('|') : `fallback|${os.hostname()}`;
  return createHash('sha256').update(material, 'utf8').digest('hex');
}

/** ID corto para mostrar al cliente (primeros 16 caracteres en grupos). */
export function formatMachineIdDisplay(machineId: string): string {
  const short = machineId.slice(0, 16).toUpperCase();
  return short.match(/.{1,4}/g)?.join('-') ?? short;
}
