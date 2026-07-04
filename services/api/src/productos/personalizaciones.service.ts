import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TipoPersonalizacion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PedidosGateway } from '../pedidos/pedidos.gateway';
import {
  CreatePersonalizacionDto,
  UpdatePersonalizacionDto,
} from './dto/personalizacion.dto';

function mapOpcion(o: {
  idOpcion: number;
  idProducto: number;
  tipo: TipoPersonalizacion;
  descripcion: string;
}) {
  return {
    id_opcion: o.idOpcion,
    id_producto: o.idProducto,
    tipo: o.tipo,
    descripcion: o.descripcion,
  };
}

@Injectable()
export class PersonalizacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: PedidosGateway,
  ) {}

  async listarPorProducto(idProducto: number) {
    const prod = await this.prisma.producto.findUnique({
      where: { idProducto },
    });
    if (!prod) {
      throw new NotFoundException('Producto no encontrado');
    }
    const rows = await this.prisma.personalizacionOpcion.findMany({
      where: { idProducto },
      orderBy: [{ tipo: 'asc' }, { idOpcion: 'asc' }],
    });
    return rows.map(mapOpcion);
  }

  async crear(idProducto: number, dto: CreatePersonalizacionDto) {
    const prod = await this.prisma.producto.findUnique({
      where: { idProducto },
    });
    if (!prod) {
      throw new NotFoundException('Producto no encontrado');
    }
    if (prod.esAcompanamientoMazorca) {
      throw new BadRequestException(
        'La línea de mazorca no admite personalizaciones',
      );
    }
    const descripcion = dto.descripcion.trim();
    const created = await this.prisma.personalizacionOpcion.create({
      data: {
        idProducto,
        tipo: dto.tipo as TipoPersonalizacion,
        descripcion,
      },
    });
    this.gateway.emitConfigActualizada('menu');
    return mapOpcion(created);
  }

  async actualizar(idOpcion: number, dto: UpdatePersonalizacionDto) {
    const existing = await this.prisma.personalizacionOpcion.findUnique({
      where: { idOpcion },
    });
    if (!existing) {
      throw new NotFoundException('Opción no encontrada');
    }
    const updated = await this.prisma.personalizacionOpcion.update({
      where: { idOpcion },
      data: {
        ...(dto.tipo != null ? { tipo: dto.tipo as TipoPersonalizacion } : {}),
        ...(dto.descripcion != null
          ? { descripcion: dto.descripcion.trim() }
          : {}),
      },
    });
    this.gateway.emitConfigActualizada('menu');
    return mapOpcion(updated);
  }

  async eliminar(idOpcion: number) {
    const existing = await this.prisma.personalizacionOpcion.findUnique({
      where: { idOpcion },
    });
    if (!existing) {
      throw new NotFoundException('Opción no encontrada');
    }
    const usos = await this.prisma.detPersonalizacion.count({
      where: { idOpcion },
    });
    if (usos > 0) {
      throw new BadRequestException(
        'No se puede eliminar: la opción ya se usó en pedidos anteriores',
      );
    }
    await this.prisma.personalizacionOpcion.delete({
      where: { idOpcion },
    });
    this.gateway.emitConfigActualizada('menu');
    return { ok: true, id_opcion: idOpcion };
  }
}
