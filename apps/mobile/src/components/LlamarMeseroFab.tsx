import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { useFabBottomOffset } from '../hooks/useFabBottomOffset';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../context/AuthContext';
import { useRefetchOnSync } from '../hooks/useRefetchOnSync';
import { puedeVerCocina } from '../hooks/usePuedeTomarPedidos';
import { api } from '../lib/api';
import { tituloLugarMesa } from '../lib/mesa-label';
import {
  ordenarPedidosCocinaPorLlegada,
  pedidoActivoEnCocina,
  type PedidoCocinaView,
} from '../lib/cocina-pedido-view';
import { joinPedidoRooms } from '../lib/pedido-sync';
import {
  getCachedCocinaQueue,
  loadCocinaQueue,
  subscribeCocinaQueue,
} from '../lib/cocina-queue-store';
import { appShadow } from '../lib/shadow';
import { useVisualTheme } from '../context/VisualThemeContext';
import { manejarErrorAccion } from '../lib/recurso-disponible';

type CocinaResponse = {
  pedidos: PedidoCocinaView[];
};

function nombreMeseroCorto(p: PedidoCocinaView): string {
  const m = p.mesero;
  if (!m) return 'Mesero';
  const nombre = (m.nombre ?? '').trim();
  const apellido = (m.apellido ?? '').trim();
  if (!nombre && !apellido) return 'Mesero';
  if (!apellido) return nombre;
  return `${nombre} ${apellido.charAt(0)}.`;
}

export function LlamarMeseroFab() {
  const pathname = usePathname();
  const fabBottom = useFabBottomOffset();
  const { navSidebar } = useResponsive();
  const { colors } = useVisualTheme();
  const { token, user } = useAuth();
  const puedeVer = puedeVerCocina(user?.rol);
  const enCocina = pathname.includes('/cocina');
  const [items, setItems] = useState<PedidoCocinaView[]>([]);
  const [llamandoId, setLlamandoId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!puedeVer || !enCocina) {
      setItems([]);
      return;
    }
    const cached = getCachedCocinaQueue();
    if (cached) {
      setItems(cached);
    }
    const pedidos = await loadCocinaQueue(() =>
      api<CocinaResponse | PedidoCocinaView[]>('/pedidos/cocina', {
        token,
        cacheKey: user?.id != null ? `pedidos_cocina_u${user.id}` : 'pedidos_cocina',
      }),
    );
    setItems(pedidos);
  }, [token, user?.id, puedeVer, enCocina]);

  useEffect(() => {
    if (!enCocina || !puedeVer) return;
    return subscribeCocinaQueue(setItems);
  }, [enCocina, puedeVer]);

  useEffect(() => {
    if (!enCocina || !puedeVer) return;
    joinPedidoRooms({ cocina: true });
  }, [enCocina, puedeVer]);

  useEffect(() => {
    if (!enCocina || !puedeVer) {
      setItems([]);
      return;
    }
    void load().catch(() => undefined);
  }, [load, enCocina, puedeVer]);

  useRefetchOnSync(load, { enabled: enCocina && puedeVer, source: 'pedido' });

  const pedidoPrimeroEnCola = useMemo(() => {
    const cola = ordenarPedidosCocinaPorLlegada(items.filter(pedidoActivoEnCocina));
    return cola[0] ?? null;
  }, [items]);

  async function llamarMesero(idPedido: number) {
    setLlamandoId(idPedido);
    try {
      await api(`/pedidos/${idPedido}/llamar-mesero`, {
        method: 'POST',
        token,
      });
      await load();
    } catch (e) {
      await manejarErrorAccion(e, 'llamar al mesero');
    } finally {
      setLlamandoId(null);
    }
  }

  if (!enCocina || !puedeVer || !pedidoPrimeroEnCola) {
    return null;
  }

  // En tablet/escritorio la acción vive en la barra derecha de cocina.
  if (navSidebar) {
    return null;
  }

  const busy = llamandoId === pedidoPrimeroEnCola.id_pedido;
  const lugar = tituloLugarMesa(pedidoPrimeroEnCola.mesa_numero);
  const mesero = nombreMeseroCorto(pedidoPrimeroEnCola);

  return (
    <Pressable
      onPress={() => llamarMesero(pedidoPrimeroEnCola.id_pedido)}
      disabled={busy}
      style={({ pressed }) => [
        styles.fab,
        { bottom: fabBottom, backgroundColor: colors.cocina },
        pressed && styles.fabPressed,
        busy && styles.fabBusy,
        appShadow('dialog'),
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        busy ? 'Avisando al mesero' : `Avisar mesero · ${lugar} · ${mesero}`
      }
    >
      <Ionicons
        name={busy ? 'hourglass-outline' : 'megaphone'}
        size={26}
        color={colors.onPrimary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    left: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 900,
  },
  fabPressed: {
    opacity: 0.88,
  },
  fabBusy: {
    opacity: 0.65,
  },
});
