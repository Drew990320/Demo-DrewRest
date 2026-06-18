import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import {
  getCachedAuthUser,
  setCachedAuthUser,
} from './auth-user-cache';

export type JwtPayload = {
  sub: number;
  email: string;
  rol: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const id = Number(payload.sub);
    if (!Number.isFinite(id)) {
      throw new UnauthorizedException('Token inválido');
    }
    const cached = getCachedAuthUser(id);
    if (cached?.activo) {
      return cached;
    }
    const user = await this.prisma.usuario.findUnique({
      where: { idUsuario: id },
      include: { rol: true },
    });
    if (!user?.activo) {
      throw new UnauthorizedException('Usuario inactivo o inexistente');
    }
    setCachedAuthUser(user);
    return user;
  }
}
