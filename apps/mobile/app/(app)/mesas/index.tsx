import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../../src/context/AuthContext';
import { AnimatedEnter } from '../../../src/components/AnimatedEnter';
import { AnimatedPressable } from '../../../src/components/AnimatedPressable';
import { IconTooltipButton } from '../../../src/components/IconTooltipButton';
import { NavIcon } from '../../../src/lib/app-icons';
import { api } from '../../../src/lib/api';
import { showBriefNotice } from '../../../src/lib/app-dialog';
import { etiquetaMesaNumero, tituloLugarMesa } from '../../../src/lib/mesa-label';
import { appShadow } from '../../../src/lib/shadow';
import { blurWebFocus } from '../../../src/lib/web-a11y';
import {
  gridItemWidth,
  useResponsive,
} from '../../../src/hooks/useResponsive';
import { useRefetchOnSync } from '../../../src/hooks/useRefetchOnSync';
import type { MisActivosResumen } from '../../../src/lib/mis-activos-resumen';
import { subscribeCocinaLlamaMesero, subscribeCompaneroAgregoItems, resumenLineasAgregadas, tituloCocinaLlamaMesero, mensajeCocinaLlamaMesero } from '../../../src/lib/pedido-sync';
import {
  puedeTomarPedidos,
  puedeVerCocina,
  puedeVerMisPedidos,
} from '../../../src/hooks/usePuedeTomarPedidos';

type MesaRow = {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
  mesero?: { nombre: string; apellido: string } | null;
};

function etiquetaMeseroCorto(
  mesero: { nombre: string; apellido: string } | null | undefined,
) {
  if (!mesero) return null;
  const nombre = mesero.nombre.trim();
  return nombre || null;
}

function subtituloMesa(
  estado: string,
  mesero: { nombre: string; apellido: string } | null | undefined,
) {
  if (estado === 'libre') return 'Disponible';
  if (estado === 'ocupada') {
    return etiquetaMeseroCorto(mesero) ?? 'Ocupada';
  }
  return estado;
}

