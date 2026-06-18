import {
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

/** Mesa virtual para ventas en mostrador (bebidas sin ocupar mesas 1–15). */
export const MESA_MOSTRADOR_NUMERO = 99;

/** Mesa virtual para pedidos para llevar (no mesas 1–15). */
export const MESA_PARA_LLEVAR_NUMERO = 98;

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

  private mapMesaAdmin(m: Mesa) {
    return {
      id_mesa: m.idMesa,
      numero: m.numero,
      capacidad: m.capacidad,
      estado: m.estado,
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
    return mesas.map((m) => this.mapMesaAdmin(m));
  }

  async crearMesa(dto: CreateMesaDto) {
    if (OCULTAS_GRILLA.includes(dto.numero)) {
      throw new BadRequestException(
        'Los números 98 y 99 están reservados (para llevar / mostrador).',
      );
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
    return this.mapMesaAdmin(creada);
  }

  async actualizarMesa(idMesa: number, dto: UpdateMesaDto) {
    const m = await this.prisma.mesa.findUnique({ where: { idMesa } });
    if (!m) {
      throw new NotFoundException('Mesa no encontrada');
    }
    const actualizada = await this.prisma.mesa.update({
      where: { idMesa },
      data: {
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
    return this.mapMesaAdmin(actualizada);
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
