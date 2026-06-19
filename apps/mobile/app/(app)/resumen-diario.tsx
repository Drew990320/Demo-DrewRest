import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { FormModal } from '../../src/components/FormModal';
import { MoneyTextInput } from '../../src/components/MoneyTextInput';
import { IconTooltipButton } from '../../src/components/IconTooltipButton';
import { useAuth } from '../../src/context/AuthContext';
import { AccionIcon, AdminIcon } from '../../src/lib/app-icons';
import { api } from '../../src/lib/api';
import { alertarSiSinPapel } from '../../src/lib/alarma-impresora';
import { confirmAppDialog, showNotice } from '../../src/lib/app-dialog';
import { digitsFromMonto, parseCOPDigits } from '../../src/lib/cop-input';
import {
  avisarSiMontoCOPInvalido,
} from '../../src/lib/form-validation';
import { formatCOP } from '../../src/lib/format';
import { tituloLugarMesa } from '../../src/lib/mesa-label';
import { joinPedidoRooms } from '../../src/lib/pedido-sync';
import { useRefetchOnSync } from '../../src/hooks/useRefetchOnSync';
import { useFormFieldStyle } from '../../src/hooks/useFormFieldStyle';
import { formStyles } from '../../src/lib/form-layout';
import { colors } from '../../src/lib/theme';

type Resumen = {
  fecha: string;
  total_facturado: number;
  total_facturas: number;
  total_mesas_atendidas: number;
  monto_base_efectivo?: number;
  totales_por_metodo?: {
    efectivo: number;
    transferencia: number;
  };
  efectivo_esperado_en_caja?: number;
  mesas: {
    mesa_numero: number;
    pedidos_atendidos: number;
    total_facturado: number;
  }[];
  platos_por_categoria?: {
    categoria_nombre: string;
    cantidad: number;
    subtotal: number;
  }[];
  items_menu?: {
    id_producto: number;
    nombre_producto: string;
    categoria_nombre: string;
    cantidad: number;
    subtotal: number;
  }[];
  pedidos_detalle?: {
    id_factura: number;
    id_pedido: number;
    mesa_numero: number;
    mesero?: string;
    subtotal: number;
    descuento_sopas?: number;
    descuento_muleros?: number;
    total: number;
    metodo_pago: string;
    emitida_en: string;
    es_parcial?: boolean;
    pedido_estado?: string;
    detalles: {
      nombre_producto: string;
      cantidad: number;
      precio_unitario: number;
      subtotal_linea: number;
    }[];
  }[];
};

function normalizeResumen(raw: Resumen): Resumen {
  const legacy = raw as {
    totales_por_metodo?: { efectivo?: number; transferencia?: number; tarjeta?: number };
  };
  const t = legacy.totales_por_metodo ?? {};
  const tp = {
    efectivo: t.efectivo ?? 0,
    transferencia: (t.transferencia ?? 0) + (t.tarjeta ?? 0),
  };
  const base = raw.monto_base_efectivo ?? 0;
  const esperado =
    raw.efectivo_esperado_en_caja ?? base + tp.efectivo;
  return {
    ...raw,
    monto_base_efectivo: base,
    totales_por_metodo: tp,
    efectivo_esperado_en_caja: esperado,
    pedidos_detalle: raw.pedidos_detalle ?? [],
    platos_por_categoria: raw.platos_por_categoria ?? [],
    items_menu: raw.items_menu ?? [],
  };
}

function metodoPagoLabel(m: string): string {
  if (m === 'efectivo') return 'Efectivo';
  if (m === 'transferencia') return 'Transferencia';
  return m;
}

