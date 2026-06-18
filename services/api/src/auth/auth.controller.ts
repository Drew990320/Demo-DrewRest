import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Usuario } from '@prisma/client';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
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
}
