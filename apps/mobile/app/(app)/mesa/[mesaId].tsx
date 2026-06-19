import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { PantallaSoloMeseros } from '../../../src/components/PantallaSoloMeseros';
import { PedidosActivosChips } from '../../../src/components/PedidosActivosChips';
import { useRequiereTomarPedidos } from '../../../src/hooks/usePuedeTomarPedidos';
import { ActionIconBar } from '../../../src/components/ActionIconBar';
import { AdminIcon, PedidoIcon } from '../../../src/lib/app-icons';
import { IconTooltipButton } from '../../../src/components/IconTooltipButton';
import { api } from '../../../src/lib/api';
import { alertarSiSinPapel } from '../../../src/lib/alarma-impresora';
import {
  confirmAppDialog,
  showAppDialog,
  showNotice,
} from '../../../src/lib/app-dialog';
import { formatCOP } from '../../../src/lib/format';
import { useFormFieldStyle } from '../../../src/hooks/useFormFieldStyle';
import { appShadow } from '../../../src/lib/shadow';
import { tituloLugarMesa } from '../../../src/lib/mesa-label';
import { TransferirPedidoPanel } from '../../../src/components/TransferirPedidoPanel';
import {
  batchAfectaMesa,
  joinPedidoRooms,
} from '../../../src/lib/pedido-sync';
import { useRefetchOnSync } from '../../../src/hooks/useRefetchOnSync';
import { useResponsive } from '../../../src/hooks/useResponsive';
import { useSeleccionPedido } from '../../../src/hooks/useSeleccionPedido';
import { colors } from '../../../src/lib/theme';
import {
  agruparLineasPedido,
  etiquetaEstadoLineaPedido,
  type LineaPedidoGrupo,
} from '../../../src/lib/pedido-detalle-group';
import { enteroConDefecto } from '../../../src/lib/form-validation';
import {
  esDetalleMazorcaAcompanamiento,
  pedidoUsaLineaMazorca,
} from '../../../src/lib/mazorca-pedido';

type PedidoDetalle = {
  id_pedido: number;
  id_mesa: number;
  mesa_numero: number;
  estado: string;
  modo_servicio?: 'en_mesa' | 'para_llevar';
  num_comensales: number;
  detalles: {
    id_detalle: number;
    id_producto?: number;
    id_detalle_padre: number | null;
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
    subtotal_linea: number;
    nota_cocina: string | null;
    es_empacable?: boolean;
    es_plato_principal?: boolean;
    es_bebida?: boolean;
    marcar_cocina?: boolean;
    enviado_cocina?: boolean;
    listo_cocina?: boolean;
    listo_para_recoger?: boolean;
    es_acompanamiento_mazorca?: boolean;
    personalizaciones: { id_opcion?: number; descripcion: string; tipo: string }[];
  }[];
};

type MesaRow = {
  id_mesa: number;
  numero: number;
  estado: string;
};

function placeholderComensalesMesa(_numero: number | undefined): string {
  return '1 (opcional)';
}

