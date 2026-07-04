import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermisosService } from '../permisos/permisos.service';
import { PedidosGateway } from '../pedidos/pedidos.gateway';
import { fechaBogotaDb } from '../common/fecha-bogota-db';
import {
  aplicaControlStockBebida,
  descontarStockBebidaTx,
  reintegrarStockBebidaTx,
} from '../productos/stock-bebida';
import { nombreUsuarioPublico } from '../usuarios/usuario-display';
import {
  AplicarSodaAlmuerzoDto,
  AplicarSodaMeseroDto,
  AsignarDelegacionCierreDto,
  UpsertPagoTurnoMeseroDto,
} from './dto/meseros-operativos.dto';

@Injectable()
export class MeserosOperativosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: PedidosGateway,
    private readonly permisos: PermisosService,
  ) {}

  private parseFechaBogota(fecha?: string) {
    return fechaBogotaDb(fecha);
  }

  private async ctxSodaAlmuerzo() {
    const config = await this.prisma.configOperativa.findUnique({
      where: { id: 1 },
      include: {
        productoSodaAlmuerzo: {
          include: { categoria: { select: { esBebida: true } } },
        },
      },
    });
    if (!config) {
      throw new NotFoundException('Configuración operativa no encontrada');
    }
    const prod = config.productoSodaAlmuerzo;
    return {
      activo: config.beneficioSodaAlmuerzoActivo,
      descontarStock: config.sodaAlmuerzoDescontarStock,
      idProducto: config.idProductoSodaAlmuerzo,
      producto: prod,
      productoNombre: prod?.nombre ?? null,
      controlStock: prod ? aplicaControlStockBebida(prod) : false,
      stockDisponible: prod?.stockDisponible ?? null,
    };
  }

  async resumen(fecha?: string) {
    const { iso, date } = this.parseFechaBogota(fecha);
    const sodaCfg = await this.ctxSodaAlmuerzo();

    const meseros = await this.prisma.usuario.findMany({
      where: { rol: { nombre: 'mesero' }, activo: true },
      include: { rol: true },
      orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
    });

    const registros = await this.prisma.registroBeneficioMesero.findMany({
      where: { fecha: date },
      include: { producto: { select: { nombre: true } } },
    });

    const delegacion = await this.prisma.delegacionMeseroTurno.findUnique({
      where: {
        fecha_tipo: { fecha: date, tipo: 'cierre_con_anulacion' },
      },
      include: {
        mesero: { include: { rol: true } },
      },
    });

    const byUser = new Map<number, typeof registros>();
    for (const r of registros) {
      const list = byUser.get(r.idUsuario) ?? [];
      list.push(r);
      byUser.set(r.idUsuario, list);
    }

    let sodasAplicadas = 0;
    let pagosRegistrados = 0;
    let montoPagosTotal = 0;

    const filas = meseros.map((m) => {
      const rs = byUser.get(m.idUsuario) ?? [];
      const soda = rs.find((x) => x.tipo === 'soda_almuerzo') ?? null;
      const pago = rs.find((x) => x.tipo === 'pago_turno') ?? null;
      if (soda) sodasAplicadas += 1;
      if (pago) {
        pagosRegistrados += 1;
        montoPagosTotal += Number(pago.monto ?? 0);
      }
      const pub = nombreUsuarioPublico(m.nombre, m.apellido, m.rol.nombre);
      return {
        id_usuario: m.idUsuario,
        nombre: pub.nombre,
        apellido: pub.apellido,
        soda_almuerzo: soda
          ? {
              id_registro: soda.idRegistro,
              cantidad: soda.cantidad,
              desconto_stock: soda.descontoStock,
              producto_nombre: soda.producto?.nombre ?? sodaCfg.productoNombre,
            }
          : null,
        pago_turno: pago
          ? {
              id_registro: pago.idRegistro,
              monto: Math.round(Number(pago.monto ?? 0)),
              notas: pago.notas,
            }
          : null,
      };
    });

    return {
      fecha: iso,
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
      config: {
        beneficio_soda_almuerzo_activo: sodaCfg.activo,
        id_producto_soda_almuerzo: sodaCfg.idProducto,
        producto_soda_nombre: sodaCfg.productoNombre,
        soda_almuerzo_descontar_stock: sodaCfg.descontarStock,
        producto_control_stock: sodaCfg.controlStock,
        producto_stock_disponible: sodaCfg.stockDisponible,
      },
      meseros: filas,
      totales: {
        sodas_aplicadas: sodasAplicadas,
        pagos_registrados: pagosRegistrados,
        monto_pagos_total: Math.round(montoPagosTotal),
      },
    };
  }

  async upsertPagoTurno(dto: UpsertPagoTurnoMeseroDto, idAdmin: number) {
    const { date } = this.parseFechaBogota(dto.fecha);
    await this.ensureMeseroActivo(dto.id_usuario);
    const monto = Math.round(dto.monto);
    const row = await this.prisma.registroBeneficioMesero.upsert({
      where: {
        fecha_idUsuario_tipo: {
          fecha: date,
          idUsuario: dto.id_usuario,
          tipo: 'pago_turno',
        },
      },
      create: {
        fecha: date,
        idUsuario: dto.id_usuario,
        tipo: 'pago_turno',
        monto,
        notas: dto.notas?.trim() || null,
        idUsuarioRegistro: idAdmin,
      },
      update: {
        monto,
        notas: dto.notas?.trim() || null,
        idUsuarioRegistro: idAdmin,
      },
    });
    return {
      id_registro: row.idRegistro,
      monto: Math.round(Number(row.monto ?? 0)),
      notas: row.notas,
    };
  }

  async aplicarSodaAlmuerzoTodos(dto: AplicarSodaAlmuerzoDto, idAdmin: number) {
    const { iso, date } = this.parseFechaBogota(dto.fecha);
    const sodaCfg = await this.ctxSodaAlmuerzo();
    if (!sodaCfg.activo) {
      throw new BadRequestException(
        'Activa el beneficio de soda almuerzo en Configuración',
      );
    }
    if (!sodaCfg.idProducto || !sodaCfg.producto) {
      throw new BadRequestException(
        'Indica el producto de soda almuerzo en Configuración',
      );
    }

    const meseros = await this.prisma.usuario.findMany({
      where: { rol: { nombre: 'mesero' }, activo: true },
      select: { idUsuario: true },
    });

    let aplicados = 0;
    let omitidos = 0;
    let stockDescontado = false;

    await this.prisma.$transaction(async (tx) => {
      for (const m of meseros) {
        const existing = await tx.registroBeneficioMesero.findUnique({
          where: {
            fecha_idUsuario_tipo: {
              fecha: date,
              idUsuario: m.idUsuario,
              tipo: 'soda_almuerzo',
            },
          },
        });
        if (existing) {
          omitidos += 1;
          continue;
        }
        let desconto = false;
        if (sodaCfg.descontarStock && sodaCfg.producto) {
          const prodFresh = await tx.producto.findUnique({
            where: { idProducto: sodaCfg.producto.idProducto },
            include: { categoria: { select: { esBebida: true } } },
          });
          if (prodFresh && aplicaControlStockBebida(prodFresh)) {
            await descontarStockBebidaTx(tx, prodFresh, 1);
            desconto = true;
            stockDescontado = true;
          }
        }
        await tx.registroBeneficioMesero.create({
          data: {
            fecha: date,
            idUsuario: m.idUsuario,
            tipo: 'soda_almuerzo',
            idProducto: sodaCfg.idProducto,
            cantidad: 1,
            descontoStock: desconto,
            idUsuarioRegistro: idAdmin,
          },
        });
        aplicados += 1;
      }
    });

    if (stockDescontado) {
      this.gateway.emitConfigActualizada('menu');
    }

    return {
      fecha: iso,
      aplicados,
      omitidos,
      total_meseros: meseros.length,
    };
  }

  async aplicarSodaAlmuerzoMesero(
    dto: AplicarSodaMeseroDto,
    idAdmin: number,
  ) {
    const { iso, date } = this.parseFechaBogota(dto.fecha);
    const sodaCfg = await this.ctxSodaAlmuerzo();
    if (!sodaCfg.activo) {
      throw new BadRequestException(
        'Activa el beneficio de soda almuerzo en Configuración',
      );
    }
    if (!sodaCfg.idProducto || !sodaCfg.producto) {
      throw new BadRequestException(
        'Indica el producto de soda almuerzo en Configuración',
      );
    }
    await this.ensureMeseroActivo(dto.id_usuario);

    const existing = await this.prisma.registroBeneficioMesero.findUnique({
      where: {
        fecha_idUsuario_tipo: {
          fecha: date,
          idUsuario: dto.id_usuario,
          tipo: 'soda_almuerzo',
        },
      },
    });
    if (existing) {
      throw new ConflictException('Este mesero ya tiene soda de almuerzo hoy');
    }

    let desconto = false;
    await this.prisma.$transaction(async (tx) => {
      if (sodaCfg.descontarStock && sodaCfg.producto) {
        const prodFresh = await tx.producto.findUnique({
          where: { idProducto: sodaCfg.producto.idProducto },
          include: { categoria: { select: { esBebida: true } } },
        });
        if (prodFresh && aplicaControlStockBebida(prodFresh)) {
          await descontarStockBebidaTx(tx, prodFresh, 1);
          desconto = true;
        }
      }
      await tx.registroBeneficioMesero.create({
        data: {
          fecha: date,
          idUsuario: dto.id_usuario,
          tipo: 'soda_almuerzo',
          idProducto: sodaCfg.idProducto,
          cantidad: 1,
          descontoStock: desconto,
          idUsuarioRegistro: idAdmin,
        },
      });
    });

    if (desconto) {
      this.gateway.emitConfigActualizada('menu');
    }

    return { fecha: iso, id_usuario: dto.id_usuario, desconto_stock: desconto };
  }

  async eliminarRegistro(idRegistro: number) {
    const row = await this.prisma.registroBeneficioMesero.findUnique({
      where: { idRegistro },
      include: {
        producto: { include: { categoria: { select: { esBebida: true } } } },
      },
    });
    if (!row) {
      throw new NotFoundException('Registro no encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      if (row.descontoStock && row.producto) {
        await reintegrarStockBebidaTx(tx, row.producto, row.cantidad);
      }
      await tx.registroBeneficioMesero.delete({
        where: { idRegistro },
      });
    });

    if (row.descontoStock) {
      this.gateway.emitConfigActualizada('menu');
    }

    return { ok: true };
  }

  async asignarDelegacionCierre(
    dto: AsignarDelegacionCierreDto,
    idAdmin: number,
  ) {
    const { iso, date } = this.parseFechaBogota(dto.fecha);

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

  async miDelegacionHoy(idUsuario: number, rol: string) {
    return this.permisos.miDelegacionHoy(idUsuario, rol);
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
