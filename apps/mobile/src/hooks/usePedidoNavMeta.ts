import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

type PedidoNavMeta = {
  idMesa: number;
  mesaNumero: number;
};

const metaPorPedido = new Map<string, PedidoNavMeta>();

/** Metadatos del pedido activo (cache en memoria para la barra de navegación). */
export function usePedidoNavMeta(pedidoId: string | null) {
  const { token } = useAuth();
  const [meta, setMeta] = useState<PedidoNavMeta | null>(() =>
    pedidoId != null ? (metaPorPedido.get(pedidoId) ?? null) : null,
  );

  useEffect(() => {
    if (pedidoId == null || !token) {
      setMeta(null);
      return;
    }
    const cached = metaPorPedido.get(pedidoId);
    if (cached != null) {
      setMeta(cached);
      return;
    }
    let cancelled = false;
    api<{ id_mesa: number; mesa_numero: number }>(`/pedidos/${pedidoId}`, {
      token,
      cacheKey: `pedido_${pedidoId}`,
    })
      .then((p) => {
        if (cancelled) return;
        const row = { idMesa: p.id_mesa, mesaNumero: p.mesa_numero };
        metaPorPedido.set(pedidoId, row);
        setMeta(row);
      })
      .catch(() => {
        if (!cancelled) setMeta(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pedidoId, token]);

  return {
    idMesa: meta?.idMesa ?? null,
    mesaNumero: meta?.mesaNumero ?? null,
  };
}
