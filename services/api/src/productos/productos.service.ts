import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

function mapProducto(p: {
  idProducto: number;
  idCategoria: number;
  nombre: string;
  descripcion: string | null;
  precio: { toString(): string };
  activo: boolean;
  esPlatoPrincipal: boolean;
  esEmpacable: boolean;
  tipoProteina: string;
  categoria: { nombre: string };
}) {
  return {
    id_producto: p.idProducto,
    id_categoria: p.idCategoria,
    categoria_nombre: p.categoria.nombre,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precio: Number(p.precio),
    activo: p.activo,
    es_plato_principal: p.esPlatoPrincipal,
    es_empacable: p.esEmpacable,
    tipo_proteina: p.tipoProteina,
  };
}

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarCategorias() {
    const rows = await this.prisma.categoria.findMany({
      select: { idCategoria: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
    return rows.map((c) => ({
      id_categoria: c.idCategoria,
      nombre: c.nombre,
    }));
  }

  async listarProductos(incluirInactivos: boolean) {
    const rows = await this.prisma.producto.findMany({
      where: incluirInactivos ? {} : { activo: true },
      include: { categoria: { select: { nombre: true } } },
      orderBy: [{ categoria: { nombre: 'asc' } }, { nombre: 'asc' }],
    });
    return rows.map(mapProducto);
  }

  async crear(dto: CreateProductoDto) {
    const cat = await this.prisma.categoria.findUnique({
      where: { idCategoria: dto.id_categoria },
    });
    if (!cat) {
      throw new BadRequestException('Categoría no encontrada');
    }
    const created = await this.prisma.producto.create({
      data: {
        idCategoria: dto.id_categoria,
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        precio: dto.precio,
        esPlatoPrincipal: dto.es_plato_principal ?? false,
        esEmpacable: dto.es_empacable ?? false,
        tipoProteina: dto.tipo_proteina ?? 'ninguno',
        activo: true,
      },
      include: { categoria: { select: { nombre: true } } },
    });
    return mapProducto(created);
  }

  async actualizar(idProducto: number, dto: UpdateProductoDto) {
    const existing = await this.prisma.producto.findUnique({
      where: { idProducto },
      include: { categoria: true },
    });
    if (!existing) {
      throw new NotFoundException('Producto no encontrado');
    }
    if (dto.id_categoria != null) {
      const cat = await this.prisma.categoria.findUnique({
        where: { idCategoria: dto.id_categoria },
      });
      if (!cat) {
        throw new BadRequestException('Categoría no encontrada');
      }
    }
    const updated = await this.prisma.producto.update({
      where: { idProducto },
      data: {
        ...(dto.id_categoria != null ? { idCategoria: dto.id_categoria } : {}),
        ...(dto.nombre != null ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.descripcion !== undefined
          ? { descripcion: dto.descripcion?.trim() || null }
          : {}),
        ...(dto.precio != null ? { precio: dto.precio } : {}),
        ...(dto.activo != null ? { activo: dto.activo } : {}),
        ...(dto.es_plato_principal != null
          ? { esPlatoPrincipal: dto.es_plato_principal }
          : {}),
        ...(dto.es_empacable != null ? { esEmpacable: dto.es_empacable } : {}),
        ...(dto.tipo_proteina != null ? { tipoProteina: dto.tipo_proteina } : {}),
      },
      include: { categoria: { select: { nombre: true } } },
    });
    return mapProducto(updated);
  }

  async desactivar(idProducto: number) {
    return this.actualizar(idProducto, { activo: false });
  }
}
