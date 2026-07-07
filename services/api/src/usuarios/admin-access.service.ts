import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type {
  HorarioAccesoUsuario,
  PermisosAdminUsuario,
  Prisma,
} from '@prisma/client';
import { DateTime } from 'luxon';
import {
  dentroDeHorarioAcceso,
  diaSemanaValido,
  horaValidaHHmm,
  type HorarioAccesoDia,
} from '@la-reserva/shared-domain/horario-acceso-admin';
import {
  normalizarPermisosAdmin,
  permisosAdminTodos,
  type PermisoAdminKey,
  type PermisosAdminConfig,
} from '@la-reserva/shared-domain/permisos-admin';
import {
  esAdminRestaurante,
  esSuperadmin,
} from '@la-reserva/shared-domain/roles';
import { PrismaService } from '../prisma/prisma.service';

const CAMPO_PERMISO: Record<
  PermisoAdminKey,
  keyof Omit<PermisosAdminUsuario, 'idUsuario'>
> = {
  usuarios: 'permUsuarios',
  permisos: 'permPermisos',
  menu: 'permMenu',
  mesas: 'permMesas',
  configuracion: 'permConfiguracion',
  resumen_diario: 'permResumenDiario',
  creditos: 'permCreditos',
  personalizacion: 'permPersonalizacion',
  meseros_operativos: 'permMeserosOperativos',
  conexion_movil: 'permConexionMovil',
};

@Injectable()
export class AdminAccessService {
  constructor(private readonly prisma: PrismaService) {}

  mapHorarios(rows: HorarioAccesoUsuario[]): HorarioAccesoDia[] {
    return rows.map((h) => ({
      dia_semana: h.diaSemana,
      hora_inicio: h.horaInicio,
      hora_fin: h.horaFin,
    }));
  }

  mapPermisos(row: PermisosAdminUsuario | null): PermisosAdminConfig {
    if (!row) return { ...permisosAdminTodos() };
    const out = permisosAdminTodos();
    for (const k of Object.keys(CAMPO_PERMISO) as PermisoAdminKey[]) {
      out[k] = row[CAMPO_PERMISO[k]];
    }
    return out;
  }

  permisosToPrismaData(
    permisos: PermisosAdminConfig,
  ): Omit<PermisosAdminUsuario, 'idUsuario'> {
    const data = {} as Omit<PermisosAdminUsuario, 'idUsuario'>;
    for (const k of Object.keys(CAMPO_PERMISO) as PermisoAdminKey[]) {
      data[CAMPO_PERMISO[k]] = permisos[k];
    }
    return data;
  }

  validarHorarios(horarios: HorarioAccesoDia[]): void {
    const vistos = new Set<number>();
    for (const h of horarios) {
      if (!diaSemanaValido(h.dia_semana)) {
        throw new BadRequestException('Día de semana inválido (0=dom … 6=sáb)');
      }
      if (!horaValidaHHmm(h.hora_inicio) || !horaValidaHHmm(h.hora_fin)) {
        throw new BadRequestException('Horas inválidas; usa formato HH:mm');
      }
      if (vistos.has(h.dia_semana)) {
        throw new BadRequestException('Solo un bloque horario por día');
      }
      vistos.add(h.dia_semana);
      const ini =
        Number(h.hora_inicio.slice(0, 2)) * 60 +
        Number(h.hora_inicio.slice(3, 5));
      const fin =
        Number(h.hora_fin.slice(0, 2)) * 60 + Number(h.hora_fin.slice(3, 5));
      if (fin <= ini) {
        throw new BadRequestException('La hora fin debe ser posterior al inicio');
      }
    }
  }

  async syncHorariosEnTx(
    tx: Prisma.TransactionClient,
    idUsuario: number,
    horarios: HorarioAccesoDia[],
  ) {
    this.validarHorarios(horarios);
    await tx.horarioAccesoUsuario.deleteMany({ where: { idUsuario } });
    if (!horarios.length) return;
    await tx.horarioAccesoUsuario.createMany({
      data: horarios.map((h) => ({
        idUsuario,
        diaSemana: h.dia_semana,
        horaInicio: h.hora_inicio,
        horaFin: h.hora_fin,
      })),
    });
  }

  async syncPermisosEnTx(
    tx: Prisma.TransactionClient,
    idUsuario: number,
    permisos: PermisosAdminConfig,
  ) {
    const data = this.permisosToPrismaData(normalizarPermisosAdmin(permisos));
    await tx.permisosAdminUsuario.upsert({
      where: { idUsuario },
      create: { idUsuario, ...data },
      update: data,
    });
  }

  async capacidadesParaUsuario(
    idUsuario: number,
    rol: string,
  ): Promise<{
    es_superadmin: boolean;
    permisos_admin: PermisosAdminConfig | null;
    horarios_acceso: HorarioAccesoDia[];
  }> {
    if (esSuperadmin(rol)) {
      return {
        es_superadmin: true,
        permisos_admin: permisosAdminTodos(),
        horarios_acceso: [],
      };
    }
    if (!esAdminRestaurante(rol)) {
      return {
        es_superadmin: false,
        permisos_admin: null,
        horarios_acceso: [],
      };
    }
    const [permRow, horarios] = await Promise.all([
      this.prisma.permisosAdminUsuario.findUnique({ where: { idUsuario } }),
      this.prisma.horarioAccesoUsuario.findMany({
        where: { idUsuario },
        orderBy: { diaSemana: 'asc' },
      }),
    ]);
    return {
      es_superadmin: false,
      permisos_admin: this.mapPermisos(permRow),
      horarios_acceso: this.mapHorarios(horarios),
    };
  }

  async assertAccesoAdminEnHorario(idUsuario: number): Promise<void> {
    const horarios = await this.prisma.horarioAccesoUsuario.findMany({
      where: { idUsuario },
    });
    const mapped = this.mapHorarios(horarios);
    const now = DateTime.now().setZone('America/Bogota');
    const diaSemana = now.weekday % 7;
    const minutos = now.hour * 60 + now.minute;
    if (!dentroDeHorarioAcceso(mapped, { diaSemana, minutos })) {
      throw new ForbiddenException(
        'Fuera del horario permitido para esta cuenta de administrador',
      );
    }
  }

  assertCapacidadAdmin(
    rolActor: string,
    permisos: PermisosAdminConfig | null,
    clave: PermisoAdminKey,
  ) {
    if (esSuperadmin(rolActor)) return;
    if (!permisos?.[clave]) {
      throw new ForbiddenException('No tienes permiso para esta sección');
    }
  }
}
