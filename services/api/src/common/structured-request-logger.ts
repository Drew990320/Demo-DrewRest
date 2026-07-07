import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { NextFunction, Request, Response } from 'express';

function logFilePath(): string | null {
  const dir = process.env.LOG_DIR?.trim() || 'logs';
  const enabled = process.env.STRUCTURED_LOGS?.trim();
  if (enabled === '0' || enabled?.toLowerCase() === 'false') return null;
  try {
    mkdirSync(dir, { recursive: true });
    const day = new Date().toISOString().slice(0, 10);
    return join(dir, `api-${day}.log`);
  } catch {
    return null;
  }
}

/** Registra cada petición HTTP como JSON (stdout + archivo diario opcional). */
export function structuredRequestLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const entry = {
        ts: new Date().toISOString(),
        level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        ms: Date.now() - start,
        ip: req.ip,
      };
      const line = `${JSON.stringify(entry)}\n`;
      process.stdout.write(line);
      const file = logFilePath();
      if (file) {
        try {
          appendFileSync(file, line, 'utf8');
        } catch {
          // no bloquear la API si el disco falla
        }
      }
    });
    next();
  };
}
