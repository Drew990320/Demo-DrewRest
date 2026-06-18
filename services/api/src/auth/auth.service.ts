import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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
}
