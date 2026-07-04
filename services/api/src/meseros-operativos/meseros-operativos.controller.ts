import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Usuario } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  AplicarSodaAlmuerzoDto,
  AplicarSodaMeseroDto,
  AsignarDelegacionCierreDto,
  UpsertPagoTurnoMeseroDto,
} from './dto/meseros-operativos.dto';
import { MeserosOperativosService } from './meseros-operativos.service';

@Controller('meseros-operativos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MeserosOperativosController {
  constructor(private readonly service: MeserosOperativosService) {}

  @Get('mi-delegacion')
  @Roles('admin', 'mesero')
  miDelegacion(
    @Req() req: Request & { user: Usuario & { rol: { nombre: string } } },
  ) {
    return this.service.miDelegacionHoy(
      req.user.idUsuario,
      req.user.rol.nombre,
    );
  }

  @Get('resumen')
  @Roles('admin')
  resumen(@Query('fecha') fecha?: string) {
    return this.service.resumen(fecha);
  }

  @Post('pago-turno')
  @Roles('admin')
  upsertPagoTurno(
    @Body() dto: UpsertPagoTurnoMeseroDto,
    @Req() req: Request & { user: Usuario },
  ) {
    return this.service.upsertPagoTurno(dto, req.user.idUsuario);
  }

  @Post('soda-almuerzo/aplicar')
  @Roles('admin')
  aplicarSodaTodos(
    @Body() dto: AplicarSodaAlmuerzoDto,
    @Req() req: Request & { user: Usuario },
  ) {
    return this.service.aplicarSodaAlmuerzoTodos(dto, req.user.idUsuario);
  }

  @Post('soda-almuerzo/mesero')
  @Roles('admin')
  aplicarSodaMesero(
    @Body() dto: AplicarSodaMeseroDto,
    @Req() req: Request & { user: Usuario },
  ) {
    return this.service.aplicarSodaAlmuerzoMesero(dto, req.user.idUsuario);
  }

  @Delete('registros/:id')
  @Roles('admin')
  eliminarRegistro(@Param('id', ParseIntPipe) id: number) {
    return this.service.eliminarRegistro(id);
  }

  @Put('delegacion/cierre-anulacion')
  @Roles('admin')
  asignarDelegacionCierre(
    @Body() dto: AsignarDelegacionCierreDto,
    @Req() req: Request & { user: Usuario },
  ) {
    return this.service.asignarDelegacionCierre(dto, req.user.idUsuario);
  }
}
