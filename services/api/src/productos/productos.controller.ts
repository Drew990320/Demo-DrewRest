import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { ProductosService } from './productos.service';

@Controller('productos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ProductosController {
  constructor(private readonly productos: ProductosService) {}

  @Get('categorias')
  categorias() {
    return this.productos.listarCategorias();
  }

  @Get()
  listar(@Query('incluir_inactivos') incluirInactivos?: string) {
    const incluir =
      incluirInactivos === 'true' || incluirInactivos === '1';
    return this.productos.listarProductos(incluir);
  }

  @Post()
  crear(@Body() dto: CreateProductoDto) {
    return this.productos.crear(dto);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductoDto,
  ) {
    return this.productos.actualizar(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.productos.desactivar(id);
  }
}
