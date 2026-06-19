import {
  ConflictException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Mesa } from '@prisma/client';
import { Prisma } from '@prisma/client';
import {
  campoDisponibilidadMesaParaWeekday,
  mesaDisponibleHoyBogota,
} from '../common/mesa-dia';
import { PrismaService } from '../prisma/prisma.service';
import { weekdayBogota } from '../common/timezone';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
import { nombreUsuarioPublico } from '../usuarios/usuario-display';
import {
  MESA_MOSTRADOR_NUMERO,
  MESA_PARA_LLEVAR_NUMERO,
} from '@la-reserva/shared-domain/mesa-label';
import {
  type PatchDisponibilidadMesa,
  validarCambioNumeroMesaAdmin,
  validarEliminarMesaAdmin,
  validarNumeroMesaReservado,
  validarPatchMesaAdmin,
} from '@la-reserva/shared-domain/mesa-admin-validacion';

export { MESA_MOSTRADOR_NUMERO, MESA_PARA_LLEVAR_NUMERO };

const PEDIDOS_ABIERTOS = ['abierto', 'en_cocina'] as const;

const OCULTAS_GRILLA = [MESA_MOSTRADOR_NUMERO, MESA_PARA_LLEVAR_NUMERO];

/** Valor legacy en BD; no se muestra ni se pide en la app. */
const CAPACIDAD_MESA_DEFAULT = 4;

@Injectable()
export class MesasService {
  constructor(private readonly prisma: PrismaService) {}

  private mapMesaPublic(m: {
    idMesa: number;
    numero: number;
    capacidad: number;
    estado: string;
  }) {
    return {
      id_mesa: m.idMesa,
      numero: m.numero,
      capacidad: m.capacidad,
      estado: m.estado,
    };
  }

  private mapMesaAdmin(m: Mesa, pedidosActivos = 0, totalPedidos = 0) {
    return {
      id_mesa: m.idMesa,
      numero: m.numero,
      capacidad: m.capacidad,
      estado: m.estado,
      pedidos_activos: pedidosActivos,
      total_pedidos: totalPedidos,
      disponible_lunes: m.disponibleLunes,
      disponible_martes: m.disponibleMartes,
      disponible_miercoles: m.disponibleMiercoles,
      disponible_jueves: m.disponibleJueves,
      disponible_viernes: m.disponibleViernes,
      disponible_sabado: m.disponibleSabado,
      disponible_domingo: m.disponibleDomingo,
    };
  }

  async listarVisiblesHoy() {
    const weekday = weekdayBogota();
    const campo = campoDisponibilidadMesaParaWeekday(weekday);
    if (!campo) {
      return [];
    }
    const mesas = await this.prisma.mesa.findMany({
      where: {
        numero: { notIn: OCULTAS_GRILLA },
        [campo]: true,
      } as Prisma.MesaWhereInput,
      orderBy: { numero: 'asc' },
    });
    const ocupadasIds = mesas
      .filter((m) => m.estado === 'ocupada')
      .map((m) => m.idMesa);
    const pedidosActivos =
      ocupadasIds.length > 0
        ? await this.prisma.pedido.findMany({
            where: {
              idMesa: { in: ocupadasIds },
              estado: { in: ['abierto', 'en_cocina'] },
            },
            include: { usuario: { include: { rol: true } } },
            orderBy: { idPedido: 'desc' },
          })
        : [];
    const meseroPorMesa = new Map<
      number,
      { nombre: string; apellido: string }
    >();
    for (const p of pedidosActivos) {
      if (!meseroPorMesa.has(p.idMesa)) {
        meseroPorMesa.set(p.idMesa, {
          ...nombreUsuarioPublico(
            p.usuario.nombre,
            p.usuario.apellido,
            p.usuario.rol.nombre,
          ),
        });
      }
    }
    return mesas.map((m) => ({
      ...this.mapMesaPublic(m),
      mesero: meseroPorMesa.get(m.idMesa) ?? null,
    }));
  }

