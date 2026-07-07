import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Usuario } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateMeseroDto } from './dto/create-mesero.dto';
import { PatchUsuarioDto } from './dto/patch-usuario.dto';
import { CreateAdminDto, PatchAdminDto } from './dto/admin-usuario.dto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  @Roles('admin')
  listar() {
    return this.usuarios.listar();
  }

  @Post('meseros')
  @Roles('admin')
  crearMesero(
    @Body() dto: CreateMeseroDto,
    @Req() req: Request & { user: Usuario & { rol: { nombre: string } } },
  ) {
    return this.usuarios.crearMesero(dto, req.user);
  }

  @Post('admins')
  @Roles('superadmin')
  crearAdmin(@Body() dto: CreateAdminDto) {
    return this.usuarios.crearAdmin(dto);
  }

  @Get('admins/:id')
  @Roles('superadmin')
  detalleAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.usuarios.detalleAdmin(id);
  }

  @Patch('admins/:id')
  @Roles('superadmin')
  actualizarAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PatchAdminDto,
    @Req() req: Request & { user: Usuario },
  ) {
    return this.usuarios.actualizarAdmin(id, dto, req.user.idUsuario);
  }

  @Patch(':id')
  @Roles('admin')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PatchUsuarioDto,
    @Req() req: Request & { user: Usuario & { rol: { nombre: string } } },
  ) {
    return this.usuarios.actualizar(id, dto, req.user.idUsuario, req.user.rol.nombre);
  }
}
