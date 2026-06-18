import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /** Raíz: útil al probar http://IP:3000/ en el navegador (sin “Cannot GET /”). */
  @Get()
  root() {
    return {
      ok: true,
      service: 'la-reserva-api',
      health: '/health',
    };
  }

  @Get('health')
  health() {
    return { ok: true, service: 'la-reserva-api' };
  }
}
