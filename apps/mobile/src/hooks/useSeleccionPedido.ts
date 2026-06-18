import { useEffect, useMemo, useRef, useState } from 'react';

type PedidoConId = { id_pedido: number };

export function useSeleccionPedido<T extends PedidoConId>(
  pedidos: T[],
  preferidoId?: number | null,
) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const preferidoAplicado = useRef(false);

  useEffect(() => {
    preferidoAplicado.current = false;
  }, [preferidoId]);

  useEffect(() => {
    setSelectedId((prev) => {
      if (pedidos.length === 0) return null;
      if (
        !preferidoAplicado.current &&
        preferidoId != null &&
        pedidos.some((p) => p.id_pedido === preferidoId)
      ) {
        preferidoAplicado.current = true;
        return preferidoId;
      }
      if (prev != null && pedidos.some((p) => p.id_pedido === prev)) {
        return prev;
      }
      return pedidos[0].id_pedido;
    });
  }, [pedidos, preferidoId]);

  const selected = useMemo(
    () => pedidos.find((p) => p.id_pedido === selectedId) ?? null,
    [pedidos, selectedId],
  );

  return { selectedId, setSelectedId, selected };
}
