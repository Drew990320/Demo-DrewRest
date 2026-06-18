import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { EstadoPapel } from './escpos-paper-status';

const execFileAsync = promisify(execFile);

/**
 * Lee DetectedErrorState de Win32_Printer (3 = papel bajo, 4 = sin papel).
 * Solo Windows; requiere impresora instalada por nombre.
 */
export async function consultarPapelWindows(
  printerName: string,
): Promise<EstadoPapel | null> {
  if (process.platform !== 'win32') return null;

  const escaped = printerName.replace(/'/g, "''");
  const ps = `
$p = Get-CimInstance Win32_Printer -Filter "Name='${escaped}'" -ErrorAction SilentlyContinue
if (-not $p) { Write-Output "UNKNOWN"; exit 0 }
Write-Output $p.DetectedErrorState
`.trim();

  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps],
      { timeout: 8000, windowsHide: true },
    );
    const raw = stdout.trim();
    if (raw === 'UNKNOWN' || raw === '') return null;
    const state = Number(raw);
    if (!Number.isFinite(state)) return null;
    return {
      sinPapel: state === 4,
      papelBajo: state === 3,
    };
  } catch {
    return null;
  }
}
