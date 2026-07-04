import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Usuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { nombreUsuarioPublico } from '../usuarios/usuario-display';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      include: { rol: true },
    });
    if (!user?.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const payload = {
      sub: user.idUsuario,
      email: user.email,
      rol: user.rol.nombre,
    };
    const { nombre, apellido } = nombreUsuarioPublico(
      user.nombre,
      user.apellido,
      user.rol.nombre,
    );
    return {
      access_token: await this.jwt.signAsync(payload),
      user: {
        id: user.idUsuario,
        nombre,
        apellido,
        email: user.email,
        rol: user.rol.nombre,
      },
    };
  }

  async verifyPassword(user: Usuario, password: string) {
    const row = await this.prisma.usuario.findUnique({
      where: { idUsuario: user.idUsuario },
    });
    if (!row?.activo) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }
    const ok = await bcrypt.compare(password, row.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }
    return { ok: true };
  }
}
