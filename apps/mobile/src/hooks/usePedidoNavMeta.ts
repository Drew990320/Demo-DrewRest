import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const mesaPorPedido = new Map<string, number>();

/** id_mesa del pedido activo (cache en memoria para la barra de pedido). */
export function usePedidoNavMeta(pedidoId: string | null) {
  const { token } = useAuth();
  const [idMesa, setIdMesa] = useState<number | null>(() =>
    pedidoId != null ? (mesaPorPedido.get(pedidoId) ?? null) : null,
  );

  useEffect(() => {
    if (pedidoId == null || !token) {
      setIdMesa(null);
      return;
    }
    const cached = mesaPorPedido.get(pedidoId);
    if (cached != null) {
      setIdMesa(cached);
      return;
    }
    let cancelled = false;
    api<{ id_mesa: number }>(`/pedidos/${pedidoId}`, {
      token,
      cacheKey: `pedido_${pedidoId}`,
    })
      .then((p) => {
        if (cancelled) return;
        mesaPorPedido.set(pedidoId, p.id_mesa);
        setIdMesa(p.id_mesa);
      })
      .catch(() => {
        if (!cancelled) setIdMesa(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pedidoId, token]);

  return { idMesa };
}
