import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeseroDto } from './dto/create-mesero.dto';
import { PatchUsuarioDto } from './dto/patch-usuario.dto';
import { emailMeseroDesdeNombre } from './email-mesero';
import { nombreUsuarioPublico } from './usuario-display';
import { validarDesactivarUsuario } from '@la-reserva/shared-domain/mesa-admin-validacion';

const PEDIDOS_ABIERTOS = ['abierto', 'en_cocina'] as const;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    const rows = await this.prisma.usuario.findMany({
      include: { rol: true },
      orderBy: { idUsuario: 'asc' },
    });
    return rows.map((u) => {
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
        activo: u.activo,
        creado_en: u.creadoEn,
      };
    });
  }

  async crearMesero(dto: CreateMeseroDto) {
    const rolMesero = await this.prisma.rol.findFirst({
      where: { nombre: 'mesero' },
    });
    if (!rolMesero) {
      throw new NotFoundException('Rol mesero no configurado');
    }
    const email = await this.resolverEmailMesero(
      dto.email?.trim().toLowerCase(),
      dto.nombre,
    );
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const u = await this.prisma.usuario.create({
      data: {
        idRol: rolMesero.idRol,
        nombre: dto.nombre.trim(),
        apellido: dto.apellido.trim(),
        email,
        passwordHash,
        activo: true,
      },
      include: { rol: true },
    });
    return this.mapOne(u);
  }

  /** Correo automático primernombre@lareserva.local; sufijo numérico si ya existe. */
  private async resolverEmailMesero(
    emailManual: string | undefined,
    nombre: string,
  ): Promise<string> {
    if (emailManual) {
      const exists = await this.prisma.usuario.findUnique({
        where: { email: emailManual },
      });
      if (exists) {
        throw new ConflictException('Ya existe un usuario con ese correo');
      }
      return emailManual;
    }
    const base = emailMeseroDesdeNombre(nombre);
    const localBase = base.split('@')[0] ?? 'mesero';
    let candidato = base;
    let n = 2;
    while (
      await this.prisma.usuario.findUnique({ where: { email: candidato } })
    ) {
      candidato = emailMeseroDesdeNombre(nombre, String(n));
      n += 1;
      if (n > 99) {
        candidato = `${localBase}.${Date.now()}@lareserva.local`;
        break;
      }
    }
    return candidato;
  }

  async actualizar(
    idUsuario: number,
    dto: PatchUsuarioDto,
    actorId: number,
  ) {
    const target = await this.prisma.usuario.findUnique({
      where: { idUsuario },
      include: { rol: true },
    });
    if (!target) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (target.rol.nombre === 'admin') {
      throw new ForbiddenException('No se puede modificar cuentas de administrador desde aquí');
    }
    if (dto.activo === false && idUsuario === actorId) {
      throw new ForbiddenException('No puedes desactivar tu propia sesión');
    }
    if (dto.activo === false) {
      const pedidosActivos = await this.prisma.pedido.count({
        where: {
          idUsuario,
          estado: { in: [...PEDIDOS_ABIERTOS] },
        },
      });
      const validacion = validarDesactivarUsuario({ pedidosActivos });
      if (!validacion.ok) {
        throw new ConflictException(validacion.mensaje);
      }
    }

    const data: { activo?: boolean; passwordHash?: string } = {};
    if (dto.activo !== undefined) {
      data.activo = dto.activo;
    }
    if (dto.password?.trim()) {
      data.passwordHash = await bcrypt.hash(dto.password.trim(), 10);
    }
    if (Object.keys(data).length === 0) {
      return this.mapOne(target);
    }

    const u = await this.prisma.usuario.update({
      where: { idUsuario },
      data,
      include: { rol: true },
    });
    return this.mapOne(u);
  }

  private mapOne(u: {
    idUsuario: number;
    nombre: string;
    apellido: string;
    email: string;
    activo: boolean;
    creadoEn: Date;
    rol: { nombre: string };
  }) {
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
      activo: u.activo,
      creado_en: u.creadoEn,
    };
  }
}
