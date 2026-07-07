import type { ActionIconItem } from '../components/ActionIconBar';

/**
 * Orden fijo de la barra PEDIDO (tablet+).
 * Debe ser idéntico en mesa, mis pedidos y menú para evitar toques involuntarios.
 */
export type PedidoRailSlot =
  | 'menu'
  | 'cocina'
  | 'reimprimir'
  | 'cobrar'
  | 'navegacion'
  | 'cancelar';

const SLOT_ORDER: PedidoRailSlot[] = [
  'menu',
  'cocina',
  'reimprimir',
  'cobrar',
  'navegacion',
  'cancelar',
];

export function mergePedidoRailActions(
  slots: Partial<Record<PedidoRailSlot, ActionIconItem | ActionIconItem[] | null | undefined>>,
): ActionIconItem[] {
  const out: ActionIconItem[] = [];
  for (const slot of SLOT_ORDER) {
    const items = slots[slot];
    if (!items) continue;
    if (Array.isArray(items)) {
      out.push(...items.filter(Boolean));
    } else {
      out.push(items);
    }
  }
  return out;
}
