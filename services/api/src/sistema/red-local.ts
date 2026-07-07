import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import os from 'os';

export type RedLocalDetectada = {
  ip: string;
  adaptador: string;
  tipo: 'wifi' | 'ethernet' | 'otro';
};

const EXCLUDE =
  /loopback|virtualbox|vmware|hyper-v|vethernet|wsl|docker|virtual|tap|tun|npcap|bluetooth|vpn|host-only|default switch|kernel debug/i;
const WIFI = /wi-?fi|wlan|wireless|802\.11/i;
const ETH = /ethernet|etherneto|área local|lan\b/i;

function ipv4Valida(ip: string): boolean {
  if (ip.startsWith('127.')) return false;
  if (ip.startsWith('169.254.')) return false;
  if (ip.startsWith('192.168.56.')) return false;
  return true;
}

export function detectarRedLocal(): RedLocalDetectada | null {
  const nets = os.networkInterfaces();
  const candidatos: Array<RedLocalDetectada & { prioridad: number }> = [];

  for (const [nombre, addrs] of Object.entries(nets)) {
    if (!addrs || EXCLUDE.test(nombre)) continue;
    const ipv4 = addrs.find((a) => a.family === 'IPv4' && ipv4Valida(a.address));
    if (!ipv4) continue;

    let tipo: RedLocalDetectada['tipo'] = 'otro';
    let prioridad = 1;
    if (WIFI.test(nombre)) {
      tipo = 'wifi';
      prioridad = 3;
    } else if (ETH.test(nombre)) {
      tipo = 'ethernet';
      prioridad = 2;
    }

    candidatos.push({
      ip: ipv4.address,
      adaptador: nombre,
      tipo,
      prioridad,
    });
  }

  if (candidatos.length === 0) return null;
  candidatos.sort((a, b) => b.prioridad - a.prioridad);
  const mejor = candidatos[0];
  return { ip: mejor.ip, adaptador: mejor.adaptador, tipo: mejor.tipo };
}

export const PUERTO_WEB_POR_DEFECTO = 8080;

function leerPuertoDesdeArchivo(filePath: string): number | null {
  if (!existsSync(filePath)) return null;
  try {
    const raw = readFileSync(filePath, 'utf8').trim();
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  } catch {
    /* ignore */
  }
  return null;
}

/** Rutas típicas de web-port.txt (spa-server escribe el puerto real si 8080 está ocupado). */
export function candidatosArchivoPuertoWeb(cwd = process.cwd()): string[] {
  const anchors = [
    cwd,
    join(cwd, '..'),
    join(cwd, '../..'),
    join(cwd, '../../..'),
  ];
  const suffixes = [
    ['web', 'web-port.txt'],
    ['DrewRest', 'web', 'web-port.txt'],
    ['DrewRest', 'DrewRest', 'web', 'web-port.txt'],
    ['LaReserva', 'web', 'web-port.txt'],
    ['LaReserva', 'LaReserva', 'web', 'web-port.txt'],
  ];
  const out: string[] = [];
  for (const anchor of anchors) {
    for (const parts of suffixes) {
      out.push(join(anchor, ...parts));
    }
  }
  return [...new Set(out)];
}

export function leerPuertoWebDesdeArchivo(cwd = process.cwd()): number | null {
  for (const p of candidatosArchivoPuertoWeb(cwd)) {
    const n = leerPuertoDesdeArchivo(p);
    if (n != null) return n;
  }
  return null;
}

export function leerPuertoWeb(): number {
  const fromEnv = Number(process.env.WEB_PORT);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;

  const fromFile = leerPuertoWebDesdeArchivo();
  if (fromFile != null) return fromFile;

  return PUERTO_WEB_POR_DEFECTO;
}
