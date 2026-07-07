import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { NextFunction, Request, Response } from 'express';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { resolveCorsOrigin } from './common/cors-origins';
import { structuredRequestLogger } from './common/structured-request-logger';
import { PrismaClientExceptionFilter } from './filters/prisma-client-exception.filter';
import { MulterExceptionFilter } from './filters/multer-exception.filter';
import { assertValidLicense } from './license/assert-license';

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

function parseBodyLimit(): string {
  const raw = process.env.BODY_LIMIT?.trim();
  if (raw && /^\d+(kb|mb)$/i.test(raw)) return raw.toLowerCase();
  return '256kb';
}

function parseRequestTimeoutMs(): number {
  const raw = process.env.REQUEST_TIMEOUT_MS?.trim();
  if (raw && /^\d+$/.test(raw)) {
    const n = Number(raw);
    if (n >= 5_000 && n <= 120_000) return n;
  }
  return 30_000;
}

function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  next();
}

function requestTimeout(ms: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.setTimeout(ms);
    res.setTimeout(ms);
    next();
  };
}

async function bootstrap() {
  assertValidLicense();
  const bodyLimit = parseBodyLimit();
  const requestTimeoutMs = parseRequestTimeoutMs();

  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(structuredRequestLogger());
  app.use(securityHeaders);
  app.use(requestTimeout(requestTimeoutMs));
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));
  app.useGlobalFilters(
    new PrismaClientExceptionFilter(),
    new MulterExceptionFilter(),
  );
  app.useWebSocketAdapter(new IoAdapter(app));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  // LAN: por defecto acepta cualquier origen. En producción define CORS_ORIGINS (coma-separados).
  app.enableCors({ origin: resolveCorsOrigin(), credentials: true });
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  console.log(`API http://localhost:${port} (LAN: http://<tu-ip>:${port})`);
}
bootstrap();
