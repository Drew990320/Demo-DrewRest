import {
  Body,
  Controller,
  Get,
  Patch,
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
  AsignarDelegacionCierreDto,
  PatchPermisosMeseroDto,
} from './dto/permisos.dto';
import { PermisosService } from './permisos.service';

@Controller('permisos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermisosController {
  constructor(private readonly permisos: PermisosService) {}

  @Get('efectivos')
  @Roles('admin', 'mesero', 'chef')
  efectivos(
    @Req() req: Request & { user: Usuario & { rol: { nombre: string } } },
  ) {
    return this.permisos.getEfectivos(req.user.idUsuario, req.user.rol.nombre);
  }

  @Get('resumen')
  @Roles('admin')
  resumen(@Query('fecha') fecha?: string) {
    return this.permisos.resumenAdmin(fecha);
  }

  @Patch('mesero')
  @Roles('admin')
  actualizarMesero(@Body() dto: PatchPermisosMeseroDto) {
    return this.permisos.actualizarConfig(dto);
  }

  @Put('delegacion/cierre-anulacion')
  @Roles('admin')
  delegacionCierre(
    @Body() dto: AsignarDelegacionCierreDto,
    @Req() req: Request & { user: Usuario },
  ) {
    return this.permisos.asignarDelegacionCierre(dto, req.user.idUsuario);
  }
}
