import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PermisosMeseroConfig as PermisosMeseroRow } from '@prisma/client';
import {
  PERMISOS_MESERO_DEFAULTS,
  PERMISOS_MESERO_KEYS,
  type PermisoMeseroKey,
  type PermisosMeseroConfig,
  type PermisosMeseroEfectivos,
  permisosMeseroTodos,
} from '@la-reserva/shared-domain/permisos-mesero';
import { fechaBogotaDb } from '../common/fecha-bogota-db';
import { PrismaService } from '../prisma/prisma.service';
import { nombreUsuarioPublico } from '../usuarios/usuario-display';
import { AsignarDelegacionCierreDto, PatchPermisosMeseroDto } from './dto/permisos.dto';

const CAMPO_PRISMA: Record<
  PermisoMeseroKey,
  keyof Omit<PermisosMeseroRow, 'id'>
> = {
  agregar_items: 'agregarItems',
  editar_cantidades: 'editarCantidades',
  quitar_lineas: 'quitarLineas',
  enviar_cocina: 'enviarCocina',
  reimprimir_comanda: 'reimprimirComanda',
  cobrar: 'cobrar',
  precuenta: 'precuenta',
  reimprimir_factura: 'reimprimirFactura',
  cancelar_pedido: 'cancelarPedido',
  transferir_mesa: 'transferirMesa',
  ayuda_companeros: 'ayudaCompaneros',
};

@Injectable()
export class PermisosService {
  private cache: { row: PermisosMeseroRow; expiresAt: number } | null = null;
  private static readonly CACHE_TTL_MS = 30_000;

  constructor(private readonly prisma: PrismaService) {}

  invalidateCache(): void {
    this.cache = null;
  }

  private mapRow(row: PermisosMeseroRow): PermisosMeseroConfig {
    return {
      agregar_items: row.agregarItems,
      editar_cantidades: row.editarCantidades,
      quitar_lineas: row.quitarLineas,
      enviar_cocina: row.enviarCocina,
      reimprimir_comanda: row.reimprimirComanda,
      cobrar: row.cobrar,
      precuenta: row.precuenta,
      reimprimir_factura: row.reimprimirFactura,
      cancelar_pedido: row.cancelarPedido,
      transferir_mesa: row.transferirMesa,
      ayuda_companeros: row.ayudaCompaneros,
    };
  }

