import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Usuario } from '@prisma/client';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { nombreUsuarioPublico } from '../usuarios/usuario-display';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request & { user: Usuario & { rol: { nombre: string } } }) {
    const u = req.user;
    const { nombre, apellido } = nombreUsuarioPublico(
      u.nombre,
      u.apellido,
      u.rol.nombre,
    );
    return {
      id: u.idUsuario,
      nombre,
      apellido,
      email: u.email,
      rol: u.rol.nombre,
    };
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  refresh(@Req() req: Request & { user: Usuario & { rol: { nombre: string } } }) {
    return this.auth.refresh(req.user);
  }

  /** Confirma la contraseña del admin (p. ej. habilitar acciones de prueba en caja). */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('verify-password')
  verifyPassword(
    @Body() dto: VerifyPasswordDto,
    @Req() req: Request & { user: Usuario },
  ) {
    return this.auth.verifyPassword(req.user, dto.password);
  }
}