  async listarTodasAdmin() {
    const mesas = await this.prisma.mesa.findMany({
      orderBy: { numero: 'asc' },
    });
    const conteosActivos = await this.prisma.pedido.groupBy({
      by: ['idMesa'],
      where: { estado: { in: [...PEDIDOS_ABIERTOS] } },
      _count: { idPedido: true },
    });
    const conteosTotal = await this.prisma.pedido.groupBy({
      by: ['idMesa'],
      _count: { idPedido: true },
    });
    const activosPorMesa = new Map(
      conteosActivos.map((c) => [c.idMesa, c._count.idPedido]),
    );
    const totalPorMesa = new Map(
      conteosTotal.map((c) => [c.idMesa, c._count.idPedido]),
    );
    return mesas.map((m) =>
      this.mapMesaAdmin(
        m,
        activosPorMesa.get(m.idMesa) ?? 0,
        totalPorMesa.get(m.idMesa) ?? 0,
      ),
    );
  }

  async crearMesa(dto: CreateMesaDto) {
    const reservado = validarNumeroMesaReservado(dto.numero);
    if (!reservado.ok) {
      throw new BadRequestException(reservado.mensaje);
    }
    const existe = await this.prisma.mesa.findUnique({
      where: { numero: dto.numero },
    });
    if (existe) {
      throw new BadRequestException('Ya existe una mesa con ese número.');
    }
    const creada = await this.prisma.mesa.create({
      data: {
        numero: dto.numero,
        capacidad: dto.capacidad ?? CAPACIDAD_MESA_DEFAULT,
        disponibleLunes: dto.disponible_lunes ?? true,
        disponibleMartes: dto.disponible_martes ?? true,
        disponibleMiercoles: dto.disponible_miercoles ?? true,
        disponibleJueves: dto.disponible_jueves ?? true,
        disponibleViernes: dto.disponible_viernes ?? true,
        disponibleSabado: dto.disponible_sabado ?? true,
        disponibleDomingo: dto.disponible_domingo ?? true,
      },
    });
    return this.mapMesaAdmin(creada, 0, 0);
  }

  private flagsSnakeMesa(m: Mesa) {
    return {
      disponible_lunes: m.disponibleLunes,
      disponible_martes: m.disponibleMartes,
      disponible_miercoles: m.disponibleMiercoles,
      disponible_jueves: m.disponibleJueves,
      disponible_viernes: m.disponibleViernes,
      disponible_sabado: m.disponibleSabado,
      disponible_domingo: m.disponibleDomingo,
    };
  }

  private patchDisponibilidadDesdeDto(
    dto: UpdateMesaDto,
  ): PatchDisponibilidadMesa {
    const patch: PatchDisponibilidadMesa = {};
    if (dto.disponible_lunes != null) {
      patch.disponible_lunes = dto.disponible_lunes;
    }
    if (dto.disponible_martes != null) {
      patch.disponible_martes = dto.disponible_martes;
    }
    if (dto.disponible_miercoles != null) {
      patch.disponible_miercoles = dto.disponible_miercoles;
    }
    if (dto.disponible_jueves != null) {
      patch.disponible_jueves = dto.disponible_jueves;
    }
    if (dto.disponible_viernes != null) {
      patch.disponible_viernes = dto.disponible_viernes;
    }
    if (dto.disponible_sabado != null) {
      patch.disponible_sabado = dto.disponible_sabado;
    }
    if (dto.disponible_domingo != null) {
      patch.disponible_domingo = dto.disponible_domingo;
    }
    return patch;
  }

  private async contarPedidosActivosMesa(idMesa: number): Promise<number> {
    return this.prisma.pedido.count({
      where: {
        idMesa,
        estado: { in: [...PEDIDOS_ABIERTOS] },
      },
    });
  }

  private async contarTotalPedidosMesa(idMesa: number): Promise<number> {
    return this.prisma.pedido.count({ where: { idMesa } });
  }

  private async contadoresPedidosMesa(idMesa: number) {
    const [activos, total] = await Promise.all([
      this.contarPedidosActivosMesa(idMesa),
      this.contarTotalPedidosMesa(idMesa),
    ]);
    return { activos, total };
  }

