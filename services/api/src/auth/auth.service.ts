import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Usuario } from '@prisma/client';
import { esAdminRestaurante } from '@la-reserva/shared-domain/roles';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAccessService } from '../usuarios/admin-access.service';
import { LoginDto } from './dto/login.dto';
import { nombreUsuarioPublico } from '../usuarios/usuario-display';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly adminAccess: AdminAccessService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      include: { rol: true },
    });
    if (!user?.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (esAdminRestaurante(user.rol.nombre)) {
      await this.adminAccess.assertAccesoAdminEnHorario(user.idUsuario);
    }
    const capacidades = await this.adminAccess.capacidadesParaUsuario(
      user.idUsuario,
      user.rol.nombre,
    );
    const pwdAt = (user.passwordCambiadoEn ?? user.creadoEn).getTime();
    const payload = {
      sub: user.idUsuario,
      email: user.email,
      rol: user.rol.nombre,
      pwdAt,
    };
    const { nombre, apellido } = nombreUsuarioPublico(
      user.nombre,
      user.apellido,
      user.rol.nombre,
    );
    return {
      access_token: await this.jwt.signAsync(payload),
      expires_in: this.jwtExpiresSeconds(),
      user: {
        id: user.idUsuario,
        nombre,
        apellido,
        email: user.email,
        rol: user.rol.nombre,
        es_superadmin: capacidades.es_superadmin,
        permisos_admin: capacidades.permisos_admin,
      },
    };
  }

  /** Emite un JWT nuevo si la sesión sigue válida (mismo criterio que JwtStrategy). */
  async refresh(actor: Usuario & { rol: { nombre: string } }) {
    const user = await this.prisma.usuario.findUnique({
      where: { idUsuario: actor.idUsuario },
      include: { rol: true },
    });
    if (!user?.activo) {
      throw new UnauthorizedException('Sesión inválida');
    }
    if (esAdminRestaurante(user.rol.nombre)) {
      await this.adminAccess.assertAccesoAdminEnHorario(user.idUsuario);
    }
    const pwdAt = (user.passwordCambiadoEn ?? user.creadoEn).getTime();
    const payload = {
      sub: user.idUsuario,
      email: user.email,
      rol: user.rol.nombre,
      pwdAt,
    };
    return {
      access_token: await this.jwt.signAsync(payload),
      expires_in: this.jwtExpiresSeconds(),
    };
  }

  async me(actor: Usuario & { rol: { nombre: string } }) {
    const capacidades = await this.adminAccess.capacidadesParaUsuario(
      actor.idUsuario,
      actor.rol.nombre,
    );
    const { nombre, apellido } = nombreUsuarioPublico(
      actor.nombre,
      actor.apellido,
      actor.rol.nombre,
    );
    return {
      id: actor.idUsuario,
      nombre,
      apellido,
      email: actor.email,
      rol: actor.rol.nombre,
      es_superadmin: capacidades.es_superadmin,
      permisos_admin: capacidades.permisos_admin,
      horarios_acceso: capacidades.horarios_acceso,
    };
  }

  private jwtExpiresSeconds(): number {
    const raw = process.env.JWT_EXPIRES_IN?.trim() ?? '24h';
    const m = /^(\d+)([smhd])$/i.exec(raw);
    if (!m) return 86_400;
    const n = Number(m[1]);
    const unit = m[2].toLowerCase();
    const mult =
      unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86_400;
    return n * mult;
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