function horaFactura(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function ResumenDiarioScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [consultando, setConsultando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fecha, setFecha] = useState<string>(''); // YYYY-MM-DD o vacío (hoy)
  const [fechaDraft, setFechaDraft] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [montoBaseDigits, setMontoBaseDigits] = useState('');
  const [modalCaja, setModalCaja] = useState(false);
  const [modalConsulta, setModalConsulta] = useState(false);
  const [savingCaja, setSavingCaja] = useState(false);
  const [reimprimiendoId, setReimprimiendoId] = useState<number | null>(null);
  const [reimprimiendoPedidoId, setReimprimiendoPedidoId] = useState<number | null>(
    null,
  );
  const [imprimiendoCompleto, setImprimiendoCompleto] = useState(false);
  const [imprimiendoTotal, setImprimiendoTotal] = useState(false);
  const [mesasAbiertas, setMesasAbiertas] = useState<Record<number, boolean>>({});
  const [gruposPedidoAbiertos, setGruposPedidoAbiertos] = useState<
    Record<number, boolean>
  >({});
  const [pedidosAbiertos, setPedidosAbiertos] = useState<Record<number, boolean>>({});
  const [lineasPorFactura, setLineasPorFactura] = useState<
    Record<number, NonNullable<Resumen['pedidos_detalle']>[number]['detalles']>
  >({});
  const [cargandoLineas, setCargandoLineas] = useState<Record<number, boolean>>(
    {},
  );
  const moneyField = useFormFieldStyle('money');

  type CobroDetalle = NonNullable<Resumen['pedidos_detalle']>[number];
  type PedidoGrupoResumen = {
    id_pedido: number;
    mesa_numero: number;
    pedido_estado: string;
    facturas: CobroDetalle[];
    total: number;
  };

  const pedidosGrupoPorMesa = useMemo(() => {
    const mesaMap = new Map<number, PedidoGrupoResumen[]>();
    for (const cobro of data?.pedidos_detalle ?? []) {
      let lista = mesaMap.get(cobro.mesa_numero);
      if (!lista) {
        lista = [];
        mesaMap.set(cobro.mesa_numero, lista);
      }
      let grupo = lista.find((g) => g.id_pedido === cobro.id_pedido);
      if (!grupo) {
        grupo = {
          id_pedido: cobro.id_pedido,
          mesa_numero: cobro.mesa_numero,
          pedido_estado: cobro.pedido_estado ?? 'facturado',
          facturas: [],
          total: 0,
        };
        lista.push(grupo);
      }
      grupo.facturas.push(cobro);
      grupo.total += cobro.total;
      if (cobro.pedido_estado) {
        grupo.pedido_estado = cobro.pedido_estado;
      }
    }
    for (const lista of mesaMap.values()) {
      lista.sort((a, b) => a.id_pedido - b.id_pedido);
    }
    return mesaMap;
  }, [data?.pedidos_detalle]);

  function toggleGrupoPedido(idPedido: number) {
    setGruposPedidoAbiertos((prev) => ({ ...prev, [idPedido]: !prev[idPedido] }));
  }

  function toggleMesa(numero: number) {
    setMesasAbiertas((prev) => ({ ...prev, [numero]: !prev[numero] }));
  }

  function togglePedido(idFactura: number) {
    const abriendo = !(pedidosAbiertos[idFactura] ?? false);
    setPedidosAbiertos((prev) => ({ ...prev, [idFactura]: !prev[idFactura] }));
    if (abriendo) {
      InteractionManager.runAfterInteractions(() => {
        void cargarLineasFactura(idFactura);
      });
    }
  }

  const cargarLineasFactura = useCallback(
    async (idFactura: number) => {
      if (lineasPorFactura[idFactura]?.length) return;
      setCargandoLineas((prev) => ({ ...prev, [idFactura]: true }));
      try {
        const res = await api<{
          detalles: NonNullable<Resumen['pedidos_detalle']>[number]['detalles'];
        }>(`/pedidos/resumen-diario/facturas/${idFactura}/lineas`, { token });
        setLineasPorFactura((prev) => ({
          ...prev,
          [idFactura]: res.detalles ?? [],
        }));
      } catch {
        setLineasPorFactura((prev) => ({ ...prev, [idFactura]: [] }));
      } finally {
        setCargandoLineas((prev) => ({ ...prev, [idFactura]: false }));
      }
    },
    [token],
  );

  function expandirTodasLasMesas() {
    if (!data) return;
    const next: Record<number, boolean> = {};
    for (const m of data.mesas) {
      next[m.mesa_numero] = true;
    }
    setMesasAbiertas(next);
  }

  function contraerTodasLasMesas() {
    setMesasAbiertas({});
    setGruposPedidoAbiertos({});
    setPedidosAbiertos({});
  }

  function formatYYYYMMDD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function esConsultaDeHoy(): boolean {
    const hoy = formatYYYYMMDD(new Date());
    const f = fecha.trim();
    return !f || f === hoy;
  }

  const load = useCallback(async (fechaOverride?: string) => {
    const f = (fechaOverride !== undefined ? fechaOverride : fecha).trim();
    const qs = f ? `?fecha=${encodeURIComponent(f)}` : '';
    const cacheKey = `resumen_${f || 'hoy'}`;
    const res = await api<Resumen>(`/pedidos/resumen-diario${qs}`, {
      token,
      cacheKey,
    });
    const n = normalizeResumen(res);
    setData(n);
    setMontoBaseDigits(digitsFromMonto(n.monto_base_efectivo ?? 0));
    const abiertas: Record<number, boolean> = {};
    for (const m of n.mesas) {
      abiertas[m.mesa_numero] = true;
    }
    setMesasAbiertas(abiertas);
    setGruposPedidoAbiertos({});
    setPedidosAbiertos({});
    setLineasPorFactura({});
  }, [token, fecha]);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (user.rol !== 'admin') {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, [load, user]);

  useEffect(() => {
    joinPedidoRooms({ resumen: true });
  }, []);

  const refetchSiHoy = useCallback(async () => {
    if (!esConsultaDeHoy()) return;
    await load();
  }, [load, fecha]);

  useRefetchOnSync(refetchSiHoy, {
    enabled: user?.rol === 'admin',
    source: 'pedido',
  });

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  function qsFecha(): string {
    return fecha.trim() ? `?fecha=${encodeURIComponent(fecha.trim())}` : '';
  }

  function resetMontoBaseDesdeData() {
    if (!data) return;
    setMontoBaseDigits(digitsFromMonto(data.monto_base_efectivo ?? 0));
  }

  function openCajaModal() {
    resetMontoBaseDesdeData();
    setModalCaja(true);
  }

  function closeCajaModal() {
    if (savingCaja) return;
    setModalCaja(false);
    resetMontoBaseDesdeData();
  }

  function openConsultaModal() {
    setFechaDraft(fecha);
    setModalConsulta(true);
  }

  function closeConsultaModal() {
    if (consultando) return;
    setModalConsulta(false);
    setShowCalendar(false);
    setShowPicker(false);
  }

  async function guardarCajaInicial() {
    if (!data) return;
    if (
      await avisarSiMontoCOPInvalido(
        'Caja inicial (efectivo)',
        montoBaseDigits,
        showNotice,
        { permitirCero: true },
      )
    ) {
      return;
    }
    const n = parseCOPDigits(montoBaseDigits);
    setSavingCaja(true);
    try {
      const res = await api<{
        fecha: string;
        monto_base_efectivo: number;
        impresion_base?: {
          impreso?: boolean;
          en_cola?: boolean;
          error?: string;
          codigo_error?: string;
        };
      }>('/pedidos/caja-diaria', {
        method: 'PUT',
        token,
        body: JSON.stringify({
          fecha: data.fecha,
          monto_base_efectivo: n,
        }),
      });
      await load();
      const imp = res.impresion_base;
      if (alertarSiSinPapel(imp ?? {})) {
        return;
      }
      if (imp?.impreso || imp?.en_cola) {
        await showNotice(
          'Caja guardada',
          imp.en_cola
            ? 'Base registrada. El comprobante se imprime en cola.'
            : 'Base registrada e impresa.',
          'success',
        );
      } else if (imp?.error) {
        await showNotice(
          'Caja guardada',
          `Base registrada, pero no se imprimió: ${imp.error}`,
          'warning',
        );
      }
      setModalCaja(false);
    } catch (e) {
      await showNotice('Error', e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    } finally {
      setSavingCaja(false);
    }
  }

  async function onConsultar(nuevaFecha?: string) {
    const f = (nuevaFecha !== undefined ? nuevaFecha : fecha).trim();
    if (f && !/^\d{4}-\d{2}-\d{2}$/.test(f)) {
      await showNotice('Fecha', 'Selecciona una fecha desde el calendario.', 'warning');
      return;
    }
    if (nuevaFecha !== undefined) {
      setFecha(nuevaFecha);
    }
    setConsultando(true);
    try {
      await load(nuevaFecha !== undefined ? nuevaFecha : fecha);
      setModalConsulta(false);
      setShowCalendar(false);
      setShowPicker(false);
    } finally {
      setConsultando(false);
    }
  }

  async function imprimirDiaCompleto() {
    if (!data) return;
    if (data.total_facturas === 0) {
      await showNotice(
        'Sin ventas',
        'No hay facturas en esta fecha para imprimir.',
        'warning',
      );
      return;
    }
    const ok = await confirmAppDialog(
      'Imprimir facturas y comandas',
      `Se imprimirán hasta ${data.total_facturas} factura(s) del ${data.fecha}, cada una con su comanda de cocina si aplica. Van en secuencia sin pausa entre tickets.`,
    );
    if (!ok) return;
    setImprimiendoCompleto(true);
    try {
      const res = await api<{
        comandas_impresas: number;
        comandas_omitidas: number;
        facturas_impresas: number;
        errores: string[];
        detenido_sin_papel: boolean;
      }>(`/pedidos/resumen-diario/imprimir-completo${qsFecha()}`, {
        method: 'POST',
        token,
      });
      if (res.detenido_sin_papel) {
        await showNotice(
          'Sin papel',
          'La impresión se detuvo: recargue el rollo en la impresora POS.',
          'error',
        );
        return;
      }
      const msg = [
        `Comandas: ${res.comandas_impresas} impresa(s)`,
        res.comandas_omitidas > 0
          ? `(${res.comandas_omitidas} sin platos de cocina)`
          : '',
        `Facturas: ${res.facturas_impresas} impresa(s)`,
        res.errores.length > 0 ? `\nAvisos:\n${res.errores.slice(0, 3).join('\n')}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      await showNotice(
        res.facturas_impresas > 0 ? 'Impresión en cola' : 'Sin imprimir',
        msg,
        res.facturas_impresas > 0 ? 'success' : 'warning',
      );
    } catch (e) {
      await showNotice('Error', e instanceof Error ? e.message : 'No se pudo imprimir', 'error');
    } finally {
      setImprimiendoCompleto(false);
    }
  }

  async function imprimirTotalCierre() {
    if (!data) return;
    setImprimiendoTotal(true);
    try {
      const res = await api<{
        ok: boolean;
        impresion_cierre?: {
          impreso: boolean;
          error?: string;
          codigo_error?: string;
          destino?: string;
        };
      }>(`/pedidos/resumen-diario/imprimir-total${qsFecha()}`, {
        method: 'POST',
        token,
      });
      if (alertarSiSinPapel(res.impresion_cierre ?? {})) {
        return;
      }
      const imp = res.impresion_cierre;
      await showNotice(
        imp?.impreso ? 'Cierre impreso' : 'Sin imprimir',
        imp?.impreso
          ? `Ticket de totales del ${data.fecha} enviado a ${imp.destino ?? 'la impresora'}.`
          : imp?.error ?? 'No se pudo imprimir el cierre.',
        imp?.impreso ? 'success' : 'error',
      );
    } catch (e) {
      await showNotice('Error', e instanceof Error ? e.message : 'No se pudo imprimir', 'error');
    } finally {
      setImprimiendoTotal(false);
    }
  }

  async function reimprimirPedidoTotal(idPedido: number) {
    setReimprimiendoPedidoId(idPedido);
    try {
      const res = await api<{
        impresion_factura?: {
          impreso: boolean;
          error?: string;
          destino?: string;
          codigo_error?: string;
        };
        num_cobros?: number;
      }>(`/pedidos/${idPedido}/reimprimir-pedido-total`, {
        method: 'POST',
        token,
      });
      if (alertarSiSinPapel(res.impresion_factura ?? {})) {
        return;
      }
      const imp = res.impresion_factura;
      const msg = imp?.impreso
        ? `Total del pedido #${idPedido} reimpreso (${imp.destino ?? 'impresora'}). Incluye todos los ítems${(res.num_cobros ?? 1) > 1 ? ` y ${res.num_cobros} cobros` : ''}.`
        : imp?.error
          ? `No se pudo imprimir: ${imp.error}`
          : 'No se pudo imprimir el total del pedido.';
      await showNotice(
        imp?.impreso ? 'Reimpresión' : 'Sin imprimir',
        msg,
        imp?.impreso ? 'success' : 'error',
      );
    } catch (e) {
      await showNotice('Error', e instanceof Error ? e.message : 'No se pudo reimprimir', 'error');
    } finally {
      setReimprimiendoPedidoId(null);
    }
  }

  async function reimprimirFactura(idPedido: number, idFactura: number) {
    setReimprimiendoId(idFactura);
    try {
      const res = await api<{
        impresion_factura?: {
          impreso: boolean;
          error?: string;
          destino?: string;
          codigo_error?: string;
        };
      }>(`/pedidos/${idPedido}/reimprimir-factura?id_factura=${idFactura}`, {
        method: 'POST',
        token,
      });
      if (alertarSiSinPapel(res.impresion_factura ?? {})) {
        return;
      }
      const imp = res.impresion_factura;
      const msg = imp?.impreso
        ? `Factura reimpresa (${imp.destino ?? 'impresora'}). El ticket indica REIMPRESIÓN.`
        : imp?.error
          ? `No se pudo imprimir: ${imp.error}`
          : 'No se pudo imprimir la factura.';
      await showNotice(
        imp?.impreso ? 'Reimpresión' : 'Sin imprimir',
        msg,
        imp?.impreso ? 'success' : 'error',
      );
    } catch (e) {
      await showNotice('Error', e instanceof Error ? e.message : 'No se pudo reimprimir', 'error');
    } finally {
      setReimprimiendoId(null);
    }
  }

  if (user && user.rol !== 'admin') {
    return (
      <View style={styles.center}>
        <Text style={styles.denied}>Solo el administrador puede ver el resumen diario.</Text>
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

  if (loading || !user || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerCard}>
          <Text style={styles.kicker}>Resumen diario</Text>
          <Text style={styles.h1}>{data.fecha}</Text>
          <Text style={styles.total}>{formatCOP(data.total_facturado)}</Text>
          <Text style={styles.sub}>
            {data.total_facturas} facturas · {data.total_mesas_atendidas} mesas atendidas
          </Text>
        </View>

        <ActionIconBar
          style={formStyles.screenActions}
          actions={[
            {
              key: 'caja',
              icon: AccionIcon.guardar,
              label: 'Caja inicial',
              variant: 'primary',
              onPress: openCajaModal,
            },
            {
              key: 'consultar',
              icon: AccionIcon.consultar,
              label: 'Consultar por fecha',
              variant: 'secondary',
              onPress: openConsultaModal,
            },
          ]}
        />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ingresos por tipo de pago</Text>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>Caja inicial</Text>
            <Text style={styles.payValue}>
              {formatCOP(data.monto_base_efectivo ?? 0)}
            </Text>
          </View>
          <View style={styles.payRow}>
          <Text style={styles.payLabel}>Efectivo</Text>
          <Text style={styles.payValue}>
            {formatCOP(data.totales_por_metodo?.efectivo ?? 0)}
          </Text>
        </View>
        <View style={styles.payRow}>
          <Text style={styles.payLabel}>Transferencia</Text>
          <Text style={styles.payValue}>
            {formatCOP(data.totales_por_metodo?.transferencia ?? 0)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.payRow}>
          <Text style={styles.payStrong}>Efectivo esperado en caja</Text>
          <Text style={styles.payStrongVal}>
            {formatCOP(data.efectivo_esperado_en_caja ?? 0)}
          </Text>
        </View>
        <Text style={styles.helpSmall}>
          Caja inicial + ventas en efectivo (cada venta suma el total cobrado; el vuelto ya
          quedó descontado al devolverlo al cliente). No bloquea nuevas ventas ni registra el
          conteo físico al cierre — es una estimación para cuadrar la caja.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Platos por categoría</Text>
        <Text style={styles.help}>
          Platos principales facturados en el día, agrupados por categoría del menú.
        </Text>
        {(data.platos_por_categoria?.length ?? 0) === 0 ? (
          <Text style={styles.empty}>Sin platos facturados en esta fecha.</Text>
        ) : (
          <>
            <View style={styles.ventaHeadRow}>
              <Text style={[styles.ventaHeadCell, styles.ventaColNombre]}>Categoría</Text>
              <Text style={[styles.ventaHeadCell, styles.ventaColCant]}>Cant.</Text>
              <Text style={[styles.ventaHeadCell, styles.ventaColSub]}>Subtotal</Text>
            </View>
            {data.platos_por_categoria!.map((row) => (
              <View key={row.categoria_nombre} style={styles.ventaRow}>
                <Text style={[styles.ventaCell, styles.ventaColNombre]} numberOfLines={2}>
                  {row.categoria_nombre}
                </Text>
                <Text style={[styles.ventaCell, styles.ventaColCant]}>{row.cantidad}</Text>
                <Text style={[styles.ventaCell, styles.ventaColSub]}>
                  {formatCOP(row.subtotal)}
                </Text>
              </View>
            ))}
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ítems del menú</Text>
        <Text style={styles.help}>
          Todo lo cobrado en facturas del día (bebidas, acompañamientos, etc.), por producto.
        </Text>
        {(data.items_menu?.length ?? 0) === 0 ? (
          <Text style={styles.empty}>Sin ítems facturados en esta fecha.</Text>
        ) : (
          <>
            <View style={styles.ventaHeadRow}>
              <Text style={[styles.ventaHeadCell, styles.ventaColNombre]}>Producto</Text>
              <Text style={[styles.ventaHeadCell, styles.ventaColCant]}>Cant.</Text>
              <Text style={[styles.ventaHeadCell, styles.ventaColSub]}>Subtotal</Text>
            </View>
            {data.items_menu!.map((row) => (
              <View key={row.id_producto} style={styles.ventaRow}>
                <View style={styles.ventaColNombre}>
                  <Text style={styles.ventaCell} numberOfLines={2}>
                    {row.nombre_producto}
                  </Text>
                  <Text style={styles.ventaMeta}>{row.categoria_nombre}</Text>
                </View>
                <Text style={[styles.ventaCell, styles.ventaColCant]}>{row.cantidad}</Text>
                <Text style={[styles.ventaCell, styles.ventaColSub]}>
                  {formatCOP(row.subtotal)}
                </Text>
              </View>
            ))}
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Impresión de cierre</Text>
        <Text style={styles.help}>
          Requiere el API en el PC del restaurante con impresora POS configurada. Los totales
          coinciden con las facturas emitidas en la fecha mostrada arriba (zona Bogotá).
        </Text>
        <ActionIconBar
          actions={[
            {
              key: 'completo',
              icon: imprimiendoCompleto ? 'hourglass-outline' : 'documents-outline',
              label: imprimiendoCompleto
                ? 'Imprimiendo…'
                : 'Facturas y comandas del día',
              variant: 'secondary',
              disabled: imprimiendoCompleto || data.total_facturas === 0,
              onPress: imprimirDiaCompleto,
            },
            {
              key: 'totales',
              icon: imprimiendoTotal ? 'hourglass-outline' : 'calculator-outline',
              label: imprimiendoTotal
                ? 'Imprimiendo…'
                : 'Solo totales de caja',
              variant: 'secondary',
              disabled: imprimiendoTotal,
              onPress: imprimirTotalCierre,
            },
          ]}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeadRow}>
          <Text style={styles.sectionTitle}>Detalle por mesa y pedido</Text>
          <View style={styles.sectionActions}>
            <Pressable onPress={expandirTodasLasMesas} hitSlop={8}>
              <Text style={styles.linkAction}>Expandir</Text>
            </Pressable>
            <Text style={styles.linkSep}>·</Text>
            <Pressable onPress={contraerTodasLasMesas} hitSlop={8}>
              <Text style={styles.linkAction}>Contraer</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.help}>
          Toca una mesa para ver sus pedidos; expande un pedido para ver cada cobro o
          reimprimir el total cuando ya esté pagado.
        </Text>
        {data.mesas.length === 0 && (
          <Text style={styles.empty}>No hay pedidos facturados en esta fecha.</Text>
        )}
        {data.mesas.map((mesa) => {
          const grupos = pedidosGrupoPorMesa.get(mesa.mesa_numero) ?? [];
          const mesaAbierta = mesasAbiertas[mesa.mesa_numero] ?? false;
          return (
            <View key={mesa.mesa_numero} style={styles.mesaBlock}>
              <Pressable
                style={styles.mesaHead}
                onPress={() => toggleMesa(mesa.mesa_numero)}
              >
                <View style={styles.mesaHeadLeft}>
                  <Ionicons
                    name={mesaAbierta ? 'chevron-down' : 'chevron-forward'}
                    size={18}
                    color={colors.primary}
                  />
                  <View style={styles.mesaHeadText}>
                    <Text style={styles.mesaTitle}>
                      {tituloLugarMesa(mesa.mesa_numero)}
                    </Text>
                    <Text style={styles.mesaSub}>
                      {mesa.pedidos_atendidos} cobro
                      {mesa.pedidos_atendidos === 1 ? '' : 's'} · facturas del día
                    </Text>
                  </View>
                </View>
                <Text style={styles.mesaTotal}>{formatCOP(mesa.total_facturado)}</Text>
              </Pressable>
              {mesaAbierta &&
                grupos.map((grupo) => {
                  const grupoAbierto = gruposPedidoAbiertos[grupo.id_pedido] ?? false;
                  const pedidoPagado = grupo.pedido_estado === 'facturado';
                  return (
                    <View key={grupo.id_pedido} style={styles.pedidoGrupoBlock}>
                      <Pressable
                        style={styles.pedidoGrupoHead}
                        onPress={() => toggleGrupoPedido(grupo.id_pedido)}
                      >
                        <View style={styles.pedidoHeadLeft}>
                          <Ionicons
                            name={grupoAbierto ? 'chevron-down' : 'chevron-forward'}
                            size={16}
                            color={colors.primary}
                          />
                          <View style={styles.pedidoHeadText}>
                            <Text style={styles.pedidoTitle}>
                              Pedido #{grupo.id_pedido}
                            </Text>
                            <Text style={styles.pedidoMeta}>
                              {grupo.facturas.length} cobro
                              {grupo.facturas.length === 1 ? '' : 's'}
                              {pedidoPagado ? ' · pagado' : ''}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.pedidoTotal}>{formatCOP(grupo.total)}</Text>
                      </Pressable>
                      {grupoAbierto && (
                        <View style={styles.pedidoGrupoBody}>
                          {pedidoPagado && (
                            <View style={styles.actionRow}>
                              <IconTooltipButton
                                icon={
                                  reimprimiendoPedidoId === grupo.id_pedido
                                    ? 'hourglass-outline'
                                    : AccionIcon.reimprimirTotalPedido
                                }
                                label={
                                  reimprimiendoPedidoId === grupo.id_pedido
                                    ? 'Imprimiendo…'
                                    : 'Reimprimir total del pedido'
                                }
                                variant="primary"
                                disabled={reimprimiendoPedidoId === grupo.id_pedido}
                                onPress={() => reimprimirPedidoTotal(grupo.id_pedido)}
                              />
                            </View>
                          )}
                          {grupo.facturas.map((ped) => {
                            const pedAbierto = pedidosAbiertos[ped.id_factura] ?? false;
                            const descTotal =
                              (ped.descuento_sopas ?? 0) + (ped.descuento_muleros ?? 0);
                            return (
                              <View key={ped.id_factura} style={styles.cobroBlock}>
                                <Pressable
                                  style={styles.pedidoHead}
                                  onPress={() => togglePedido(ped.id_factura)}
                                >
                                  <View style={styles.pedidoHeadLeft}>
                                    <Ionicons
                                      name={pedAbierto ? 'chevron-down' : 'chevron-forward'}
                                      size={14}
                                      color={colors.textMuted}
                                    />
                                    <View style={styles.pedidoHeadText}>
                                      <Text style={styles.cobroTitle}>
                                        Cobro · Factura #{ped.id_factura}
                                      </Text>
                                      <Text style={styles.pedidoMeta}>
                                        {horaFactura(ped.emitida_en)} ·{' '}
                                        {metodoPagoLabel(ped.metodo_pago)}
                                        {ped.mesero ? ` · ${ped.mesero}` : ''}
                                        {ped.es_parcial ? ' · parcial' : ''}
                                      </Text>
                                    </View>
                                  </View>
                                  <Text style={styles.cobroTotal}>
                                    {formatCOP(ped.total)}
                                  </Text>
                                </Pressable>
                                {pedAbierto && (
                                  <View style={styles.pedidoBody}>
                                    {cargandoLineas[ped.id_factura] ? (
                                      <ActivityIndicator style={{ marginVertical: 8 }} />
                                    ) : (
                                      (lineasPorFactura[ped.id_factura] ?? ped.detalles).map(
                                        (line, idx) => (
                                          <View
                                            key={`${ped.id_factura}-${idx}`}
                                            style={styles.lineRow}
                                          >
                                            <View style={styles.lineLeft}>
                                              <Text style={styles.lineQty}>
                                                {line.cantidad}×
                                              </Text>
                                              <Text style={styles.lineName} numberOfLines={3}>
                                                {line.nombre_producto}
                                              </Text>
                                            </View>
                                            <View style={styles.lineRight}>
                                              <Text style={styles.lineUnit}>
                                                {formatCOP(line.precio_unitario)} c/u
                                              </Text>
                                              <Text style={styles.lineSub}>
                                                {formatCOP(line.subtotal_linea)}
                                              </Text>
                                            </View>
                                          </View>
                                        ),
                                      )
                                    )}
                                    <View style={styles.totalsBox}>
                                      <View style={styles.totalLine}>
                                        <Text style={styles.totalLabel}>Subtotal</Text>
                                        <Text style={styles.totalValue}>
                                          {formatCOP(ped.subtotal)}
                                        </Text>
                                      </View>
                                      {(ped.descuento_sopas ?? 0) > 0 && (
                                        <View style={styles.totalLine}>
                                          <Text style={styles.totalLabel}>Desc. sopas</Text>
                                          <Text style={styles.totalDiscount}>
                                            −{formatCOP(ped.descuento_sopas ?? 0)}
                                          </Text>
                                        </View>
                                      )}
                                      {(ped.descuento_muleros ?? 0) > 0 && (
                                        <View style={styles.totalLine}>
                                          <Text style={styles.totalLabel}>Desc. muleros</Text>
                                          <Text style={styles.totalDiscount}>
                                            −{formatCOP(ped.descuento_muleros ?? 0)}
                                          </Text>
                                        </View>
                                      )}
                                      {descTotal > 0 && (
                                        <View style={styles.totalLine}>
                                          <Text style={styles.totalStrong}>
                                            Total cobrado
                                          </Text>
                                          <Text style={styles.totalStrongVal}>
                                            {formatCOP(ped.total)}
                                          </Text>
                                        </View>
                                      )}
                                    </View>
                                    <View style={styles.actionRow}>
                                      <IconTooltipButton
                                        icon={
                                          reimprimiendoId === ped.id_factura
                                            ? 'hourglass-outline'
                                            : AccionIcon.reimprimirCobro
                                        }
                                        label={
                                          reimprimiendoId === ped.id_factura
                                            ? 'Imprimiendo…'
                                            : 'Reimprimir cobro'
                                        }
                                        variant="secondary"
                                        disabled={reimprimiendoId === ped.id_factura}
                                        onPress={() =>
                                          reimprimirFactura(ped.id_pedido, ped.id_factura)
                                        }
                                      />
                                    </View>
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
            </View>
          );
        })}
      </View>
      </ScrollView>

      <FormModal visible={modalCaja} title="Caja inicial (efectivo)" onClose={closeCajaModal}>
        <Text style={formStyles.help}>
          Monto en caja al abrir el día ({data.fecha}). Al guardar se imprime un comprobante
          con la base registrada.
        </Text>
        <Text style={formStyles.label}>Monto en efectivo</Text>
        <MoneyTextInput
          style={[formStyles.input, moneyField]}
          placeholderAmount={200000}
          digits={montoBaseDigits}
          onChangeDigits={setMontoBaseDigits}
        />
        <ActionIconBar
          style={formStyles.modalActionBar}
          actions={[
            {
              key: 'cancel',
              icon: AdminIcon.cancelar,
              label: 'Cancelar',
              variant: 'secondary',
              disabled: savingCaja,
              onPress: closeCajaModal,
            },
            {
              key: 'guardar',
              icon: savingCaja ? 'hourglass-outline' : AccionIcon.guardar,
              label: savingCaja ? 'Guardando…' : 'Guardar caja',
              variant: 'primary',
              disabled: savingCaja,
              onPress: guardarCajaInicial,
            },
          ]}
        />
      </FormModal>

      <FormModal
        visible={modalConsulta}
        title="Consultar por fecha"
        onClose={closeConsultaModal}
      >
        <Text style={formStyles.help}>Deja vacío para ver el resumen de hoy.</Text>
        <Text style={formStyles.label}>Fecha</Text>
        <View style={styles.filterRow}>
          {Platform.OS === 'web' ? (
            <Pressable
              style={styles.dateBtn}
              onPress={() => setShowCalendar(true)}
            >
              <Text style={styles.dateBtnText}>
                {fechaDraft.trim() ? fechaDraft.trim() : 'Elegir fecha'}
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={styles.dateBtn}
                onPress={() => setShowPicker(true)}
              >
                <Text style={styles.dateBtnText}>
                  {fechaDraft.trim() ? fechaDraft.trim() : 'Elegir fecha'}
                </Text>
              </Pressable>
              {showPicker && (
                <DateTimePicker
                  value={
                    fechaDraft.trim()
                      ? new Date(`${fechaDraft.trim()}T12:00:00`)
                      : new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={(_, selectedDate) => {
                    setShowPicker(false);
                    if (selectedDate) {
                      setFechaDraft(formatYYYYMMDD(selectedDate));
                    }
                  }}
                />
              )}
            </>
          )}
        </View>
        <ActionIconBar
          style={formStyles.modalActionBar}
          actions={[
            {
              key: 'cancel',
              icon: AdminIcon.cancelar,
              label: 'Cancelar',
              variant: 'secondary',
              disabled: consultando,
              onPress: closeConsultaModal,
            },
            {
              key: 'hoy',
              icon: AdminIcon.verHoy,
              label: 'Ver hoy',
              variant: 'secondary',
              disabled: consultando,
              onPress: () => setFechaDraft(''),
            },
            {
              key: 'consultar',
              icon: consultando ? 'hourglass-outline' : AccionIcon.consultar,
              label: consultando ? 'Consultando…' : 'Consultar',
              variant: 'primary',
              disabled: consultando,
              onPress: () => onConsultar(fechaDraft),
            },
          ]}
        />
      </FormModal>

      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowCalendar(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Selecciona una fecha</Text>
            <Calendar
              onDayPress={(day) => {
                setFechaDraft(day.dateString);
                setShowCalendar(false);
              }}
              markedDates={
                fechaDraft.trim()
                  ? {
                      [fechaDraft.trim()]: {
                        selected: true,
                        selectedColor: colors.primary,
                      },
                    }
                  : undefined
              }
              theme={{
                todayTextColor: colors.primary,
                arrowColor: colors.primary,
              }}
            />
            <ActionIconBar
              style={formStyles.modalActionBar}
              actions={[
                {
                  key: 'close',
                  icon: AdminIcon.cancelar,
                  label: 'Cerrar',
                  variant: 'primary',
                  onPress: () => setShowCalendar(false),
                },
                {
                  key: 'hoy',
                  icon: AdminIcon.verHoy,
                  label: 'Ver hoy',
                  variant: 'secondary',
                  onPress: () => {
                    setFechaDraft('');
                    setShowCalendar(false);
                  },
                },
              ]}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  denied: { textAlign: 'center', color: colors.textMuted, marginBottom: 16, fontSize: 16 },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  kicker: { color: colors.textMuted, fontWeight: '700' },
  h1: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 4 },
  total: { fontSize: 28, fontWeight: '900', color: colors.primary, marginTop: 8 },
  sub: { marginTop: 4, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  sectionTitle: { fontWeight: '800', color: colors.text, marginBottom: 10 },
  sectionHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkAction: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  linkSep: { color: colors.textHint },
  help: { color: colors.textMuted, marginTop: -6, marginBottom: 10 },
  filterRow: { marginBottom: 4 },
  dateBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  dateBtnText: { fontSize: 16, fontWeight: '700', color: colors.text },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  btnText: { color: colors.surface, fontWeight: '900' },
  btnDisabled: { opacity: 0.65 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    backgroundColor: colors.surfaceMuted,
  },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  payRowLast: { marginBottom: 4 },
  payLabel: { color: colors.text, fontWeight: '600' },
  payValue: { fontWeight: '800', color: colors.text },
  payStrong: { fontWeight: '800', color: colors.primary },
  payStrongVal: { fontWeight: '900', color: colors.primary, fontSize: 17 },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    marginVertical: 8,
  },
  helpSmall: { fontSize: 12, color: colors.textMuted, marginTop: 8, lineHeight: 16 },
  ventaHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    marginBottom: 4,
  },
  ventaHeadCell: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  ventaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  ventaCell: { color: colors.text, fontWeight: '600' },
  ventaMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  ventaColNombre: { flex: 1 },
  ventaColCant: { width: 44, textAlign: 'center', fontWeight: '800' },
  ventaColSub: { width: 96, textAlign: 'right', fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 360,
    width: '100%',
    alignSelf: 'center',
  },
  modalTitle: { fontWeight: '900', color: colors.text, marginBottom: 10 },
  empty: { color: colors.textMuted },
  mesaBlock: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  mesaHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.backgroundAlt,
    gap: 8,
  },
  mesaHeadLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  mesaHeadText: { flex: 1 },
  mesaTitle: { fontWeight: '900', color: colors.text, fontSize: 16 },
  mesaSub: { color: colors.textMuted, marginTop: 2, fontSize: 13 },
  mesaTotal: { fontWeight: '900', color: colors.primary, fontSize: 16 },
  pedidoGrupoBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  pedidoGrupoHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: colors.surfaceMuted,
  },
  pedidoGrupoBody: {
    paddingBottom: 8,
    backgroundColor: colors.surface,
  },
  actionRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  cobroBlock: {
    marginHorizontal: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  cobroTitle: { fontWeight: '700', color: colors.text, fontSize: 13 },
  cobroTotal: { fontWeight: '800', color: colors.text, fontSize: 14 },
  pedidoBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  pedidoHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  pedidoHeadLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  pedidoHeadText: { flex: 1 },
  pedidoTitle: { fontWeight: '800', color: colors.text, fontSize: 14 },
  pedidoMeta: { color: colors.textMuted, marginTop: 2, fontSize: 12, lineHeight: 16 },
  pedidoTotal: { fontWeight: '900', color: colors.text, fontSize: 15 },
  pedidoBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.backgroundAlt,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: 8,
  },
  lineLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  lineQty: { fontWeight: '800', color: colors.textMuted, minWidth: 28 },
  lineName: { flex: 1, color: colors.text, fontWeight: '600' },
  lineRight: { alignItems: 'flex-end' },
  lineUnit: { fontSize: 11, color: colors.textMuted },
  lineSub: { fontWeight: '800', color: colors.text, marginTop: 2 },
  totalsBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    gap: 4,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { color: colors.textMuted, fontWeight: '600' },
  totalValue: { fontWeight: '700', color: colors.text },
  totalDiscount: { fontWeight: '700', color: colors.danger },
  totalStrong: { fontWeight: '800', color: colors.primary },
  totalStrongVal: { fontWeight: '900', color: colors.primary },
});

