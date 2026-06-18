import { Injectable, NotFoundException } from '@nestjs/common';
import type { Categoria } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  private mapCategoriaAdmin(c: Categoria) {
    return {
      id_categoria: c.idCategoria,
      nombre: c.nombre,
      disponible_lunes: c.disponibleLunes,
      disponible_martes: c.disponibleMartes,
      disponible_miercoles: c.disponibleMiercoles,
      disponible_jueves: c.disponibleJueves,
      disponible_viernes: c.disponibleViernes,
      disponible_sabado: c.disponibleSabado,
      disponible_domingo: c.disponibleDomingo,
    };
  }

  async listarTodasAdmin() {
    const rows = await this.prisma.categoria.findMany({
      orderBy: { nombre: 'asc' },
    });
    return rows.map((c) => this.mapCategoriaAdmin(c));
  }

  async actualizar(idCategoria: number, dto: UpdateCategoriaDto) {
    const existing = await this.prisma.categoria.findUnique({
      where: { idCategoria },
    });
    if (!existing) {
      throw new NotFoundException('Categoría no encontrada');
    }
    const updated = await this.prisma.categoria.update({
      where: { idCategoria },
      data: {
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
    return this.mapCategoriaAdmin(updated);
  }
}
