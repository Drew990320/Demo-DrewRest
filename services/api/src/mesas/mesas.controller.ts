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
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
import { MesasService } from './mesas.service';

@Controller('mesas')
@UseGuards(JwtAuthGuard)
export class MesasController {
  constructor(private readonly mesas: MesasService) {}

  /** Listado para la grilla (mesas habilitadas hoy). */
  @SkipThrottle()
  @Get()
  listar() {
    return this.mesas.listarVisiblesHoy();
  }

  /** Catálogo completo + días (solo admin). */
  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  listarAdmin() {
    return this.mesas.listarTodasAdmin();
  }

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  crear(@Body() dto: CreateMesaDto) {
    return this.mesas.crearMesa(dto);
  }

  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMesaDto,
  ) {
    return this.mesas.actualizarMesa(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.mesas.eliminarMesa(id);
  }

  /** Mesa virtual 99: venta rápida de bebidas sin mesa asignada. */
  @Get('mostrador')
  mostrador() {
    return this.mesas.getMostrador();
  }

  /** Mesa virtual 98: pedidos para llevar (empaques, sin mesas 1–15). */
  @Get('para-llevar')
  paraLlevar() {
    return this.mesas.getParaLlevar();
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.mesas.obtenerPorId(id);
  }
}
