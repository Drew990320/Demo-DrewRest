import { Injectable } from '@nestjs/common';
import { normalizarIconoMenuGuardado } from '@la-reserva/shared-domain/categoria-menu-icon';
import { PrismaService } from '../prisma/prisma.service';
import { categoriaDisponibleEnDia } from '../common/categoria-dia';
import {
  getCachedMenuHoy,
  invalidateMenuHoyCache,
  setCachedMenuHoy,
} from '../common/menu-hoy-cache';
import { weekdayBogota } from '../common/timezone';
import {
  productoAgotado,
  productoVisibleEnMenu,
} from '@la-reserva/shared-domain/stock-producto';
import type { Categoria } from '@prisma/client';

function categoriaDisponibleHoy(cat: Categoria, weekday: number): boolean {
  return categoriaDisponibleEnDia(cat, weekday);
}

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  invalidateCache(): void {
    invalidateMenuHoyCache();
  }

  async menuHoy() {
    const cached = getCachedMenuHoy();
    if (cached) {
      return cached;
    }
    const weekday = weekdayBogota();
    const categorias = await this.prisma.categoria.findMany({
      include: {
        productos: {
          where: { activo: true, esAcompanamientoMazorca: false },
          orderBy: { nombre: 'asc' },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    const out = categorias
      .filter((c) => c.activo)
      .filter((c) => categoriaDisponibleHoy(c, weekday))
      .map((c) => ({
        id_categoria: c.idCategoria,
        nombre: c.nombre,
        icono_menu: normalizarIconoMenuGuardado(c.iconoMenu, c.nombre),
        es_bebida: c.esBebida,
        visible_en_mostrador: c.visibleEnMostrador,
        productos: c.productos
          .filter((p) =>
            productoVisibleEnMenu({
              activo: true,
              control_stock: p.controlStock,
              stock_disponible: p.stockDisponible,
              ocultar_sin_stock: p.ocultarSinStock,
            }),
          )
          .map((p) => ({
          id_producto: p.idProducto,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: Number(p.precio),
          activo: p.activo,
          es_plato_principal: p.esPlatoPrincipal,
          es_empacable: p.esEmpacable,
          control_stock: p.controlStock,
          stock_disponible: p.stockDisponible,
          ocultar_sin_stock: p.ocultarSinStock,
          agotado: productoAgotado({
            control_stock: p.controlStock,
            stock_disponible: p.stockDisponible,
          }),
          opciones: [] as {
            id_opcion: number;
            tipo: string;
            descripcion: string;
          }[],
        })),
      }));

    const productIds = out.flatMap((c) => c.productos.map((p) => p.id_producto));
    if (productIds.length === 0) {
      return { categorias: [] };
    }

    const opciones = await this.prisma.personalizacionOpcion.findMany({
      where: { idProducto: { in: productIds } },
      orderBy: [{ tipo: 'asc' }, { idOpcion: 'asc' }],
    });

    const byProduct = new Map<number, typeof opciones>();
    for (const o of opciones) {
      const arr = byProduct.get(o.idProducto) ?? [];
      arr.push(o);
      byProduct.set(o.idProducto, arr);
    }

    for (const cat of out) {
      for (const p of cat.productos) {
        p.opciones = (byProduct.get(p.id_producto) ?? []).map((o) => ({
          id_opcion: o.idOpcion,
          tipo: o.tipo,
          descripcion: o.descripcion,
        }));
      }
    }

    const result = { categorias: out };
    setCachedMenuHoy(result);
    return result;
  }
}
