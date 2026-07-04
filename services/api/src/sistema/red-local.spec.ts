import { existsSync, writeFileSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  leerPuertoWeb,
  leerPuertoWebDesdeArchivo,
  PUERTO_WEB_POR_DEFECTO,
} from './red-local';

describe('leerPuertoWeb', () => {
  const prevWebPort = process.env.WEB_PORT;
  let tempRoot: string;

  beforeEach(() => {
    delete process.env.WEB_PORT;
    tempRoot = join(tmpdir(), `lareserva-web-port-${Date.now()}`);
    mkdirSync(join(tempRoot, 'LaReserva', 'LaReserva', 'web'), {
      recursive: true,
    });
  });

  afterEach(() => {
    if (prevWebPort === undefined) delete process.env.WEB_PORT;
    else process.env.WEB_PORT = prevWebPort;
    try {
      rmSync(tempRoot, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it('lee web-port.txt en layout LaReserva/LaReserva/web', () => {
    const portFile = join(tempRoot, 'LaReserva', 'LaReserva', 'web', 'web-port.txt');
    writeFileSync(portFile, '8082', 'utf8');
    expect(leerPuertoWebDesdeArchivo(tempRoot)).toBe(8082);
  });

  it('prioriza WEB_PORT del entorno', () => {
    process.env.WEB_PORT = '8090';
    expect(leerPuertoWeb()).toBe(8090);
  });

  it('devuelve null si no hay archivo en esa raíz', () => {
    expect(leerPuertoWebDesdeArchivo(tempRoot)).toBeNull();
  });
});