  async actualizarMesa(idMesa: number, dto: UpdateMesaDto) {
    const m = await this.prisma.mesa.findUnique({ where: { idMesa } });
    if (!m) {
      throw new NotFoundException('Mesa no encontrada');
    }

    if (dto.numero != null && dto.numero !== m.numero) {
      const { activos: pedidosActivos } =
        await this.contadoresPedidosMesa(idMesa);
      const validacionNumero = validarCambioNumeroMesaAdmin({
        numeroActual: m.numero,
        numeroNuevo: dto.numero,
        pedidosActivos,
      });
      if (!validacionNumero.ok) {
        throw new ConflictException(validacionNumero.mensaje);
      }
      const existe = await this.prisma.mesa.findUnique({
        where: { numero: dto.numero },
      });
      if (existe) {
        throw new BadRequestException('Ya existe una mesa con ese número.');
      }
    }

    const patchDisponibilidad = this.patchDisponibilidadDesdeDto(dto);
    if (Object.keys(patchDisponibilidad).length > 0) {
      const pedidosActivos = await this.contarPedidosActivosMesa(idMesa);
      const validacion = validarPatchMesaAdmin({
        numeroMesa: m.numero,
        flagsActuales: this.flagsSnakeMesa(m),
        patch: patchDisponibilidad,
        pedidosActivos,
        weekdayHoy: weekdayBogota(),
      });
      if (!validacion.ok) {
        throw new ConflictException(validacion.mensaje);
      }
    }

    const actualizada = await this.prisma.mesa.update({
      where: { idMesa },
      data: {
        ...(dto.numero != null ? { numero: dto.numero } : {}),
        ...(dto.capacidad != null ? { capacidad: dto.capacidad } : {}),
        ...(dto.disponible_lunes != null
          ? { disponibleLunes: dto.disponible_lunes }
          : {}),
        ...(dto.disponible_martes != null
          ? { disponibleMartes: dto.disponible_martes }
          : {}),
        ...(dto.disponible_miercoles != null
          ? { disponibleMiercoles: dto.disponible_miercoles }
          : {}),
        ...(dto.disponible_jueves != null
          ? { disponibleJueves: dto.disponible_jueves }
          : {}),
        ...(dto.disponible_viernes != null
          ? { disponibleViernes: dto.disponible_viernes }
          : {}),
        ...(dto.disponible_sabado != null
          ? { disponibleSabado: dto.disponible_sabado }
          : {}),
        ...(dto.disponible_domingo != null
          ? { disponibleDomingo: dto.disponible_domingo }
          : {}),
      },
    });
    const { activos, total } = await this.contadoresPedidosMesa(idMesa);
    return this.mapMesaAdmin(actualizada, activos, total);
  }

  async eliminarMesa(idMesa: number) {
    const m = await this.prisma.mesa.findUnique({ where: { idMesa } });
    if (!m) {
      throw new NotFoundException('Mesa no encontrada');
    }
    const { activos, total } = await this.contadoresPedidosMesa(idMesa);
    const validacion = validarEliminarMesaAdmin({
      numeroMesa: m.numero,
      pedidosActivos: activos,
      totalPedidos: total,
    });
    if (!validacion.ok) {
      throw new ConflictException(validacion.mensaje);
    }
    await this.prisma.mesa.delete({ where: { idMesa } });
    return { ok: true, id_mesa: idMesa };
  }

  async obtenerPorId(idMesa: number) {
    const m = await this.prisma.mesa.findUnique({
      where: { idMesa },
    });
    if (!m) {
      throw new NotFoundException('Mesa no encontrada');
    }
    if (!mesaDisponibleHoyBogota(m)) {
      throw new NotFoundException('Mesa no disponible hoy');
    }
    return this.mapMesaPublic(m);
  }

  async getMostrador() {
    const m = await this.prisma.mesa.findFirst({
      where: { numero: MESA_MOSTRADOR_NUMERO },
    });
    if (!m) {
      throw new NotFoundException(
        'Mostrador no configurado. Ejecuta el seed o crea la mesa 99.',
      );
    }
    if (!mesaDisponibleHoyBogota(m)) {
      throw new NotFoundException('Mostrador no disponible hoy');
    }
    return this.mapMesaPublic(m);
  }

  async getParaLlevar() {
    const m = await this.prisma.mesa.findFirst({
      where: { numero: MESA_PARA_LLEVAR_NUMERO },
    });
    if (!m) {
      throw new NotFoundException(
        'Para llevar no configurado. Ejecuta el seed o crea la mesa 98.',
      );
    }
    if (!mesaDisponibleHoyBogota(m)) {
      throw new NotFoundException('Para llevar no disponible hoy');
    }
    return this.mapMesaPublic(m);
  }
}
