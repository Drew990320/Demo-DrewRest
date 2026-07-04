import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import type { Categoria, TipoLineaCocinaCat } from '@prisma/client';
import { inferirReglasCategoriaDesdeNombre } from '@la-reserva/shared-domain/categoria-reglas';
import { PrismaService } from '../prisma/prisma.service';
import { PedidosGateway } from '../pedidos/pedidos.gateway';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: PedidosGateway,
  ) {}

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
      es_bebida: c.esBebida,
      cobra_empaque_para_llevar: c.cobraEmpaqueParaLlevar,
      participa_descuento_sopas: c.participaDescuentoSopas,
      es_linea_empaque: c.esLineaEmpaque,
      visible_en_mostrador: c.visibleEnMostrador,
      tipo_linea_cocina_default: c.tipoLineaCocinaDefault,
      es_plato_principal_default: c.esPlatoPrincipalDefault,
    };
  }

  async listarTodasAdmin() {
    const rows = await this.prisma.categoria.findMany({
      orderBy: { nombre: 'asc' },
    });
    return rows.map((c) => this.mapCategoriaAdmin(c));
  }

  async crear(dto: CreateCategoriaDto) {
    const nombre = dto.nombre.trim();
    const dup = await this.prisma.categoria.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } },
    });
    if (dup) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    const inferred = inferirReglasCategoriaDesdeNombre(nombre);
    const created = await this.prisma.categoria.create({
      data: {
        nombre,
        disponibleLunes: dto.disponible_lunes ?? true,
        disponibleMartes: dto.disponible_martes ?? true,
        disponibleMiercoles: dto.disponible_miercoles ?? true,
        disponibleJueves: dto.disponible_jueves ?? true,
        disponibleViernes: dto.disponible_viernes ?? true,
        disponibleSabado: dto.disponible_sabado ?? true,
        disponibleDomingo: dto.disponible_domingo ?? true,
        esBebida: dto.es_bebida ?? inferred.es_bebida,
        cobraEmpaqueParaLlevar:
          dto.cobra_empaque_para_llevar ?? inferred.cobra_empaque_para_llevar,
        participaDescuentoSopas:
          dto.participa_descuento_sopas ?? inferred.participa_descuento_sopas,
        esLineaEmpaque: dto.es_linea_empaque ?? inferred.es_linea_empaque,
        visibleEnMostrador:
          dto.visible_en_mostrador ?? inferred.visible_en_mostrador,
        tipoLineaCocinaDefault: (dto.tipo_linea_cocina_default ??
          inferred.tipo_linea_cocina_default) as TipoLineaCocinaCat,
        esPlatoPrincipalDefault:
          dto.es_plato_principal_default ?? inferred.es_plato_principal_default,
      },
    });
    this.gateway.emitConfigActualizada('categorias');
    return this.mapCategoriaAdmin(created);
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
        ...(dto.es_bebida != null ? { esBebida: dto.es_bebida } : {}),
        ...(dto.cobra_empaque_para_llevar != null
          ? { cobraEmpaqueParaLlevar: dto.cobra_empaque_para_llevar }
          : {}),
        ...(dto.participa_descuento_sopas != null
          ? { participaDescuentoSopas: dto.participa_descuento_sopas }
          : {}),
        ...(dto.es_linea_empaque != null
          ? { esLineaEmpaque: dto.es_linea_empaque }
          : {}),
        ...(dto.visible_en_mostrador != null
          ? { visibleEnMostrador: dto.visible_en_mostrador }
          : {}),
        ...(dto.es_plato_principal_default != null
          ? { esPlatoPrincipalDefault: dto.es_plato_principal_default }
          : {}),
        ...(dto.tipo_linea_cocina_default != null
          ? { tipoLineaCocinaDefault: dto.tipo_linea_cocina_default }
          : {}),
      },
    });
    this.gateway.emitConfigActualizada('categorias');
    return this.mapCategoriaAdmin(updated);
  }
}
