import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCuentaCreditoDto } from './dto/crear-cuenta-credito.dto';
import { AbonoCuentaCreditoDto } from './dto/abono-cuenta-credito.dto';

type CuentaConMesa = Prisma.CuentaCreditoGetPayload<{
  include: { pedido: { include: { mesa: { select: { numero: true } } } } };
}>;

@Injectable()
export class CreditosService {
  constructor(private readonly prisma: PrismaService) {}

  private mapCuenta(row: CuentaConMesa) {
    const n = (v: Prisma.Decimal | number) => Math.round(Number(v));
    return {
      id_credito: row.idCredito,
      id_pedido: row.idPedido,
      id_factura: row.idFactura,
      mesa_numero: row.pedido?.mesa?.numero ?? null,
      nombre_cliente: row.nombreCliente,
      telefono: row.telefono,
      monto_total: n(row.montoTotal),
      saldo_pendiente: n(row.saldoPendiente),
      notas: row.notas,
      estado: row.estado,
      creado_en: row.creadoEn.toISOString(),
      pagado_en: row.pagadoEn?.toISOString() ?? null,
      id_usuario: row.idUsuario,
    };
  }

  async listar(soloAbiertos = true) {
    const rows = await this.prisma.cuentaCredito.findMany({
      where: soloAbiertos ? { estado: 'abierto' } : undefined,
      orderBy: [{ estado: 'asc' }, { creadoEn: 'desc' }],
      include: { pedido: { include: { mesa: { select: { numero: true } } } } },
    });
    return rows.map((r) => this.mapCuenta(r));
  }

  async crear(dto: CrearCuentaCreditoDto, idUsuario: number) {
    const monto = Math.round(dto.monto_total);
    if (monto <= 0) {
      throw new BadRequestException('El monto debe ser mayor que cero');
    }
    const pedido = await this.prisma.pedido.findUnique({
      where: { idPedido: dto.id_pedido },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (dto.id_factura != null) {
      const factura = await this.prisma.factura.findFirst({
        where: { idFactura: dto.id_factura, idPedido: dto.id_pedido },
      });
      if (!factura) {
        throw new BadRequestException('Factura no pertenece al pedido');
      }
    }
    const row = await this.prisma.cuentaCredito.create({
      data: {
        idPedido: dto.id_pedido,
        idFactura: dto.id_factura ?? null,
        nombreCliente: dto.nombre_cliente.trim(),
        telefono: dto.telefono?.trim() || null,
        montoTotal: monto,
        saldoPendiente: monto,
        notas: dto.notas?.trim() || null,
        idUsuario,
      },
      include: { pedido: { include: { mesa: { select: { numero: true } } } } },
    });
    return this.mapCuenta(row);
  }

  async registrarAbono(idCredito: number, dto: AbonoCuentaCreditoDto) {
    const cuenta = await this.prisma.cuentaCredito.findUnique({
      where: { idCredito },
    });
    if (!cuenta) {
      throw new NotFoundException('Cuenta de crédito no encontrada');
    }
    if (cuenta.estado === 'pagado') {
      throw new BadRequestException('La cuenta ya está saldada');
    }
    const abono = Math.round(dto.monto);
    if (abono <= 0) {
      throw new BadRequestException('El abono debe ser mayor que cero');
    }
    const saldoActual = Math.round(Number(cuenta.saldoPendiente));
    if (abono > saldoActual) {
      throw new BadRequestException('El abono supera el saldo pendiente');
    }
    const nuevoSaldo = saldoActual - abono;
    const notas =
      dto.notas?.trim() ?
        [cuenta.notas, `Abono ${abono}: ${dto.notas.trim()}`]
          .filter(Boolean)
          .join('\n')
      : cuenta.notas;
    const row = await this.prisma.cuentaCredito.update({
      where: { idCredito },
      data: {
        saldoPendiente: nuevoSaldo,
        notas,
        ...(nuevoSaldo <= 0 ?
          { estado: 'pagado', pagadoEn: new Date(), saldoPendiente: 0 }
        : {}),
      },
      include: { pedido: { include: { mesa: { select: { numero: true } } } } },
    });
    return this.mapCuenta(row);
  }
}
