import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';

@SkipThrottle()
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  /** Raíz: útil al probar http://IP:3000/ en el navegador (sin “Cannot GET /”). */
  @Get()
  root() {
    return {
      ok: true,
      service: 'la-reserva-api',
      health: '/health',
      ready: '/health/ready',
    };
  }

  /** Liveness: proceso vivo (monitoreo / scripts de arranque). */
  @Get('health')
  health() {
    return { ok: true, service: 'la-reserva-api' };
  }

  /** Readiness: proceso + BD respondiendo. */
  @Get('health/ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, service: 'la-reserva-api', db: true };
    } catch {
      throw new ServiceUnavailableException({
        ok: false,
        service: 'la-reserva-api',
        db: false,
        message: 'Base de datos no disponible',
      });
    }
  }
}
