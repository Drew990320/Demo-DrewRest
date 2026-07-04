import {
  categoriaEsBebida,
  categoriaEsLineaEmpaque,
} from './categoria-reglas';
import { esDetalleMazorcaAcompanamiento } from './mazorca-pedido';

/**
 * Secciones fijas para listar / imprimir pedidos y facturas:
 * mazorcas → platos fuertes → menú infantil → entradas → bebidas → empacables.
 */
export type SeccionLineaPedido =
  | 'mazorca'
  | 'plato_fuerte'
  | 'menu_infantil'
  | 'entrada'
  | 'bebida'
  | 'empacable';

const ORDEN_SECCION: Record<SeccionLineaPedido, number> = {
  mazorca: 0,
  plato_fuerte: 1,
  menu_infantil: 2,
  entrada: 3,
  bebida: 4,
  empacable: 5,
};

export type LineaPedidoOrdenInput = {
  id_detalle?: number;
  nombre_producto?: string;
  categoria_nombre?: string;
  es_acompanamiento_mazorca?: boolean;
  esAcompanamientoMazorca?: boolean;
  es_plato_principal?: boolean;
  esPlatoPrincipal?: boolean;
  es_bebida?: boolean;
  esBebida?: boolean;
  es_empacable?: boolean;
  esEmpacable?: boolean;
};

function nombreEsMazorca(nombre?: string): boolean {
  return (nombre ?? '').trim().toLowerCase().includes('mazorca');
}

function categoriaEsMenuInfantil(cat?: string): boolean {
  const c = (cat ?? '').trim().toLowerCase();
  return c === 'menú infantil' || c === 'menu infantil';
}

function categoriaEsPlatoFuerte(
  cat?: string,
  esPlatoPrincipal?: boolean,
): boolean {
  if (esPlatoPrincipal) return true;
  return (cat ?? '').trim().startsWith('Platos fuertes');
}

function categoriaEsEntrada(cat?: string): boolean {
  const c = (cat ?? '').trim().toLowerCase();
  return c.includes('entrada') || c.includes('adicional');
}

export function seccionLineaPedido(d: LineaPedidoOrdenInput): SeccionLineaPedido {
  if (esDetalleMazorcaAcompanamiento(d) || nombreEsMazorca(d.nombre_producto)) {
    return 'mazorca';
  }

  const empacable = Boolean(d.es_empacable ?? d.esEmpacable);
  const cat = d.categoria_nombre ?? '';

  if (empacable || categoriaEsLineaEmpaque(cat)) {
    return 'empacable';
  }

  const bebida = d.es_bebida ?? d.esBebida;
  if (bebida === true || categoriaEsBebida(cat)) {
    return 'bebida';
  }

  if (
    categoriaEsPlatoFuerte(cat, d.es_plato_principal ?? d.esPlatoPrincipal)
  ) {
    return 'plato_fuerte';
  }

  if (categoriaEsMenuInfantil(cat)) {
    return 'menu_infantil';
  }

  if (categoriaEsEntrada(cat)) {
    return 'entrada';
  }

  // Sopa, para compartir, etc.: con entradas, antes de bebidas.
  return 'entrada';
}

export function ordenSeccionLineaPedido(seccion: SeccionLineaPedido): number {
  return ORDEN_SECCION[seccion];
}

export function compararLineasPedidoPorSeccion(
  a: LineaPedidoOrdenInput,
  b: LineaPedidoOrdenInput,
): number {
  const sa = ordenSeccionLineaPedido(seccionLineaPedido(a));
  const sb = ordenSeccionLineaPedido(seccionLineaPedido(b));
  if (sa !== sb) return sa - sb;
  return (a.id_detalle ?? 0) - (b.id_detalle ?? 0);
}

export function ordenarLineasPedidoPorSeccion<T extends LineaPedidoOrdenInput>(
  detalles: T[],
): T[] {
  return [...detalles].sort(compararLineasPedidoPorSeccion);
}