  async obtenerConfigRow(): Promise<PermisosMeseroRow> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) {
      return this.cache.row;
    }
    let row = await this.prisma.permisosMeseroConfig.findUnique({
      where: { id: 1 },
    });
    if (!row) {
      row = await this.prisma.permisosMeseroConfig.create({
        data: { id: 1 },
      });
    }
    this.cache = { row, expiresAt: now + PermisosService.CACHE_TTL_MS };
    return row;
  }

  async obtenerConfig(): Promise<PermisosMeseroConfig> {
    return this.mapRow(await this.obtenerConfigRow());
  }

  async actualizarConfig(dto: PatchPermisosMeseroDto): Promise<PermisosMeseroConfig> {
    const data: Partial<PermisosMeseroRow> = {};
    for (const key of PERMISOS_MESERO_KEYS) {
      if (dto[key] !== undefined) {
        data[CAMPO_PRISMA[key]] = dto[key] as boolean;
      }
    }
    const row = await this.prisma.permisosMeseroConfig.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        ...Object.fromEntries(
          PERMISOS_MESERO_KEYS.map((k) => [
            CAMPO_PRISMA[k],
            dto[k] ?? PERMISOS_MESERO_DEFAULTS[k],
          ]),
        ),
      },
      update: data,
    });
    this.invalidateCache();
    return this.mapRow(row);
  }

  private async puedeCerrarAnulando(
    idUsuario: number,
    rol: string,
  ): Promise<boolean> {
    if (rol === 'admin') return true;
    if (rol !== 'mesero') return false;
    const { date } = fechaBogotaDb();
    const row = await this.prisma.delegacionMeseroTurno.findUnique({
      where: {
        fecha_tipo: { fecha: date, tipo: 'cierre_con_anulacion' },
      },
    });
    return row?.idUsuario === idUsuario;
  }

  async getEfectivos(
    idUsuario: number,
    rol: string,
  ): Promise<PermisosMeseroEfectivos> {
    if (rol === 'admin') {
      return permisosMeseroTodos();
    }
    if (rol === 'chef') {
      return {
        ...PERMISOS_MESERO_DEFAULTS,
        reimprimir_comanda: true,
        puede_cerrar_anulando: false,
        es_admin: false,
      };
    }
    if (rol !== 'mesero') {
      return {
        ...Object.fromEntries(
          PERMISOS_MESERO_KEYS.map((k) => [k, false]),
        ) as PermisosMeseroConfig,
        puede_cerrar_anulando: false,
        es_admin: false,
      };
    }
    const config = await this.obtenerConfig();
    return {
      ...config,
      puede_cerrar_anulando: await this.puedeCerrarAnulando(idUsuario, rol),
      es_admin: false,
    };
  }

  async assertPermiso(
    actor: { idUsuario: number; rol: { nombre: string } },
    permiso: PermisoMeseroKey,
    opts?: { permitirChef?: boolean },
  ): Promise<void> {
    const rol = actor.rol.nombre;
    if (rol === 'admin') return;
    if (opts?.permitirChef && rol === 'chef') return;
    if (rol !== 'mesero') {
      throw new ForbiddenException('No tienes permiso para esta acción');
    }
    const efectivos = await this.getEfectivos(actor.idUsuario, rol);
    if (!efectivos[permiso]) {
      throw new ForbiddenException('No tienes permiso para esta acción');
    }
  }

  async resumenAdmin(fecha?: string) {
    const { iso, date } = fechaBogotaDb(fecha);
    const [config, meseros, delegacion] = await Promise.all([
      this.obtenerConfig(),
      this.prisma.usuario.findMany({
        where: { rol: { nombre: 'mesero' }, activo: true },
        include: { rol: true },
        orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
      }),
      this.prisma.delegacionMeseroTurno.findUnique({
        where: {
          fecha_tipo: { fecha: date, tipo: 'cierre_con_anulacion' },
        },
        include: { mesero: { include: { rol: true } } },
      }),
    ]);

    return {
      fecha: iso,
      permisos_mesero: config,
      delegacion_cierre_anulacion: delegacion
        ? {
            id_usuario: delegacion.idUsuario,
            nombre: nombreUsuarioPublico(
              delegacion.mesero.nombre,
              delegacion.mesero.apellido,
              delegacion.mesero.rol.nombre,
            ).nombre,
            apellido: nombreUsuarioPublico(
              delegacion.mesero.nombre,
              delegacion.mesero.apellido,
              delegacion.mesero.rol.nombre,
            ).apellido,
            asignado_en: delegacion.creadoEn,
          }
        : null,
      meseros: meseros.map((m) => {
        const pub = nombreUsuarioPublico(m.nombre, m.apellido, m.rol.nombre);
        return {
          id_usuario: m.idUsuario,
          nombre: pub.nombre,
          apellido: pub.apellido,
        };
      }),
    };
  }

  async asignarDelegacionCierre(
    dto: AsignarDelegacionCierreDto,
    idAdmin: number,
  ) {
    const { iso, date } = fechaBogotaDb(dto.fecha);

    if (dto.id_usuario == null) {
      await this.prisma.delegacionMeseroTurno.deleteMany({
        where: { fecha: date, tipo: 'cierre_con_anulacion' },
      });
      return { fecha: iso, delegacion_cierre_anulacion: null };
    }

    await this.ensureMeseroActivo(dto.id_usuario);

    const row = await this.prisma.delegacionMeseroTurno.upsert({
      where: {
        fecha_tipo: { fecha: date, tipo: 'cierre_con_anulacion' },
      },
      create: {
        fecha: date,
        tipo: 'cierre_con_anulacion',
        idUsuario: dto.id_usuario,
        idUsuarioRegistro: idAdmin,
      },
      update: {
        idUsuario: dto.id_usuario,
        idUsuarioRegistro: idAdmin,
      },
      include: { mesero: { include: { rol: true } } },
    });

    const pub = nombreUsuarioPublico(
      row.mesero.nombre,
      row.mesero.apellido,
      row.mesero.rol.nombre,
    );

    return {
      fecha: iso,
      delegacion_cierre_anulacion: {
        id_usuario: row.idUsuario,
        nombre: pub.nombre,
        apellido: pub.apellido,
        asignado_en: row.creadoEn,
      },
    };
  }

  /** Compatibilidad con factura móvil previa a /permisos/efectivos. */
  async miDelegacionHoy(idUsuario: number, rol: string) {
    const efectivos = await this.getEfectivos(idUsuario, rol);
    return {
      puede_cerrar_anulando: efectivos.puede_cerrar_anulando,
      es_admin: efectivos.es_admin,
    };
  }

  private async ensureMeseroActivo(idUsuario: number) {
    const u = await this.prisma.usuario.findUnique({
      where: { idUsuario },
      include: { rol: true },
    });
    if (!u || !u.activo || u.rol.nombre !== 'mesero') {
      throw new BadRequestException('Mesero no encontrado o inactivo');
    }
  }
}
