import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreditosService } from './creditos.service';
import { CrearCuentaCreditoDto } from './dto/crear-cuenta-credito.dto';
import { AbonoCuentaCreditoDto } from './dto/abono-cuenta-credito.dto';

@Controller('creditos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreditosController {
  constructor(private readonly creditos: CreditosService) {}

  @Get()
  @Roles('admin', 'mesero')
  listar(@Query('todos') todos?: string) {
    return this.creditos.listar(todos !== '1' && todos !== 'true');
  }

  @Post()
  @Roles('admin', 'mesero')
  crear(@Body() dto: CrearCuentaCreditoDto, @Req() req: { user: { id: number } }) {
    return this.creditos.crear(dto, req.user.id);
  }

  @Patch(':id/abono')
  @Roles('admin', 'mesero')
  abono(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AbonoCuentaCreditoDto,
  ) {
    return this.creditos.registrarAbono(id, dto);
  }
}
