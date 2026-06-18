import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { categoriaDisponibleEnDia } from '../common/categoria-dia';
import { weekdayBogota } from '../common/timezone';
import type { Categoria } from '@prisma/client';

function categoriaDisponibleHoy(cat: Categoria, weekday: number): boolean {
  return categoriaDisponibleEnDia(cat, weekday);
}

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async menuHoy() {
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
      .filter((c) => categoriaDisponibleHoy(c, weekday))
      .map((c) => ({
        id_categoria: c.idCategoria,
        nombre: c.nombre,
        productos: c.productos.map((p) => ({
          id_producto: p.idProducto,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: Number(p.precio),
          activo: p.activo,
          es_plato_principal: p.esPlatoPrincipal,
          es_empacable: p.esEmpacable,
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

    return { categorias: out };
  }
}
