import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { normalizarPermisosAdmin } from '@la-reserva/shared-domain/permisos-admin';
import {
  esAdminRestaurante,
  esSuperadmin,
  SUPERADMIN_EMAIL,
} from '@la-reserva/shared-domain/roles';
import { PrismaService } from '../prisma/prisma.service';
import { invalidateAuthUser } from '../auth/auth-user-cache';
import { PedidosGateway } from '../pedidos/pedidos.gateway';
import { CreateMeseroDto } from './dto/create-mesero.dto';
import { PatchUsuarioDto } from './dto/patch-usuario.dto';
import { CreateAdminDto, PatchAdminDto } from './dto/admin-usuario.dto';
import { emailMeseroDesdeNombre } from './email-mesero';
import { nombreUsuarioPublico } from './usuario-display';
import { validarDesactivarUsuario } from '@la-reserva/shared-domain/mesa-admin-validacion';
import { restaurantEmailSuffix } from '../common/restaurant-branding';
import { AdminAccessService } from './admin-access.service';

const PEDIDOS_ABIERTOS = ['abierto', 'en_cocina'] as const;

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: PedidosGateway,
    private readonly adminAccess: AdminAccessService,
  ) {}

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

  async crearMesero(
    dto: CreateMeseroDto,
    actor?: { idUsuario: number; rol: { nombre: string } },
  ) {
    if (actor && !esSuperadmin(actor.rol.nombre)) {
      const cap = await this.adminAccess.capacidadesParaUsuario(
        actor.idUsuario,
        actor.rol.nombre,
      );
      this.adminAccess.assertCapacidadAdmin(
        actor.rol.nombre,
        cap.permisos_admin,
        'usuarios',
      );
    }
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
        passwordCambiadoEn: new Date(),
        activo: true,
      },
      include: { rol: true },
    });
    return this.mapOne(u);
  }

  /** Correo automático primernombre@restaurant.local; sufijo numérico si ya existe. */
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
        candidato = `${localBase}.${Date.now()}${restaurantEmailSuffix()}`;
        break;
      }
    }
    return candidato;
  }

  async actualizar(
    idUsuario: number,
    dto: PatchUsuarioDto,
    actorId: number,
    actorRol?: string,
  ) {
    const target = await this.prisma.usuario.findUnique({
      where: { idUsuario },
      include: { rol: true },
    });
    if (!target) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (
      (target.rol.nombre === 'admin' || target.rol.nombre === 'superadmin') &&
      !esSuperadmin(actorRol)
    ) {
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

    const data: {
      activo?: boolean;
      passwordHash?: string;
      passwordCambiadoEn?: Date;
    } = {};
    if (dto.activo !== undefined) {
      data.activo = dto.activo;
    }
    if (dto.password?.trim()) {
      data.passwordHash = await bcrypt.hash(dto.password.trim(), 10);
      data.passwordCambiadoEn = new Date();
    }
    if (Object.keys(data).length === 0) {
      return this.mapOne(target);
    }

    const u = await this.prisma.usuario.update({
      where: { idUsuario },
      data,
      include: { rol: true },
    });
    invalidateAuthUser(idUsuario);
    if (dto.activo === false) {
      this.gateway.emitAuthSesionInvalidada(
        idUsuario,
        'desactivado',
        'Un administrador desactivó tu acceso.',
      );
    }
    if (dto.password?.trim()) {
      this.gateway.emitAuthSesionInvalidada(
        idUsuario,
        'credenciales',
        'Tu contraseña fue actualizada. Inicia sesión de nuevo.',
      );
    }
    return this.mapOne(u);
  }

  async crearAdmin(dto: CreateAdminDto) {
    const email = dto.email.trim().toLowerCase();
    if (email === SUPERADMIN_EMAIL) {
      throw new ConflictException('Este correo está reservado para el superadmin');
    }
    const exists = await this.prisma.usuario.findUnique({ where: { email } });
    if (exists) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }
    const rolAdmin = await this.prisma.rol.findFirst({ where: { nombre: 'admin' } });
    if (!rolAdmin) {
      throw new NotFoundException('Rol admin no configurado');
    }
    const horarios = dto.horarios ?? [];
    const permisos = normalizarPermisosAdmin(dto.permisos);
    this.adminAccess.validarHorarios(horarios);

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const u = await this.prisma.$transaction(async (tx) => {
      const created = await tx.usuario.create({
        data: {
          idRol: rolAdmin.idRol,
          nombre: dto.nombre.trim(),
          apellido: dto.apellido.trim(),
          email,
          passwordHash,
          passwordCambiadoEn: new Date(),
          activo: true,
        },
        include: { rol: true },
      });
      await this.adminAccess.syncHorariosEnTx(tx, created.idUsuario, horarios);
      await this.adminAccess.syncPermisosEnTx(tx, created.idUsuario, permisos);
      return created;
    });
    return this.mapAdminDetalle(u.idUsuario);
  }

  async detalleAdmin(idUsuario: number) {
    const u = await this.prisma.usuario.findUnique({
      where: { idUsuario },
      include: { rol: true },
    });
    if (!u || !esAdminRestaurante(u.rol.nombre)) {
      throw new NotFoundException('Administrador no encontrado');
    }
    return this.mapAdminDetalle(idUsuario);
  }

  async actualizarAdmin(idUsuario: number, dto: PatchAdminDto, actorId: number) {
    const target = await this.prisma.usuario.findUnique({
      where: { idUsuario },
      include: { rol: true },
    });
    if (!target || !esAdminRestaurante(target.rol.nombre)) {
      throw new NotFoundException('Administrador no encontrado');
    }
    if (dto.activo === false && idUsuario === actorId) {
      throw new ForbiddenException('No puedes desactivar tu propia sesión');
    }

    const data: {
      activo?: boolean;
      passwordHash?: string;
      passwordCambiadoEn?: Date;
      nombre?: string;
      apellido?: string;
    } = {};
    if (dto.activo !== undefined) data.activo = dto.activo;
    if (dto.nombre?.trim()) data.nombre = dto.nombre.trim();
    if (dto.apellido !== undefined) data.apellido = dto.apellido.trim();
    if (dto.password?.trim()) {
      data.passwordHash = await bcrypt.hash(dto.password.trim(), 12);
      data.passwordCambiadoEn = new Date();
    }

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.usuario.update({ where: { idUsuario }, data });
      }
      if (dto.horarios) {
        await this.adminAccess.syncHorariosEnTx(tx, idUsuario, dto.horarios);
      }
      if (dto.permisos) {
        await this.adminAccess.syncPermisosEnTx(
          tx,
          idUsuario,
          normalizarPermisosAdmin(dto.permisos),
        );
      }
    });

    invalidateAuthUser(idUsuario);
    if (dto.activo === false) {
      this.gateway.emitAuthSesionInvalidada(
        idUsuario,
        'desactivado',
        'Un superadministrador desactivó tu acceso.',
      );
    }
    if (dto.password?.trim()) {
      this.gateway.emitAuthSesionInvalidada(
        idUsuario,
        'credenciales',
        'Tu contraseña fue actualizada. Inicia sesión de nuevo.',
      );
    }
    return this.mapAdminDetalle(idUsuario);
  }

  private async mapAdminDetalle(idUsuario: number) {
    const u = await this.prisma.usuario.findUniqueOrThrow({
      where: { idUsuario },
      include: { rol: true },
    });
    const cap = await this.adminAccess.capacidadesParaUsuario(
      idUsuario,
      u.rol.nombre,
    );
    return {
      ...this.mapOne(u),
      horarios_acceso: cap.horarios_acceso,
      permisos_admin: cap.permisos_admin,
    };
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
