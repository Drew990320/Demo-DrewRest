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
import { CategoriasService } from './categorias.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Controller('categorias')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CategoriasController {
  constructor(private readonly categorias: CategoriasService) {}

  @Get('admin')
  listarAdmin() {
    return this.categorias.listarTodasAdmin();
  }

  @Post('admin')
  crear(@Body() dto: CreateCategoriaDto) {
    return this.categorias.crear(dto);
  }

  @Patch('admin/:id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoriaDto,
  ) {
    return this.categorias.actualizar(id, dto);
  }

  @Delete('admin/:id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.categorias.eliminar(id);
  }
}
