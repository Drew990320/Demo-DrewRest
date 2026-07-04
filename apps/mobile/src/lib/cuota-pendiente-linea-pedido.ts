import type { CategoriaLocal } from '../data/local-menu-seed';
import type { Producto } from './local-api-types';
import { inferirReglasCategoriaDesdeNombre } from '@la-reserva/shared-domain/categoria-reglas';
import {
  NOMBRE_PRODUCTO_CUOTA_PENDIENTE,
  formatCuotaPendienteNota,
} from '@la-reserva/shared-domain/cuota-pendiente-reparto';

export { formatCuotaPendienteNota, NOMBRE_PRODUCTO_CUOTA_PENDIENTE };

export function idProductoCuotaPendienteLocal(
  productos: Producto[],
  idConfigurado?: number | null,
): number | undefined {
  if (idConfigurado != null) {
    const cfg = productos.find((p) => p.id_producto === idConfigurado);
    if (cfg) return cfg.id_producto;
  }
  const porFlag = productos.find((p) => p.es_cuota_pendiente_reparto);
  if (porFlag) return porFlag.id_producto;
  return productos.find((p) => p.nombre === NOMBRE_PRODUCTO_CUOTA_PENDIENTE)
    ?.id_producto;
}

export function ensureProductoCuotaPendienteLocal(
  productos: Producto[],
  categorias: CategoriaLocal[],
  nextProductoId: () => number,
  idConfigurado?: number | null,
): number {
  const existente = idProductoCuotaPendienteLocal(productos, idConfigurado);
  if (existente != null) {
    const p = productos.find((x) => x.id_producto === existente)!;
    p.es_cuota_pendiente_reparto = true;
    return existente;
  }

  let cat = categorias.find((c) => c.nombre === 'Ajustes');
  if (!cat) {
    const reglas = inferirReglasCategoriaDesdeNombre('Ajustes');
    const id = Math.max(0, ...categorias.map((c) => c.id_categoria)) + 1;
    cat = {
      id_categoria: id,
      nombre: 'Ajustes',
      es_bebida: reglas.es_bebida,
      cobra_empaque_para_llevar: false,
      participa_descuento_sopas: false,
      es_linea_empaque: reglas.es_linea_empaque,
      visible_en_mostrador: false,
      tipo_linea_cocina_default: 'adicional',
      es_plato_principal_default: false,
      disponible_lunes: false,
      disponible_martes: false,
      disponible_miercoles: false,
      disponible_jueves: false,
      disponible_viernes: false,
      disponible_sabado: false,
      disponible_domingo: false,
    };
    categorias.push(cat);
  }

  const id = nextProductoId();
  productos.push({
    id_producto: id,
    id_categoria: cat.id_categoria,
    categoria_nombre: cat.nombre,
    nombre: NOMBRE_PRODUCTO_CUOTA_PENDIENTE,
    descripcion: 'Cuota omitida en reparto por personas o combinado',
    precio: 0,
    activo: true,
    es_plato_principal: false,
    es_empacable: false,
    es_acompanamiento_mazorca: false,
    es_cuota_pendiente_reparto: true,
    opciones: [],
  });
  return id;
}
