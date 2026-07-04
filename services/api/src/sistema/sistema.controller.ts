import { Controller, Get, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { detectarRedLocal, leerPuertoWeb, PUERTO_WEB_POR_DEFECTO } from './red-local';

@Controller('sistema')
export class SistemaController {
  /** IP y URLs para que meseros abran la app en el celular (misma red local). */
  @SkipThrottle()
  @Get('conexion-celulares')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  conexionCelulares() {
    const red = detectarRedLocal();
    const apiPort = Number(process.env.PORT ?? 3000);
    const webPort = leerPuertoWeb();
    const ip = red?.ip ?? null;
    const avisos = [
      'Los celulares deben estar en la misma red Wi-Fi (o Ethernet al mismo router). No uses redes virtuales (192.168.56.x).',
    ];
    if (webPort !== PUERTO_WEB_POR_DEFECTO) {
      avisos.unshift(
        `El puerto ${PUERTO_WEB_POR_DEFECTO} estaba ocupado; la app web usa el puerto ${webPort}.`,
      );
    }

    return {
      ip,
      adaptador: red?.adaptador ?? null,
      tipo_red: red?.tipo ?? null,
      puerto_api: apiPort,
      puerto_web: webPort,
      puerto_web_por_defecto: PUERTO_WEB_POR_DEFECTO,
      url_api: ip ? `http://${ip}:${apiPort}` : null,
      url_web_celular: ip ? `http://${ip}:${webPort}` : null,
      url_web_local: `http://localhost:${webPort}`,
      health_celular: ip ? `http://${ip}:${apiPort}/health` : null,
      aviso: avisos.join(' '),
    };
  }
}
