import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PedidosGateway } from '../pedidos/pedidos.gateway';
import { flagsProductoMenuPorCategoria } from '@la-reserva/shared-domain/empaque-para-llevar';
import { invalidateMazorcaProductIdCache } from '../pedidos/mazorca-linea-pedido';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

function resolverFlagsProducto(
  cat: {
    nombre: string;
    esLineaEmpaque?: boolean;
    esPlatoPrincipalDefault?: boolean;
  },
  explicit: {
    es_plato_principal?: boolean | null;
    es_empacable?: boolean | null;
  },
  existing?: { esPlatoPrincipal: boolean; esEmpacable: boolean },
): { esPlatoPrincipal: boolean; esEmpacable: boolean } {
  const auto = flagsProductoMenuPorCategoria(cat);

  let esEmpacable: boolean;
  if (explicit.es_empacable != null) {
    esEmpacable = explicit.es_empacable;
  } else if (existing != null) {
    esEmpacable = existing.esEmpacable;
  } else {
    esEmpacable = auto.es_empacable;
  }

  let esPlatoPrincipal: boolean;
  if (esEmpacable) {
    esPlatoPrincipal = false;
  } else if (explicit.es_plato_principal != null) {
    esPlatoPrincipal = explicit.es_plato_principal;
  } else if (existing != null) {
    esPlatoPrincipal = existing.esPlatoPrincipal;
  } else {
    esPlatoPrincipal = auto.es_plato_principal;
  }

  return { esPlatoPrincipal, esEmpacable };
}

function mapProducto(p: {
  idProducto: number;
  idCategoria: number;
  nombre: string;
  descripcion: string | null;
  precio: { toString(): string };
  activo: boolean;
  esPlatoPrincipal: boolean;
  esEmpacable: boolean;
  esAcompanamientoMazorca: boolean;
  tipoProteina: string;
  controlStock: boolean;
  stockDisponible: number;
  ocultarSinStock: boolean;
  categoria: { nombre: string; esBebida?: boolean };
  _count?: { detalles: number };
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
    es_acompanamiento_mazorca: p.esAcompanamientoMazorca,
    tipo_proteina: p.tipoProteina,
    control_stock: p.controlStock,
    stock_disponible: p.stockDisponible,
    ocultar_sin_stock: p.ocultarSinStock,
    es_bebida: p.categoria.esBebida ?? false,
    total_usos_pedido: p._count?.detalles ?? 0,
  };
}

@Injectable()
export class ProductosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: PedidosGateway,
  ) {}

  private async asegurarUnicoMazorca(
    idProducto: number,
    esMazorca: boolean,
  ): Promise<void> {
    if (!esMazorca) return;
    await this.prisma.producto.updateMany({
      where: {
        esAcompanamientoMazorca: true,
        idProducto: { not: idProducto },
      },
      data: { esAcompanamientoMazorca: false },
    });
    await this.prisma.configOperativa.upsert({
      where: { id: 1 },
      create: { id: 1, idProductoMazorca: idProducto },
      update: { idProductoMazorca: idProducto },
    });
    invalidateMazorcaProductIdCache();
  }

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
      include: {
        categoria: { select: { nombre: true, esBebida: true } },
        ...(incluirInactivos
          ? { _count: { select: { detalles: true } } }
          : {}),
      },
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
    const flags = resolverFlagsProducto(cat, {
      es_plato_principal: dto.es_plato_principal,
      es_empacable: dto.es_empacable,
    });
    const esMazorca = Boolean(dto.es_acompanamiento_mazorca);
    const created = await this.prisma.producto.create({
      data: {
        idCategoria: dto.id_categoria,
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        precio: dto.precio,
        esPlatoPrincipal: flags.esPlatoPrincipal,
        esEmpacable: flags.esEmpacable,
        esAcompanamientoMazorca: esMazorca,
        tipoProteina: dto.tipo_proteina ?? 'ninguno',
        activo: true,
        ...(dto.control_stock != null ? { controlStock: dto.control_stock } : {}),
        ...(dto.stock_disponible != null
          ? { stockDisponible: Math.round(dto.stock_disponible) }
          : {}),
        ...(dto.ocultar_sin_stock != null
          ? { ocultarSinStock: dto.ocultar_sin_stock }
          : {}),
      },
      include: { categoria: { select: { nombre: true, esBebida: true } } },
    });
    if (esMazorca) {
      await this.asegurarUnicoMazorca(created.idProducto, true);
    }
    this.gateway.emitConfigActualizada('menu');
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
    let cat = existing.categoria;
    if (dto.id_categoria != null) {
      const nueva = await this.prisma.categoria.findUnique({
        where: { idCategoria: dto.id_categoria },
      });
      if (!nueva) {
        throw new BadRequestException('Categoría no encontrada');
      }
      cat = nueva;
    }
    const flags = resolverFlagsProducto(
      cat,
      {
        es_plato_principal: dto.es_plato_principal,
        es_empacable: dto.es_empacable,
      },
      {
        esPlatoPrincipal: existing.esPlatoPrincipal,
        esEmpacable: existing.esEmpacable,
      },
    );
    const esMazorca =
      dto.es_acompanamiento_mazorca != null
        ? dto.es_acompanamiento_mazorca
        : existing.esAcompanamientoMazorca;
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
        esPlatoPrincipal: flags.esPlatoPrincipal,
        esEmpacable: flags.esEmpacable,
        esAcompanamientoMazorca: esMazorca,
        ...(dto.tipo_proteina != null ? { tipoProteina: dto.tipo_proteina } : {}),
        ...(dto.control_stock != null ? { controlStock: dto.control_stock } : {}),
        ...(dto.stock_disponible != null
          ? { stockDisponible: Math.round(dto.stock_disponible) }
          : {}),
        ...(dto.ocultar_sin_stock != null
          ? { ocultarSinStock: dto.ocultar_sin_stock }
          : {}),
      },
      include: { categoria: { select: { nombre: true, esBebida: true } } },
    });
    if (dto.es_acompanamiento_mazorca != null) {
      await this.asegurarUnicoMazorca(idProducto, esMazorca);
    }
    this.gateway.emitConfigActualizada('menu');
    return mapProducto(updated);
  }

  async desactivar(idProducto: number) {
    const result = await this.actualizar(idProducto, { activo: false });
    return result;
  }

  async eliminarPermanente(idProducto: number) {
    const existing = await this.prisma.producto.findUnique({
      where: { idProducto },
      include: { _count: { select: { detalles: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Producto no encontrado');
    }
    if (existing._count.detalles > 0) {
      throw new ConflictException(
        'Tiene historial de pedidos — no se puede eliminar; solo ocultar del menú',
      );
    }
    const cfg = await this.prisma.configOperativa.findFirst({
      where: {
        OR: [
          { idProductoMazorca: idProducto },
          { idProductoSodaAlmuerzo: idProducto },
          { idProductoCuotaPendiente: idProducto },
        ],
      },
    });
    if (cfg) {
      throw new ConflictException(
        'El producto está referenciado en la configuración del sistema',
      );
    }
    if (existing.esAcompanamientoMazorca) {
      await this.prisma.configOperativa.updateMany({
        where: { idProductoMazorca: idProducto },
        data: { idProductoMazorca: null },
      });
      invalidateMazorcaProductIdCache();
    }
    await this.prisma.producto.delete({ where: { idProducto } });
    this.gateway.emitConfigActualizada('menu');
    return { ok: true, id_producto: idProducto };
  }
}
