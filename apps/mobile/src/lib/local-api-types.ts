import type { TipoProteina } from './cocina-prioridad';

export type Producto = {
  id_producto: number;
  id_categoria: number;
  categoria_nombre: string;
  nombre: string;
  /** Si falta, se considera activo. */
  activo?: boolean;
  descripcion?: string | null;
  precio: number;
  /** Catálogo; si falta, se infiere en runtime (local). */
  tipo_proteina?: TipoProteina;
  es_plato_principal?: boolean;
  es_empacable?: boolean;
  es_acompanamiento_mazorca?: boolean;
  opciones: { id_opcion: number; tipo: string; descripcion: string }[];
};