export default function MesaDetailScreen() {
  const { mesaId, pedido: pedidoParam } = useLocalSearchParams<{
    mesaId: string;
    pedido?: string;
  }>();
  const idMesa = Number(mesaId);
  const pedidoPreferido =
    pedidoParam != null && pedidoParam !== '' ? Number(pedidoParam) : null;
  const { token } = useAuth();
  const { ok: puedeTomar, loading: authLoading } = useRequiereTomarPedidos();
  const router = useRouter();
  const r = useResponsive();
  const narrowField = useFormFieldStyle('narrow');
  const [mesa, setMesa] = useState<MesaRow | null>(null);
  const [activosLista, setActivosLista] = useState<PedidoDetalle[]>([]);
  const { selectedId: selectedPid, setSelectedId: setSelectedPid, selected: pedido } =
    useSeleccionPedido(activosLista, pedidoPreferido);
  const lineasAgrupadas = useMemo(() => {
    if (!pedido) return [];
    const padres = pedido.detalles.filter((d) => d.id_detalle_padre == null);
    const lineas = agruparLineasPedido(padres, { soloEstadoVisible: true });
    if (mesa && pedidoUsaLineaMazorca(mesa.numero)) {
      return lineas.filter((d) => !esDetalleMazorcaAcompanamiento(d));
    }
    return lineas;
  }, [pedido, mesa]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [comensales, setComensales] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyPasarCocina, setBusyPasarCocina] = useState(false);
  const [busyReimprimir, setBusyReimprimir] = useState(false);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialRows, setHistorialRows] = useState<
    {
      id_historial: number;
      tipo: string;
      detalle: unknown;
      creado_en: string;
      usuario: { nombre: string; apellido: string };
    }[]
  >([]);
  const [historialLoading, setHistorialLoading] = useState(false);

  async function confirmAction(title: string, message: string): Promise<boolean> {
    return confirmAppDialog(title, message);
  }

  const load = useCallback(async () => {
    const [m, list] = await Promise.all([
      api<MesaRow>(`/mesas/${idMesa}`, {
        token,
        cacheKey: `mesa_${idMesa}`,
      }),
      api<PedidoDetalle[]>(`/pedidos/activos-por-mesa/${idMesa}`, {
        token,
        cacheKey: `activos_mesa_${idMesa}`,
      }),
    ]);
    setMesa(m);
    setActivosLista(list);
    return list;
  }, [token, idMesa]);

  const platosPendientesCocina = useMemo(() => {
    if (!pedido) return 0;
    return pedido.detalles.filter(
      (d) => d.marcar_cocina && !d.enviado_cocina,
    ).length;
  }, [pedido]);

  const platosEnCocina = useMemo(() => {
    if (!pedido) return 0;
    return pedido.detalles.filter(
      (d) => d.marcar_cocina && d.enviado_cocina,
    ).length;
  }, [pedido]);

  const esMesaVirtual = mesa?.numero === 98 || mesa?.numero === 99;

  useEffect(() => {
    if (mesa?.numero === 99 || mesa?.numero === 98) {
      setComensales('1');
    }
  }, [mesa?.numero]);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  useEffect(() => {
    joinPedidoRooms({ mesaId: idMesa });
  }, [idMesa]);

  useRefetchOnSync(async () => {
    await load();
  }, {
    source: 'pedido',
    filter: (batch) => batchAfectaMesa(batch, idMesa),
  });

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function abrirMesa() {
    const n = enteroConDefecto(comensales, 1);
    setBusy(true);
    try {
      await api('/pedidos', {
        method: 'POST',
        token,
        body: JSON.stringify({ id_mesa: idMesa, num_comensales: n }),
      });
      setComensales('');
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo abrir');
    } finally {
      setBusy(false);
    }
  }

  async function cancelarPedido() {
    if (!pedido) return;
    const ok = await confirmAction(
      'Cancelar pedido',
      'Esto liberará la mesa y eliminará el pedido (sin cobrar). ¿Continuar?',
    );
    if (!ok) return;

    setBusy(true);
    try {
      await api(`/pedidos/${pedido.id_pedido}/cancelar`, {
        method: 'POST',
        token,
      });
      const list = await load();
      if (list.length > 0) {
        return;
      }
      router.replace(
        mesa?.numero === 99
          ? '/(app)/mostrador'
          : mesa?.numero === 98
            ? '/(app)/para-llevar'
            : '/(app)/mesas',
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo cancelar');
    } finally {
      setBusy(false);
    }
  }

  async function actualizarComensales(numComensales: number) {
    if (!pedido || numComensales < 1) return;
    setBusy(true);
    try {
      await api(`/pedidos/${pedido.id_pedido}/mazorcas`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ num_comensales: numComensales }),
      });
      await load();
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'No se pudo actualizar comensales',
      );
    } finally {
      setBusy(false);
    }
  }

  async function reimprimirComandaCocina() {
    if (!pedido) return;
    setBusyReimprimir(true);
    try {
      const res = await api<{
        impresion_comanda?: {
          impreso: boolean;
          error?: string;
          destino?: string;
          codigo_error?: string;
        };
      }>(`/pedidos/${pedido.id_pedido}/reimprimir-comanda`, {
        method: 'POST',
        token,
      });
      if (alertarSiSinPapel(res)) {
        return;
      }
      const imp = res.impresion_comanda;
      if (imp?.impreso) {
        await showNotice(
          'Comanda reimpresa',
          `Ticket impreso (${imp.destino ?? 'impresora'}). Marca REIMPRESIÓN en el papel.`,
          'success',
        );
      } else {
        await showNotice(
          'Sin imprimir',
          imp?.error ?? 'No se pudo reimprimir la comanda de cocina.',
          'error',
        );
      }
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'No se pudo reimprimir',
      );
    } finally {
      setBusyReimprimir(false);
    }
  }

  async function pasarACocina() {
    if (!pedido) return;
    setBusyPasarCocina(true);
    try {
      const res = await api<{
        ok: boolean;
        es_adicional?: boolean;
        impreso: boolean;
        impresion_en_cola?: boolean;
        impresora_destino?: string | null;
        error_impresion: string | null;
        codigo_error_impresion?: string | null;
        pedido?: PedidoDetalle;
      }>(`/pedidos/${pedido.id_pedido}/pasar-cocina`, {
        method: 'POST',
        token,
      });
      if (res.pedido) {
        setActivosLista((prev) =>
          prev.map((p) =>
            p.id_pedido === res.pedido!.id_pedido ? res.pedido! : p,
          ),
        );
      }
      if (res.impresion_en_cola) {
        await showNotice(
          'Cocina',
          res.es_adicional
            ? 'Platos adicionales enviados. La comanda adicional se imprime en cola (solo los platos nuevos).'
            : 'Platos enviados. La comanda se imprime en cola (puede tardar unos segundos si hay otros tickets).',
          'success',
        );
        return;
      }
      if (alertarSiSinPapel(res)) {
        await showAppDialog({
          title: 'Enviado a cocina (sin imprimir)',
          message: 'Sin papel en la impresora. Los platos ya están en cocina.',
          variant: 'warning',
          buttons: [
            { text: 'Entendido', style: 'cancel' },
            {
              text: 'Reimprimir comanda',
              style: 'primary',
              onPress: () => reimprimirComandaCocina(),
            },
          ],
        });
        return;
      }
      if (res.impreso) {
        await showNotice(
          'Cocina',
          res.es_adicional
            ? `Comanda adicional impresa (${res.impresora_destino ?? 'impresora'}). Solo los platos nuevos, sin precios.`
            : `Comanda impresa (${res.impresora_destino ?? 'impresora'}). Solo platos, sin precios.`,
          'success',
        );
      } else if (res.error_impresion) {
        const msg = res.es_adicional
          ? `Los platos adicionales ya están en cocina.\n\nImpresora: ${res.error_impresion}`
          : `Los platos ya están en cocina.\n\nImpresora: ${res.error_impresion}`;
        await showAppDialog({
          title: res.es_adicional
            ? 'Adicional en cocina (sin imprimir)'
            : 'Enviado a cocina (sin imprimir)',
          message: msg,
          variant: 'warning',
          buttons: [
            { text: 'Entendido', style: 'cancel' },
            {
              text: 'Reimprimir comanda',
              style: 'primary',
              onPress: () => reimprimirComandaCocina(),
            },
          ],
        });
        return;
      } else {
        await showNotice(
          'Cocina',
          res.es_adicional
            ? 'Platos adicionales enviados a cocina (solo los nuevos en la comanda).'
            : 'Platos enviados a cocina.',
          'success',
        );
      }
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'No se pudo enviar a cocina',
      );
    } finally {
      setBusyPasarCocina(false);
    }
  }

  async function cambiarCantidadLinea(idDetalle: number, actual: number, delta: number) {
    const next = actual + delta;
    if (next < 1) return;
    const pid = pedido?.id_pedido;
    setBusy(true);
    try {
      await api(`/pedidos/detalles/${idDetalle}/cantidad`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ cantidad: next }),
      });
      await load();
      if (historialOpen && pid) {
        await cargarHistorial(pid);
      }
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'No se pudo actualizar la cantidad',
      );
    } finally {
      setBusy(false);
    }
  }

  function cantidadFilaDetalle(idDetalle: number): number {
    return pedido?.detalles.find((d) => d.id_detalle === idDetalle)?.cantidad ?? 0;
  }

  async function incrementarLineaGrupo(grupo: LineaPedidoGrupo) {
    const id = grupo.id_detalle_incremento;
    await cambiarCantidadLinea(id, cantidadFilaDetalle(id), 1);
  }

  async function decrementarLineaGrupo(grupo: LineaPedidoGrupo) {
    const id = grupo.id_detalle_decremento;
    const actual = cantidadFilaDetalle(id);
    if (actual <= 1) {
      await quitarLineaPorId(id);
      return;
    }
    await cambiarCantidadLinea(id, actual, -1);
  }

  async function quitarLineaPorId(idDetalle: number) {
    const pid = pedido?.id_pedido;
    setBusy(true);
    try {
      await api(`/pedidos/detalles/${idDetalle}`, {
        method: 'DELETE',
        token,
      });
      await load();
      if (historialOpen && pid) {
        await cargarHistorial(pid);
      }
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'No se pudo quitar la línea',
      );
    } finally {
      setBusy(false);
    }
  }

  async function cargarHistorial(pid?: number) {
    const id = pid ?? pedido?.id_pedido;
    if (!id) return;
    setHistorialLoading(true);
    try {
      const rows = await api<
        {
          id_historial: number;
          tipo: string;
          detalle: unknown;
          creado_en: string;
          usuario: { nombre: string; apellido: string };
        }[]
      >(`/pedidos/${id}/historial`, { token });
      setHistorialRows(rows);
    } catch {
      setHistorialRows([]);
    } finally {
      setHistorialLoading(false);
    }
  }

  function labelTipoHistorial(tipo: string): string {
    if (tipo === 'detalle_agregado') return 'Ítems agregados';
    if (tipo === 'detalle_eliminado') return 'Ítems quitados';
    if (tipo === 'cantidad_actualizada') return 'Cantidad cambiada';
    return tipo;
  }

  function textoDetalleHistorial(tipo: string, detalle: unknown): string {
    if (detalle == null || typeof detalle !== 'object') return '';
    const d = detalle as Record<string, unknown>;
    if (tipo === 'detalle_agregado' && Array.isArray(d.lineas)) {
      return (d.lineas as { nombre_producto: string; cantidad: number }[])
        .map((x) => `${x.cantidad}× ${x.nombre_producto}`)
        .join(' · ');
    }
    if (tipo === 'detalle_eliminado' && Array.isArray(d.lineas)) {
      return (d.lineas as { nombre_producto: string; cantidad: number }[])
        .map((x) => `${x.cantidad}× ${x.nombre_producto}`)
        .join(' · ');
    }
    if (tipo === 'cantidad_actualizada') {
      const n = String(d.nombre_producto ?? '');
      const a = Number(d.cantidad_anterior);
      const b = Number(d.cantidad_nueva);
      return `${n}: ${a} → ${b}`;
    }
    return '';
  }

  async function quitarGrupoLinea(grupo: LineaPedidoGrupo) {
    const ok = await confirmAction(
      'Quitar línea',
      `¿Quitar ${grupo.cantidad}× ${grupo.nombre_producto} del pedido?`,
    );
    if (!ok) return;
    const pid = pedido?.id_pedido;
    setBusy(true);
    try {
      const ids = [...grupo.ids_detalle].sort((a, b) => b - a);
      for (const id of ids) {
        await api(`/pedidos/detalles/${id}`, {
          method: 'DELETE',
          token,
        });
      }
      await load();
      if (historialOpen && pid) {
        await cargarHistorial(pid);
      }
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'No se pudo quitar la línea',
      );
    } finally {
      setBusy(false);
    }
  }

  if (!authLoading && !puedeTomar) {
    return <PantallaSoloMeseros />;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!mesa) {
    return (
      <View style={[styles.center, { padding: 24 }]}>
        <Text style={styles.emptyTitle}>Mesa no encontrada</Text>
        <Text style={styles.emptySub}>
          No existe, no está disponible hoy o el enlace ya no es válido.
        </Text>
        <ActionIconBar
          actions={[
            {
              key: 'mesas',
              icon: AdminIcon.volverMesas,
              label: 'Volver a mesas',
              variant: 'primary',
              onPress: () => router.replace('/(app)/mesas'),
            },
          ]}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { padding: r.contentPadding }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.headerCard}>
        <Text style={styles.kicker}>
          {mesa.numero === 99
            ? 'Mostrador'
            : mesa.numero === 98
              ? 'Sin mesa física'
              : 'Mesa'}
        </Text>
        <Text style={[styles.h1, { fontSize: r.isWide ? 36 : r.isCompact ? 28 : 34 }]}>
          {mesa.numero === 99
            ? 'Bebidas (rápido)'
            : mesa.numero === 98
              ? tituloLugarMesa(mesa.numero)
              : mesa.numero}
        </Text>
        <Text style={styles.meta}>
          Estado:{' '}
          {mesa.estado === 'libre'
            ? 'disponible'
            : mesa.estado === 'ocupada'
              ? 'ocupada'
              : 'reservada'}
        </Text>
      </View>

      {mesa.estado === 'reservada' && (
        <Text style={styles.warn}>Mesa reservada. No se puede tomar pedido aquí.</Text>
      )}

      {!pedido && mesa.estado === 'libre' && (
        <View style={styles.box}>
          <Text style={styles.label}>
            {mesa.numero === 99
              ? 'Personas (opcional; 1 por defecto)'
              : mesa.numero === 98
                ? 'Comensales (opcional; 1 por defecto)'
                : 'Número de comensales (opcional; 1 por defecto)'}
          </Text>
          <TextInput
            style={[styles.input, narrowField]}
            keyboardType="number-pad"
            placeholder={placeholderComensalesMesa(mesa.numero)}
            placeholderTextColor={colors.textHint}
            value={comensales}
            onChangeText={setComensales}
          />
          <IconTooltipButton
            icon={mesa.numero === 98 ? PedidoIcon.abrirPedido : PedidoIcon.abrirMesa}
            label={mesa.numero === 98 ? 'Abrir pedido' : 'Abrir mesa'}
            variant="primary"
            onPress={abrirMesa}
            disabled={busy}
          />
        </View>
      )}

      {activosLista.length > 1 && (
        <PedidosActivosChips
          pedidos={activosLista}
          selectedId={selectedPid}
          onSelect={(id) => {
            setSelectedPid(id);
            if (historialOpen) {
              cargarHistorial(id).catch(() => undefined);
            }
          }}
          style={styles.box}
        />
      )}

      {pedido && (
        <View style={styles.box}>
          <View style={styles.pedidoTop}>
            <Text style={styles.label}>Pedido #{pedido.id_pedido}</Text>
            <Text style={styles.pedidoMeta}>
              {pedido.num_comensales} comensales · {pedido.estado}
              {pedido.modo_servicio === 'para_llevar' ? ' · para llevar' : ''}
            </Text>
          </View>
          {mesa && pedidoUsaLineaMazorca(mesa.numero) ? (
            <View style={styles.comensalesRow}>
              <Text style={styles.comensalesLabel}>
                Comensales (1 mazorca por persona)
              </Text>
              <View style={styles.qtyRow}>
                <IconTooltipButton
                  icon="remove-circle-outline"
                  label="Quitar comensal"
                  size={22}
                  onPress={() =>
                    actualizarComensales(pedido.num_comensales - 1)
                  }
                  disabled={busy || pedido.num_comensales <= 1}
                />
                <Text style={styles.qtyVal}>{pedido.num_comensales}</Text>
                <IconTooltipButton
                  icon="add-circle-outline"
                  label="Agregar comensal"
                  size={22}
                  onPress={() =>
                    actualizarComensales(pedido.num_comensales + 1)
                  }
                  disabled={busy}
                />
              </View>
            </View>
          ) : null}
          {lineasAgrupadas.map((d) => {
            const esMazorca = esDetalleMazorcaAcompanamiento(d);
            const empaquesGrupo = pedido.detalles.filter(
              (h) =>
                h.id_detalle_padre != null &&
                d.ids_detalle.includes(h.id_detalle_padre),
            );
            const empaqueCantidad = empaquesGrupo.reduce(
              (sum, h) => sum + h.cantidad,
              0,
            );
            return (
              <View key={d.ids_detalle.join('-')} style={styles.line}>
                <Text style={styles.lineMain}>
                  {d.cantidad}× {d.nombre_producto}
                  {etiquetaEstadoLineaPedido(d)}
                </Text>
                <Text style={styles.linePrice}>
                  {esMazorca ? 'incluido' : formatCOP(d.subtotal_linea)}
                </Text>
                {empaqueCantidad > 0 ? (
                  <Text style={styles.subLine}>
                    ↳ {empaqueCantidad > 1 ? `${empaqueCantidad}× ` : ''}
                    empaque para llevar
                  </Text>
                ) : null}
                {d.nota_cocina ? (
                  <Text style={styles.nota}>Nota: {d.nota_cocina}</Text>
                ) : null}
                {d.personalizaciones.length > 0 && (
                  <Text style={styles.pers}>
                    {d.personalizaciones.map((p) => p.descripcion).join(' · ')}
                  </Text>
                )}
                {!esMazorca ? (
                <View style={styles.lineActions}>
                    <View style={styles.qtyRow}>
                      <IconTooltipButton
                        icon="remove-circle-outline"
                        label="Quitar una unidad"
                        size={22}
                        onPress={() => decrementarLineaGrupo(d)}
                        disabled={busy}
                      />
                      <Text style={styles.qtyVal}>{d.cantidad}</Text>
                      <IconTooltipButton
                        icon="add-circle-outline"
                        label="Agregar una unidad"
                        size={22}
                        onPress={() => incrementarLineaGrupo(d)}
                        disabled={busy}
                      />
                    </View>
                    <IconTooltipButton
                      icon="trash-outline"
                      label="Quitar línea"
                      variant="danger"
                      size={20}
                      onPress={() => quitarGrupoLinea(d)}
                      disabled={busy}
                    />
                </View>
                ) : null}
              </View>
            );
          })}

          <Pressable
            style={styles.historialToggle}
            onPress={() => {
              const next = !historialOpen;
              setHistorialOpen(next);
              if (next) {
                cargarHistorial().catch(() => undefined);
              }
            }}
          >
            <Text style={styles.historialToggleText}>
              {historialOpen ? '▼' : '▶'} Historial de cambios
            </Text>
          </Pressable>
          {historialOpen ? (
            <View style={styles.historialBox}>
              {historialLoading ? (
                <Text style={styles.historialMuted}>Cargando…</Text>
              ) : historialRows.length === 0 ? (
                <Text style={styles.historialMuted}>
                  Sin movimientos registrados aún.
                </Text>
              ) : (
                historialRows.map((h) => (
                  <View key={h.id_historial} style={styles.historialLine}>
                    <Text style={styles.historialMeta}>
                      {new Date(h.creado_en).toLocaleString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      · {h.usuario.nombre} {h.usuario.apellido}
                    </Text>
                    <Text style={styles.historialTipo}>
                      {labelTipoHistorial(h.tipo)}
                    </Text>
                    {textoDetalleHistorial(h.tipo, h.detalle) ? (
                      <Text style={styles.historialDet}>
                        {textoDetalleHistorial(h.tipo, h.detalle)}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          ) : null}

          <ActionIconBar
            style={styles.actionBar}
            actions={[
              {
                key: 'menu',
                icon:
                  mesa.numero === 99
                    ? PedidoIcon.agregarBebidas
                    : PedidoIcon.agregarMenu,
                label:
                  mesa.numero === 99 ? 'Agregar bebidas' : 'Agregar del menú',
                variant: 'secondary',
                onPress: () =>
                  router.push(
                    mesa.numero === 99
                      ? `/(app)/pedido/${pedido.id_pedido}/menu?bebidas=1`
                      : mesa.numero === 98
                        ? `/(app)/pedido/${pedido.id_pedido}/menu?paraLlevar=1`
                        : `/(app)/pedido/${pedido.id_pedido}/menu`,
                  ),
              },
              {
                key: 'cocina',
                icon: PedidoIcon.pasarCocina,
                label:
                  busyPasarCocina
                    ? 'Enviando a cocina…'
                    : platosPendientesCocina > 0
                      ? `Pasar a cocina (${platosPendientesCocina})`
                      : 'Pasar a cocina',
                variant: 'cocina',
                disabled: busyPasarCocina || platosPendientesCocina === 0,
                badge:
                  platosPendientesCocina > 0 ? platosPendientesCocina : undefined,
                onPress: pasarACocina,
              },
              {
                key: 'reimprimir-cocina',
                icon: PedidoIcon.reimprimirComanda,
                label:
                  busyReimprimir
                    ? 'Imprimiendo…'
                    : platosEnCocina > 0
                      ? `Reimprimir comanda (${platosEnCocina})`
                      : 'Reimprimir comanda',
                variant: 'secondary',
                disabled: busyReimprimir || platosEnCocina === 0,
                badge: platosEnCocina > 0 ? platosEnCocina : undefined,
                onPress: reimprimirComandaCocina,
              },
              {
                key: 'cobrar',
                icon: PedidoIcon.cobrar,
                label: 'Cobrar / facturar',
                variant: 'money',
                onPress: () =>
                  router.push(`/(app)/pedido/${pedido.id_pedido}/factura`),
              },
              {
                key: 'volver',
                icon: 'arrow-back-outline',
                label:
                  mesa.numero === 99
                    ? 'Volver a mostrador'
                    : mesa.numero === 98
                      ? 'Volver a para llevar'
                      : 'Volver a mesas',
                onPress: () =>
                  router.replace(
                    mesa.numero === 99
                      ? '/(app)/mostrador'
                      : mesa.numero === 98
                        ? '/(app)/para-llevar'
                        : '/(app)/mesas',
                  ),
              },
              {
                key: 'cancelar',
                icon: 'close-circle-outline',
                label: 'Cancelar pedido',
                variant: 'danger',
                disabled: busy,
                onPress: cancelarPedido,
              },
            ]}
          />
          <Text style={styles.agregarHint}>
            Agrega platos y bebidas al mismo pedido. Pulsa «Pasar a cocina» para
            imprimir la comanda (solo comida, sin precios). Al cobrar se factura
            todo: platos, bebidas y empaques.
          </Text>

          {!esMesaVirtual && pedido && mesa ? (
            <TransferirPedidoPanel
              pedidoId={pedido.id_pedido}
              mesaOrigenId={mesa.id_mesa}
              mesaOrigenNumero={mesa.numero}
              token={token}
              disabled={busy}
              onTransferido={(idMesa) =>
                router.replace(`/(app)/mesa/${idMesa}`)
              }
            />
          ) : null}

          {esMesaVirtual ? (
            <View style={styles.otroTicketBox}>
              <Text style={styles.label}>Otro cliente (nuevo ticket)</Text>
              <TextInput
                style={[styles.input, narrowField]}
                keyboardType="number-pad"
                placeholder={placeholderComensalesMesa(mesa.numero)}
                placeholderTextColor={colors.textHint}
                value={comensales}
                onChangeText={setComensales}
              />
              <IconTooltipButton
                icon="add-circle-outline"
                label="Abrir otro pedido en esta cola"
                variant="secondary"
                onPress={abrirMesa}
                disabled={busy}
              />
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8 },
  emptySub: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...appShadow('elevated'),
  },
  kicker: { color: colors.textMuted, fontWeight: '700', letterSpacing: 0.3 },
  h1: { fontSize: 34, fontWeight: '800', color: colors.text, marginTop: 4 },
  meta: { marginTop: 2, color: colors.textMuted },
  warn: { marginTop: 12, color: colors.cocina },
  box: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...appShadow('soft'),
  },
  label: { fontWeight: '600', marginBottom: 8, color: colors.text },
  otroTicketBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  pedidoTop: { marginBottom: 8 },
  pedidoMeta: { color: colors.textMuted, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
  },
  primary: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: { color: colors.surface, fontWeight: '600', fontSize: 16 },
  secondary: {
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  cocinaBtn: {
    backgroundColor: colors.cocina,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cocinaBtnText: { color: colors.surface, fontWeight: '800', fontSize: 16 },
  agregarHint: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  actionBar: { marginTop: 12, marginBottom: 4 },
  tertiary: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: colors.surface,
  },
  tertiaryText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  danger: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerLight,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerText: { color: colors.dangerDark, fontWeight: '900', fontSize: 16 },
  disabled: { opacity: 0.6 },
  line: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    paddingVertical: 10,
  },
  comensalesRow: {
    marginBottom: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    gap: 6,
  },
  comensalesLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warningText,
  },
  lineMain: { fontSize: 16, color: colors.text, fontWeight: '600' },
  linePrice: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  nota: { fontSize: 13, color: colors.secondary, marginTop: 4 },
  pers: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  subLine: { fontSize: 12, color: colors.textHint, marginTop: 4, fontStyle: 'italic' },
  lineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    minWidth: 36,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: '800', color: colors.text },
  qtyVal: { fontSize: 16, fontWeight: '800', color: colors.text, minWidth: 28, textAlign: 'center' },
  removeLine: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerLight,
  },
  removeLineText: { color: colors.dangerDark, fontWeight: '800', fontSize: 14 },
  historialToggle: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  historialToggleText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 15,
  },
  historialBox: {
    marginBottom: 8,
    padding: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  historialMuted: { color: colors.textMuted, fontSize: 14 },
  historialLine: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  historialMeta: { fontSize: 12, color: colors.textMuted },
  historialTipo: { fontWeight: '800', color: colors.text, marginTop: 4 },
  historialDet: { fontSize: 14, color: colors.text, marginTop: 4, lineHeight: 20 },
});