export default function MesasScreen() {
  const { token, logout, user } = useAuth();
  const router = useRouter();
  const r = useResponsive();
  const [mesas, setMesas] = useState<MesaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pedidosMostrador, setPedidosMostrador] = useState(0);
  const [pedidosParaLlevar, setPedidosParaLlevar] = useState(0);
  const [platosSinPasarCocina, setPlatosSinPasarCocina] = useState(0);
  const [platosParaRecoger, setPlatosParaRecoger] = useState(0);
  const [platosAyudaCompaneros, setPlatosAyudaCompaneros] = useState(0);

  const cardWidth = gridItemWidth(r.contentWidth, r.gridColumns, r.gridGap);

  const esChef = user?.rol === 'chef';
  const tomaPedidos = puedeTomarPedidos(user?.rol);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (esChef) {
      router.replace('/(app)/cocina');
    }
  }, [esChef, router]);

  const load = useCallback(async () => {
    const data = await api<MesaRow[]>('/mesas', { token, cacheKey: 'mesas' });
    setMesas(data);
  }, [token]);

  const loadContadoresVirtuales = useCallback(async () => {
    if (!tomaPedidos || user?.id == null) {
      setPedidosMostrador(0);
      setPedidosParaLlevar(0);
      setPlatosSinPasarCocina(0);
      setPlatosParaRecoger(0);
      setPlatosAyudaCompaneros(0);
      return;
    }
    try {
      const [raw, ayuda] = await Promise.all([
        api<MisActivosResumen>('/pedidos/mis-activos/resumen', {
          token,
          cacheKey: `mis_activos_resumen_u${user.id}`,
        }),
        puedeVerMisPedidos(user.rol)
          ? api<{ platos_para_recoger: number }>('/pedidos/ayuda-companeros/resumen', {
              token,
              cacheKey: `ayuda_companeros_resumen_u${user.id}`,
            }).catch(() => ({ platos_para_recoger: 0 }))
          : Promise.resolve({ platos_para_recoger: 0 }),
      ]);
      setPedidosMostrador(raw.pedidos_mostrador ?? 0);
      setPedidosParaLlevar(raw.pedidos_para_llevar ?? 0);
      setPlatosSinPasarCocina(raw.platos_sin_pasar_cocina ?? 0);
      setPlatosParaRecoger(raw.platos_para_recoger ?? 0);
      setPlatosAyudaCompaneros(ayuda.platos_para_recoger ?? 0);
    } catch {
      setPedidosMostrador(0);
      setPedidosParaLlevar(0);
      setPlatosSinPasarCocina(0);
      setPlatosParaRecoger(0);
      setPlatosAyudaCompaneros(0);
    }
  }, [token, tomaPedidos, user?.id]);

  const refetchMesas = useCallback(async () => {
    await Promise.all([load(), loadContadoresVirtuales()]);
  }, [load, loadContadoresVirtuales]);

  useRefetchOnSync(refetchMesas, { source: 'mesas', enabled: !esChef });
  useRefetchOnSync(refetchMesas, { source: 'local-mesas', enabled: !esChef });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          await Promise.all([load(), loadContadoresVirtuales()]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [load, loadContadoresVirtuales]),
  );

  useEffect(() => {
    if (!puedeVerMisPedidos(user?.rol) || user?.id == null) return;
    return subscribeCocinaLlamaMesero((payload) => {
      if (payload.idMesero !== user.id) return;
      const tipo = payload.tipo_listo ?? 'plato';
      void showBriefNotice(
        tituloCocinaLlamaMesero(tipo),
        mensajeCocinaLlamaMesero(payload, { incluirMesa: false }),
        'info',
      );
      if (isFocused) {
        loadContadoresVirtuales().catch(() => undefined);
      }
    });
  }, [user?.id, user?.rol, loadContadoresVirtuales, isFocused]);

  useEffect(() => {
    if (!puedeVerMisPedidos(user?.rol) || user?.id == null) return;
    return subscribeCompaneroAgregoItems((payload) => {
      if (payload.idMeseroDueno !== user.id) return;
      void showBriefNotice(
        'Tu mesa fue actualizada',
        `${payload.meseroQuienAgregoNombre} agregó ${resumenLineasAgregadas(payload.lineas)} en ${tituloLugarMesa(payload.mesaNumero)} · pedido #${payload.pedidoId}`,
        'info',
      );
      if (isFocused) {
        loadContadoresVirtuales().catch(() => undefined);
      }
    });
  }, [user?.id, user?.rol, loadContadoresVirtuales, isFocused]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([load(), loadContadoresVirtuales()]);
    } finally {
      setRefreshing(false);
    }
  }

  function estadoColor(estado: string) {
    if (estado === 'libre') return '#1b5e20';
    if (estado === 'ocupada') return '#b71c1c';
    return '#6c757d';
  }

  function cardVisual(estado: string) {
    if (estado === 'libre') {
      return {
        backgroundColor: '#e8f5e9',
        borderColor: '#2e7d32',
        borderWidth: 2,
      };
    }
    if (estado === 'ocupada') {
      return {
        backgroundColor: '#ffebee',
        borderColor: '#c62828',
        borderWidth: 2,
      };
    }
    return {
      backgroundColor: '#fff',
      borderColor: '#e3e0d7',
      borderWidth: 1,
    };
  }

  function rolLabel(rol: string | undefined) {
    if (!rol) return '';
    if (rol === 'mesero') return 'Mesero';
    if (rol === 'chef') return 'Cocina';
    if (rol === 'admin') return 'Administrador';
    return rol;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: r.contentPadding, paddingTop: r.contentPadding },
      ]}
    >
      <View style={styles.topBar}>
        <Text style={[styles.greeting, { fontSize: r.fontSize.body }]}>
          {user?.nombre} · {rolLabel(user?.rol)}
        </Text>
        <View
          style={[
            styles.actions,
            { gap: r.isCompact ? 8 : 10, marginTop: r.isCompact ? 6 : 8 },
          ]}
        >
          {user?.rol === 'admin' && (
            <>
              <IconTooltipButton
                icon={NavIcon.usuarios}
                label="Usuarios"
                onPress={() => router.push('/(app)/usuarios')}
              />
              <IconTooltipButton
                icon={NavIcon.editarMenu}
                label="Editar menú"
                onPress={() => router.push('/(app)/menu-admin')}
              />
              <IconTooltipButton
                icon={NavIcon.diasMenu}
                label="Días del menú"
                onPress={() => router.push('/(app)/categorias-admin')}
              />
              <IconTooltipButton
                icon={NavIcon.gestionarMesas}
                label="Gestionar mesas"
                onPress={() => router.push('/(app)/mesas-admin')}
              />
              <IconTooltipButton
                icon={NavIcon.resumenDiario}
                label="Resumen diario"
                onPress={() => router.push('/(app)/resumen-diario')}
              />
            </>
          )}
          {puedeVerMisPedidos(user?.rol) && (
            <>
              <IconTooltipButton
                icon={NavIcon.misPedidos}
                label="Mis pedidos"
                badge={
                  platosParaRecoger > 0
                    ? platosParaRecoger
                    : platosSinPasarCocina > 0
                      ? platosSinPasarCocina
                      : undefined
                }
                onPress={() => router.push('/(app)/mis-pedidos')}
              />
              <IconTooltipButton
                icon={NavIcon.ayudaCompaneros}
                label="Ayudar a compañeros"
                badge={
                  platosAyudaCompaneros > 0 ? platosAyudaCompaneros : undefined
                }
                onPress={() => router.push('/(app)/ayuda-companeros')}
              />
            </>
          )}
          {tomaPedidos && (
            <>
              <IconTooltipButton
                icon={NavIcon.mostrador}
                label="Mostrador"
                badge={pedidosMostrador > 0 ? pedidosMostrador : undefined}
                onPress={() => router.push('/(app)/mostrador')}
              />
              <IconTooltipButton
                icon={NavIcon.paraLlevar}
                label="Pedidos para llevar"
                badge={pedidosParaLlevar > 0 ? pedidosParaLlevar : undefined}
                onPress={() => router.push('/(app)/para-llevar')}
              />
            </>
          )}
          {puedeVerCocina(user?.rol) && (
            <IconTooltipButton
              icon={NavIcon.cocina}
              label="Cocina"
              onPress={() => router.push('/(app)/cocina')}
            />
          )}
          <IconTooltipButton
            icon={NavIcon.cerrarSesion}
            label="Cerrar sesión"
            variant="danger"
            onPress={async () => {
              await logout();
              router.replace('/(auth)/login');
            }}
          />
        </View>
      </View>

      {platosParaRecoger > 0 && puedeVerMisPedidos(user?.rol) ? (
        <Pressable
          style={styles.alertaRecoger}
          onPress={() => router.push('/(app)/mis-pedidos')}
        >
          <Text style={styles.alertaRecogerTitle}>Ve a recoger en cocina</Text>
          <Text style={styles.alertaRecogerSub}>
            Cocina tiene {platosParaRecoger}{' '}
            {platosParaRecoger === 1 ? 'plato listo' : 'platos listos'} esperándote.
            Toca aquí para ver tus pedidos.
          </Text>
        </Pressable>
      ) : null}

      {platosSinPasarCocina > 0 && puedeVerMisPedidos(user?.rol) ? (
        <Pressable
          style={styles.alertaCocina}
          onPress={() => router.push('/(app)/mis-pedidos')}
        >
          <Text style={styles.alertaCocinaTitle}>Recuerda pasar a cocina</Text>
          <Text style={styles.alertaCocinaSub}>
            Tienes {platosSinPasarCocina}{' '}
            {platosSinPasarCocina === 1 ? 'plato' : 'platos'} sin enviar a cocina.
            Toca aquí para revisar tus pedidos.
          </Text>
        </Pressable>
      ) : null}

      {platosAyudaCompaneros > 0 && puedeVerMisPedidos(user?.rol) ? (
        <Pressable
          style={styles.alertaAyuda}
          onPress={() => router.push('/(app)/ayuda-companeros')}
        >
          <Text style={styles.alertaAyudaTitle}>Un compañero necesita ayuda</Text>
          <Text style={styles.alertaAyudaSub}>
            Hay {platosAyudaCompaneros}{' '}
            {platosAyudaCompaneros === 1 ? 'plato' : 'platos'} de otros meseros pendientes
            de recoger. Puedes confirmarlos en mesa si su teléfono no responde.
          </Text>
        </Pressable>
      ) : null}

      <Text style={[styles.h1, { fontSize: r.fontSize.h1 }]}>Mesas</Text>
      <Text style={[styles.legend, { fontSize: r.fontSize.small }]}>
        Verde = disponible · Rojo = ocupada (nombre del mesero) · Se actualiza al abrir o
        cerrar pedidos
      </Text>

      <FlatList
        key={`mesas-grid-${r.gridColumns}`}
        data={mesas}
        keyExtractor={(m) => String(m.id_mesa)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        numColumns={r.gridColumns}
        columnWrapperStyle={
          r.gridColumns > 1
            ? { gap: r.gridGap, marginBottom: r.gridGap }
            : undefined
        }
        contentContainerStyle={{ paddingBottom: r.contentPadding }}
        renderItem={({ item, index }) => (
          <AnimatedEnter
            index={index}
            style={{
              width: cardWidth,
              marginBottom: r.gridColumns === 1 ? r.gridGap : 0,
            }}
          >
            <AnimatedPressable
              style={[
                styles.card,
                cardVisual(item.estado),
                {
                  width: '100%',
                  minHeight: r.mesaCardMinHeight,
                  padding: r.isCompact ? 10 : 12,
                },
              ]}
              onPress={() => {
                blurWebFocus();
                router.push(`/(app)/mesa/${item.id_mesa}`);
              }}
            >
              <Text
                style={[styles.cardNum, { fontSize: r.fontSize.cardNum }]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {etiquetaMesaNumero(item.numero)}
              </Text>
              <Text
                style={[
                  styles.cardEst,
                  { color: estadoColor(item.estado), fontSize: r.fontSize.small },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {subtituloMesa(item.estado, item.mesero)}
              </Text>
            </AnimatedPressable>
          </AnimatedEnter>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f4ee' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e2d8',
    borderRadius: 14,
    padding: 12,
  },
  greeting: { color: '#6f6e67', textAlign: 'center', fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertaCocina: {
    marginBottom: 12,
    backgroundColor: '#fff8e6',
    borderWidth: 1,
    borderColor: '#e8c96a',
    borderRadius: 14,
    padding: 12,
  },
  alertaRecoger: {
    marginBottom: 12,
    backgroundColor: '#e8f5ef',
    borderWidth: 1,
    borderColor: '#2f8f5f',
    borderRadius: 14,
    padding: 12,
  },
  alertaRecogerTitle: {
    color: '#1e6b45',
    fontWeight: '800',
    fontSize: 14,
  },
  alertaRecogerSub: {
    marginTop: 4,
    color: '#2f5e4f',
    fontSize: 13,
    lineHeight: 18,
  },
  alertaCocinaTitle: {
    color: '#7a5c1e',
    fontWeight: '800',
    fontSize: 14,
  },
  alertaCocinaSub: {
    marginTop: 4,
    color: '#8a6a1a',
    fontSize: 13,
    lineHeight: 18,
  },
  alertaAyuda: {
    marginBottom: 12,
    backgroundColor: '#eef2f8',
    borderWidth: 1,
    borderColor: '#3d5a80',
    borderRadius: 14,
    padding: 12,
  },
  alertaAyudaTitle: {
    color: '#2c4360',
    fontWeight: '800',
    fontSize: 14,
  },
  alertaAyudaSub: {
    marginTop: 4,
    color: '#3d5a80',
    fontSize: 13,
    lineHeight: 18,
  },
  h1: { fontWeight: '700', marginBottom: 6, color: '#262622' },
  legend: {
    color: '#6f6e67',
    marginBottom: 12,
    lineHeight: 16,
  },
  card: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...appShadow('card'),
  },
  cardNum: {
    fontWeight: '700',
    color: '#262622',
    textAlign: 'center',
  },
  cardEst: {
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
});
