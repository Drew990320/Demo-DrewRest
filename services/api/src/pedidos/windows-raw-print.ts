import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const execFileAsync = promisify(execFile);

/**
 * Envía bytes RAW a una impresora instalada en Windows (USB o red).
 * Usa WinSpool API vía PowerShell — no requiere módulos nativos de Node.
 */
export async function printRawWindows(
  printerName: string,
  data: Buffer,
): Promise<void> {
  const tmpDir = os.tmpdir();
  const binPath = path.join(
    tmpDir,
    `lareserva-comanda-${Date.now()}.bin`,
  );
  await fs.promises.writeFile(binPath, data);

  const ps = `
$ErrorActionPreference = 'Stop'
$printerName = ${JSON.stringify(printerName)}
$filePath = ${JSON.stringify(binPath.replace(/\\/g, '\\\\'))}
$bytes = [System.IO.File]::ReadAllBytes($filePath)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrinterHelper {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct DOCINFO {
    [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
  }
  [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);
  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, int Level, ref DOCINFO di);
  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool WritePrinter(IntPtr hPrinter, byte[] pBytes, int dwCount, out int dwWritten);
  public static bool SendBytes(string printer, byte[] bytes) {
    IntPtr h;
    if (!OpenPrinter(printer, out h, IntPtr.Zero)) return false;
    try {
      var di = new DOCINFO { pDocName = "LaReservaComanda", pDataType = "RAW" };
      if (!StartDocPrinter(h, 1, ref di)) return false;
      try {
        if (!StartPagePrinter(h)) return false;
        try {
          int written;
          return WritePrinter(h, bytes, bytes.Length, out written);
        } finally { EndPagePrinter(h); }
      } finally { EndDocPrinter(h); }
    } finally { ClosePrinter(h); }
  }
}
"@

if (-not [RawPrinterHelper]::SendBytes($printerName, $bytes)) {
  throw "WritePrinter falló para impresora: $printerName"
}
Remove-Item -LiteralPath $filePath -Force -ErrorAction SilentlyContinue
Write-Output "OK"
`.trim();

  try {
    await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', ps],
      { timeout: 15000, windowsHide: true },
    );
  } finally {
    await fs.promises.unlink(binPath).catch(() => undefined);
  }
}
