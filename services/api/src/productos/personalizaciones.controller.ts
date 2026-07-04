import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  CreatePersonalizacionDto,
  UpdatePersonalizacionDto,
} from './dto/personalizacion.dto';
import { PersonalizacionesService } from './personalizaciones.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class PersonalizacionesController {
  constructor(private readonly personalizaciones: PersonalizacionesService) {}

  @Get('productos/:idProducto/personalizaciones')
  listar(@Param('idProducto', ParseIntPipe) idProducto: number) {
    return this.personalizaciones.listarPorProducto(idProducto);
  }

  @Post('productos/:idProducto/personalizaciones')
  crear(
    @Param('idProducto', ParseIntPipe) idProducto: number,
    @Body() dto: CreatePersonalizacionDto,
  ) {
    return this.personalizaciones.crear(idProducto, dto);
  }

  @Patch('personalizaciones/:idOpcion')
  actualizar(
    @Param('idOpcion', ParseIntPipe) idOpcion: number,
    @Body() dto: UpdatePersonalizacionDto,
  ) {
    return this.personalizaciones.actualizar(idOpcion, dto);
  }

  @Delete('personalizaciones/:idOpcion')
  eliminar(@Param('idOpcion', ParseIntPipe) idOpcion: number) {
    return this.personalizaciones.eliminar(idOpcion);
  }
}
