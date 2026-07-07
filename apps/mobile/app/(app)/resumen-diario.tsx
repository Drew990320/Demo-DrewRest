import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { useResumenDiarioToolsRail } from '../../src/context/ResumenDiarioToolsRailContext';
import type { ActionIconItem } from '../../src/components/ActionIconBar';
import { FormModal } from '../../src/components/FormModal';
import { ResumenSeccionNav, type ResumenSeccionId } from '../../src/components/ResumenSeccionNav';
import { ResumenSeccionPanel } from '../../src/components/ResumenSeccionPanel';
import { ResumenPedidoAccionesBar } from '../../src/components/ResumenPedidoAccionesBar';
import { ResumenQuickStats } from '../../src/components/ResumenQuickStats';
import { ResumenNestedAccordion } from '../../src/components/ResumenNestedAccordion';
import { MoneyTextInput } from '../../src/components/MoneyTextInput';
import { IconTooltipButton } from '../../src/components/IconTooltipButton';
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { StatusAlertBanner } from '../../src/components/StatusAlertBanner';
import { useAuth } from '../../src/context/AuthContext';
import { AccionIcon, AdminIcon, ResumenIcon } from '../../src/lib/app-icons';
import { api } from '../../src/lib/api';
import { alertarSiSinPapel } from '../../src/lib/alarma-impresora';
import { confirmAppDialog, showNotice } from '../../src/lib/app-dialog';
import {
  mensajeImpresionFallidaTrasAccion,
  notificarResultadoImpresion,
} from '../../src/lib/impresion-resultado';
import { mostrarVistaPreviaTicket } from '../../src/lib/ticket-preview';
import { esErrorImpresionNoDisponible } from '@la-reserva/shared-domain/impresion-soporte';
import { manejarErrorAccion, manejarErrorOperacion } from '../../src/lib/recurso-disponible';
import { digitsFromMonto, parseCOPDigits } from '../../src/lib/cop-input';
import {
  calcularEfectivoEsperadoEnCaja,
  etiquetaTipoMovimientoCaja,
  type TipoMovimientoCaja,
} from '@la-reserva/shared-domain/movimiento-caja';
import {
  avisarSiMontoCOPInvalido,
} from '../../src/lib/form-validation';
import { formatCOP } from '../../src/lib/format';
import { tituloLugarMesa } from '../../src/lib/mesa-label';
import { joinPedidoRooms } from '../../src/lib/pedido-sync';
import { fechaCalendarioBogota, horaBogota } from '../../src/lib/fecha-bogota';
import { agruparCobrosVista } from '@la-reserva/shared-domain/factura-mixto';
import {
  mensajePendientesCobro,
  type PendientesCobroResumen,
} from '../../src/lib/pendientes-cobro-resumen';
import { cobrosResumenMixto } from '@la-reserva/shared-domain/factura-mixto';
import { useRefetchOnSync } from '../../src/hooks/useRefetchOnSync';
import { useFormFieldStyle } from '../../src/hooks/useFormFieldStyle';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useNetwork } from '../../src/context/NetworkContext';
import { useModoPruebasAdmin } from '../../src/hooks/useModoPruebasAdmin';
import { formStyles } from '../../src/lib/form-layout';
import { useVisualTheme } from '../../src/context/VisualThemeContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import type { AppColors } from '../../src/lib/theme';

const LISTA_VENTAS_PREVIEW = 10;

type Resumen = {
  fecha: string;
  total_facturado: number;
  total_facturas: number;
  total_mesas_atendidas: number;
  subtotal_ventas_bruto?: number;
  total_descuentos_dia?: number;
  monto_base_efectivo?: number;
  monto_base_cierre_efectivo?: number | null;
  total_pagos_meseros?: number;
  pagos_meseros?: {
    id_registro: number;
    id_usuario: number;
    mesero: string;
    monto: number;
  }[];
  total_devoluciones_efectivo?: number;
  total_entradas_manual?: number;
  total_salidas_manual?: number;
  total_pagos_domicilio?: number;
  total_pagos_mesero_exceso?: number;
  subtotal_entradas_caja?: number;
  subtotal_salidas_caja?: number;
  movimientos_caja?: {
    id_movimiento: number;
    tipo: TipoMovimientoCaja;
    monto: number;
    motivo?: string | null;
    metodo_devolucion?: 'efectivo' | 'transferencia' | null;
    id_pedido?: number | null;
    id_factura?: number | null;
    mesa_numero?: number | null;
    registrado_por: string;
    creado_en: string;
  }[];
  devoluciones_exceso_transferencia?: {
    id_movimiento: number;
    monto: number;
    metodo_devolucion: 'efectivo' | 'transferencia';
    id_pedido: number;
    id_factura: number | null;
    mesa_numero: number;
    registrado_por: string;
    creado_en: string;
  }[];
  totales_por_metodo?: {
    efectivo: number;
    transferencia: number;
  };
  efectivo_esperado_en_caja?: number;
  pedidos_reabiertos_pendientes?: number;
  mesas: {
    mesa_numero: number;
    pedidos_atendidos: number;
    cobros_atendidos?: number;
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
    descuento_promociones?: number;
    total: number;
    metodo_pago: string;
    emitida_en: string;
    es_parcial?: boolean;
    cobro_mixto_grupo?: number | null;
    persona_plan_indice?: number | null;
    pedido_estado?: string;
    detalles: {
      nombre_producto: string;
      cantidad: number;
      precio_unitario: number;
      subtotal_linea: number;
    }[];
  }[];
};

type CobroDetalleResumen = NonNullable<Resumen['pedidos_detalle']>[number];

type PedidoGrupoResumen = {
  id_pedido: number;
  mesa_numero: number;
  pedido_estado: string;
  facturas: CobroDetalleResumen[];
  total: number;
};

function digitosFiltroPedido(raw: string): string {
  return raw.replace(/\D/g, '');
}

function pedidoCoincideFiltro(idPedido: number, digitos: string): boolean {
  if (!digitos) return true;
  return String(idPedido).includes(digitos);
}

function resolverPedidoGrupoFiltro(
  digitos: string,
  pedidos: PedidoGrupoResumen[],
): PedidoGrupoResumen | null {
  if (!digitos) return null;
  const exact = pedidos.find((g) => g.id_pedido === Number(digitos));
  if (exact) return exact;
  const parciales = pedidos.filter((g) => pedidoCoincideFiltro(g.id_pedido, digitos));
  return parciales.length === 1 ? parciales[0]! : null;
}

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
  const pagosMeseros = raw.total_pagos_meseros ?? 0;
  const movimientos = raw.movimientos_caja ?? [];
  const cuadre = calcularEfectivoEsperadoEnCaja({
    monto_base_efectivo: base,
    ventas_efectivo: tp.efectivo,
    total_pagos_meseros: pagosMeseros,
    movimientos: movimientos.map((m) => ({
      tipo: m.tipo,
      monto: m.monto,
      metodo_devolucion: m.metodo_devolucion,
    })),
  });
  const esperado = raw.efectivo_esperado_en_caja ?? cuadre.efectivo_esperado_en_caja;
  return {
    ...raw,
    monto_base_efectivo: base,
    totales_por_metodo: tp,
    total_pagos_meseros: pagosMeseros,
    pagos_meseros: raw.pagos_meseros ?? [],
    total_devoluciones_efectivo: cuadre.total_devoluciones_efectivo,
    total_entradas_manual: cuadre.total_entradas_manual,
    total_salidas_manual: cuadre.total_salidas_manual,
    total_pagos_domicilio: cuadre.total_pagos_domicilio,
    total_pagos_mesero_exceso: cuadre.total_pagos_mesero_exceso,
    subtotal_entradas_caja: raw.subtotal_entradas_caja ?? cuadre.subtotal_entradas_caja,
    subtotal_salidas_caja: raw.subtotal_salidas_caja ?? cuadre.subtotal_salidas_caja,
    movimientos_caja: movimientos,
    devoluciones_exceso_transferencia: raw.devoluciones_exceso_transferencia ?? [],
    efectivo_esperado_en_caja: esperado,
    pedidos_detalle: raw.pedidos_detalle ?? [],
    platos_por_categoria: raw.platos_por_categoria ?? [],
    items_menu: raw.items_menu ?? [],
  };
}

function metodoPagoLabel(m: string): string {
  if (m === 'efectivo') return 'Efectivo';
  if (m === 'transferencia') return 'Transferencia';
  if (m === 'mixto') return 'Pago mixto';
  if (m === 'credito') return 'Crédito';
  return m;
}

function descripcionMovimientoCaja(
  m: NonNullable<Resumen['movimientos_caja']>[number],
): string {
  if (m.tipo === 'entrada_manual' || m.tipo === 'salida_manual') {
    return m.motivo?.trim() || etiquetaTipoMovimientoCaja(m.tipo);
  }
  if (m.tipo === 'pago_domicilio' || m.tipo === 'pago_mesero') {
    return m.motivo?.trim() || `Pedido #${m.id_pedido ?? '?'}`;
  }
  const mesa =
    m.mesa_numero != null ? `Mesa ${m.mesa_numero}` : 'Pedido';
  const ped = m.id_pedido != null ? ` · #${m.id_pedido}` : '';
  const met =
    m.metodo_devolucion === 'efectivo'
      ? ' (efectivo)'
      : m.metodo_devolucion === 'transferencia'
        ? ' (transferencia)'
        : '';
  return `${mesa}${ped}${met}`;
}

export default function ResumenDiarioScreen() {
  const { colors } = useVisualTheme();
  const styles = useThemedStyles(createResumenDiarioStyles);
  const { token, user } = useAuth();
  const router = useRouter();
  const r = useResponsive();
  const { online } = useNetwork();
  const [data, setData] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [consultando, setConsultando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fecha, setFecha] = useState<string>(''); // YYYY-MM-DD o vacío (hoy)
  const [fechaDraft, setFechaDraft] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [montoBaseDigits, setMontoBaseDigits] = useState('');
  const [montoBaseCierreDigits, setMontoBaseCierreDigits] = useState('');
  const [modalCaja, setModalCaja] = useState(false);
  const [modalCajaCierre, setModalCajaCierre] = useState(false);
  const [modalMovCaja, setModalMovCaja] = useState(false);
  const [tipoMovCaja, setTipoMovCaja] = useState<'entrada_manual' | 'salida_manual'>(
    'salida_manual',
  );
  const [montoMovCajaDigits, setMontoMovCajaDigits] = useState('');
  const [motivoMovCaja, setMotivoMovCaja] = useState('');
  const [savingMovCaja, setSavingMovCaja] = useState(false);
  const [imprimiendoMovCajaId, setImprimiendoMovCajaId] = useState<number | null>(
    null,
  );
  const [modalConsulta, setModalConsulta] = useState(false);
  const [savingCaja, setSavingCaja] = useState(false);
  const [savingCajaCierre, setSavingCajaCierre] = useState(false);
  const [reimprimiendoId, setReimprimiendoId] = useState<number | null>(null);
  const [reimprimiendoPedidoId, setReimprimiendoPedidoId] = useState<number | null>(
    null,
  );
  const [imprimiendoCompleto, setImprimiendoCompleto] = useState(false);
  const [imprimiendoTotal, setImprimiendoTotal] = useState(false);
  const [imprimiendoSeleccion, setImprimiendoSeleccion] = useState(false);
  const [vaciandoResumen, setVaciandoResumen] = useState(false);
  const [cancelandoReabiertos, setCancelandoReabiertos] = useState(false);
  const [modalModoPruebas, setModalModoPruebas] = useState(false);
  const [passwordModoPruebas, setPasswordModoPruebas] = useState('');
  const modoPruebas = useModoPruebasAdmin();
  const [modalReabrirPedidoId, setModalReabrirPedidoId] = useState<number | null>(null);
  const [motivoReabrir, setMotivoReabrir] = useState('');
  const [reabririendoPedidoId, setReabririendoPedidoId] = useState<number | null>(null);
  const [modalArchivo, setModalArchivo] = useState(false);
  const [selFacturas, setSelFacturas] = useState<Record<number, boolean>>({});
  const [selComandas, setSelComandas] = useState<Record<number, boolean>>({});
  const [archivoVerFactura, setArchivoVerFactura] = useState<Record<number, boolean>>(
    {},
  );
  const [reimprimiendoComandaId, setReimprimiendoComandaId] = useState<number | null>(
    null,
  );
  const [archivoTab, setArchivoTab] = useState<'comandas' | 'facturas'>('comandas');
  const [seccionActiva, setSeccionActiva] = useState<ResumenSeccionId>('ingresos');
  const [platosVerTodos, setPlatosVerTodos] = useState(false);
  const [itemsVerTodos, setItemsVerTodos] = useState(false);
  const [mesasAbiertas, setMesasAbiertas] = useState<Record<number, boolean>>({});
  const [gruposPedidoAbiertos, setGruposPedidoAbiertos] = useState<
    Record<number, boolean>
  >({});
  const [pedidosAbiertos, setPedidosAbiertos] = useState<Record<number, boolean>>({});
  const [mixtosAbiertos, setMixtosAbiertos] = useState<Record<string, boolean>>({});
  const [filtroNumPedido, setFiltroNumPedido] = useState('');
  const [lineasPorFactura, setLineasPorFactura] = useState<
    Record<number, NonNullable<Resumen['pedidos_detalle']>[number]['detalles']>
  >({});
  const [cargandoLineas, setCargandoLineas] = useState<Record<number, boolean>>(
    {},
  );
  const [pendientesCobro, setPendientesCobro] =
    useState<PendientesCobroResumen | null>(null);
  const moneyField = useFormFieldStyle('money');

  type CobroDetalle = CobroDetalleResumen;

  const filtroPedidoDigits = useMemo(
    () => digitosFiltroPedido(filtroNumPedido),
    [filtroNumPedido],
  );

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

  const pedidosGrupoTodos = useMemo(() => {
    const all: PedidoGrupoResumen[] = [];
    for (const lista of pedidosGrupoPorMesa.values()) {
      all.push(...lista);
    }
    return all.sort((a, b) => a.id_pedido - b.id_pedido);
  }, [pedidosGrupoPorMesa]);

  const pedidosGrupoFiltrados = useMemo(() => {
    if (!filtroPedidoDigits) return pedidosGrupoTodos;
    return pedidosGrupoTodos.filter((g) =>
      pedidoCoincideFiltro(g.id_pedido, filtroPedidoDigits),
    );
  }, [pedidosGrupoTodos, filtroPedidoDigits]);

  const pedidoGrupoAccion = useMemo(
    () => resolverPedidoGrupoFiltro(filtroPedidoDigits, pedidosGrupoTodos),
    [filtroPedidoDigits, pedidosGrupoTodos],
  );

  const cobrosOrdenados = useMemo(() => {
    return [...(data?.pedidos_detalle ?? [])].sort(
      (a, b) =>
        new Date(a.emitida_en).getTime() - new Date(b.emitida_en).getTime(),
    );
  }, [data?.pedidos_detalle]);

  const cobrosArchivoVista = useMemo(
    () => agruparCobrosVista(cobrosOrdenados),
    [cobrosOrdenados],
  );

  const pedidosComandaDelDia = useMemo(() => {
    const map = new Map<
      number,
      { id_pedido: number; mesa_numero: number; num_cobros: number }
    >();
    for (const cobro of data?.pedidos_detalle ?? []) {
      let pedido = map.get(cobro.id_pedido);
      if (!pedido) {
        pedido = {
          id_pedido: cobro.id_pedido,
          mesa_numero: cobro.mesa_numero,
          num_cobros: 0,
        };
        map.set(cobro.id_pedido, pedido);
      }
      pedido.num_cobros += 1;
    }
    return [...map.values()].sort((a, b) => a.id_pedido - b.id_pedido);
  }, [data?.pedidos_detalle]);

  const pedidosComandaArchivo = useMemo(() => {
    if (!filtroPedidoDigits) return pedidosComandaDelDia;
    return pedidosComandaDelDia.filter((p) =>
      pedidoCoincideFiltro(p.id_pedido, filtroPedidoDigits),
    );
  }, [pedidosComandaDelDia, filtroPedidoDigits]);

  const cobrosArchivoFiltrados = useMemo(() => {
    if (!filtroPedidoDigits) return cobrosArchivoVista;
    return cobrosArchivoVista.filter((vista) => {
      const idPedido =
        vista.tipo === 'mixto' ? vista.cobros[0]?.id_pedido : vista.cobro.id_pedido;
      return idPedido != null && pedidoCoincideFiltro(idPedido, filtroPedidoDigits);
    });
  }, [cobrosArchivoVista, filtroPedidoDigits]);

  const archivoSeleccion = useMemo(() => {
    const facturas = Object.entries(selFacturas)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));
    const comandas = Object.entries(selComandas)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));
    return { facturas, comandas, total: facturas.length + comandas.length };
  }, [selFacturas, selComandas]);

  function toggleGrupoPedido(idPedido: number) {
    setGruposPedidoAbiertos((prev) => {
      const abriendo = !prev[idPedido];
      if (abriendo) {
        setFiltroNumPedido(String(idPedido));
      }
      return { ...prev, [idPedido]: abriendo };
    });
  }

  function cambiarSeccion(id: ResumenSeccionId) {
    if (seccionActiva === 'detalle' && id !== 'detalle') {
      contraerTodasLasMesas();
    }
    setSeccionActiva(id);
  }

  function toggleMesa(numero: number) {
    setMesasAbiertas((prev) => ({ ...prev, [numero]: !prev[numero] }));
  }

  function toggleMixto(key: string) {
    setMixtosAbiertos((prev) => ({ ...prev, [key]: !prev[key] }));
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
      } catch (e) {
        await manejarErrorOperacion(e, {
          title: 'Detalle del cobro',
          message: 'No se pudieron cargar los ítems de esta factura.',
        });
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
    setMixtosAbiertos({});
  }

  function formatYYYYMMDD(d: Date): string {
    return fechaCalendarioBogota(d);
  }

  function esConsultaDeHoy(): boolean {
    const hoy = fechaCalendarioBogota();
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
      offlineFallback: false,
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
    setMixtosAbiertos({});
    setLineasPorFactura({});
    return n;
  }, [token, fecha]);

  const loadPendientesCobro = useCallback(async () => {
    try {
      const res = await api<PendientesCobroResumen>(
        '/pedidos/pendientes-cobro/resumen',
        { token, cacheKey: 'pendientes_cobro_admin' },
      );
      setPendientesCobro(res);
    } catch {
      setPendientesCobro(null);
    }
  }, [token]);

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
        await Promise.all([load(), loadPendientesCobro()]);
      } catch (e) {
        await manejarErrorOperacion(e, {
          title: 'Resumen diario',
          message: 'No se pudo cargar el resumen.',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [load, loadPendientesCobro, user]);

  useEffect(() => {
    joinPedidoRooms({ resumen: true });
  }, []);

  useEffect(() => {
    setPlatosVerTodos(false);
    setItemsVerTodos(false);
    setFiltroNumPedido('');
  }, [fecha]);

  useEffect(() => {
    const ped = pedidoGrupoAccion;
    if (!ped) return;
    setSeccionActiva('detalle');
    setMesasAbiertas((prev) => ({ ...prev, [ped.mesa_numero]: true }));
    setGruposPedidoAbiertos((prev) => ({ ...prev, [ped.id_pedido]: true }));
  }, [pedidoGrupoAccion]);

  const refetchSiHoy = useCallback(async () => {
    if (!esConsultaDeHoy()) return;
    try {
      await Promise.all([load(), loadPendientesCobro()]);
    } catch {
      /* sincronización en segundo plano */
    }
  }, [load, loadPendientesCobro, fecha]);

  useRefetchOnSync(refetchSiHoy, {
    enabled: user?.rol === 'admin',
    source: 'pedido',
  });

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([load(), loadPendientesCobro()]);
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'Resumen diario',
        message: 'No se pudo actualizar el resumen.',
      });
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

  function resetMontoBaseCierreDesdeData() {
    if (!data) return;
    const guardado = data.monto_base_cierre_efectivo;
    const sugerido =
      guardado != null
        ? guardado
        : data.efectivo_esperado_en_caja ?? 0;
    setMontoBaseCierreDigits(digitsFromMonto(sugerido));
  }

  function openCajaModal() {
    if (!online) {
      void showNotice(
        'Sin conexión',
        'No se puede registrar la caja inicial sin conexión al servidor.',
        'warning',
      );
      return;
    }
    resetMontoBaseDesdeData();
    setModalCaja(true);
  }

  function closeCajaModal() {
    if (savingCaja) return;
    setModalCaja(false);
    resetMontoBaseDesdeData();
  }

  function openCajaCierreModal() {
    if (!online) {
      void showNotice(
        'Sin conexión',
        'No se puede registrar el cierre de caja sin conexión al servidor.',
        'warning',
      );
      return;
    }
    resetMontoBaseCierreDesdeData();
    setModalCajaCierre(true);
  }

  function closeCajaCierreModal() {
    if (savingCajaCierre) return;
    setModalCajaCierre(false);
    resetMontoBaseCierreDesdeData();
  }

  async function guardarCajaCierre() {
    if (!data) return;
    if (
      await avisarSiMontoCOPInvalido(
        'Caja de cierre (efectivo contado)',
        montoBaseCierreDigits,
        showNotice,
        { permitirCero: true },
      )
    ) {
      return;
    }
    const n = parseCOPDigits(montoBaseCierreDigits);
    setSavingCajaCierre(true);
    try {
      const res = await api<{
        fecha: string;
        monto_base_cierre_efectivo: number;
        efectivo_esperado_en_caja?: number;
        impresion_cierre?: {
          impreso?: boolean;
          en_cola?: boolean;
          error?: string;
          codigo_error?: string;
        };
      }>('/pedidos/caja-diaria/cierre', {
        method: 'PUT',
        token,
        body: JSON.stringify({
          fecha: data.fecha,
          monto_base_cierre_efectivo: n,
        }),
      });
      await load();
      const imp = res.impresion_cierre;
      if (alertarSiSinPapel(imp ?? {})) {
        return;
      }
      if (imp?.impreso || imp?.en_cola) {
        await showNotice(
          'Cierre guardado',
          imp.en_cola
            ? 'Base de cierre registrada. El comprobante se imprime en cola.'
            : 'Base de cierre registrada e impresa.',
          'success',
        );
      } else if (imp?.error) {
        if (esErrorImpresionNoDisponible(imp)) {
          await mostrarVistaPreviaTicket(
            imp.preview_html,
            'Vista previa — arqueo de cierre',
          );
        } else {
          await showNotice(
            'Cierre guardado',
            mensajeImpresionFallidaTrasAccion(imp, 'Base registrada, pero no se imprimió.'),
            'warning',
          );
        }
      }
      setModalCajaCierre(false);
    } catch (e) {
      await manejarErrorAccion(e, 'guardar la base de cierre');
    } finally {
      setSavingCajaCierre(false);
    }
  }

  function openMovCajaModal(tipo: 'entrada_manual' | 'salida_manual') {
    setTipoMovCaja(tipo);
    setMontoMovCajaDigits('');
    setMotivoMovCaja('');
    setModalMovCaja(true);
  }

  function closeMovCajaModal() {
    if (savingMovCaja) return;
    setModalMovCaja(false);
    setMontoMovCajaDigits('');
    setMotivoMovCaja('');
  }

  async function guardarMovimientoCaja() {
    if (!data) return;
    if (
      await avisarSiMontoCOPInvalido(
        tipoMovCaja === 'entrada_manual' ? 'Entrada de caja' : 'Salida de caja',
        montoMovCajaDigits,
        showNotice,
      )
    ) {
      return;
    }
    const motivo = motivoMovCaja.trim();
    if (!motivo) {
      await showNotice('Movimiento de caja', 'Indica el motivo.', 'warning');
      return;
    }
    setSavingMovCaja(true);
    try {
      const res = await api<{
        impresion_movimiento?: {
          impreso?: boolean;
          en_cola?: boolean;
          error?: string;
          codigo_error?: string;
        };
      }>('/pedidos/movimientos-caja', {
        method: 'POST',
        token,
        body: JSON.stringify({
          tipo: tipoMovCaja,
          monto: parseCOPDigits(montoMovCajaDigits),
          motivo,
          fecha: data.fecha,
        }),
      });
      closeMovCajaModal();
      await load();
      await avisarImpresionMovimientoCaja(tipoMovCaja, res.impresion_movimiento);
    } catch (e) {
      await manejarErrorAccion(e, 'registrar el movimiento de caja');
    } finally {
      setSavingMovCaja(false);
    }
  }

  async function reimprimirMovimientoCaja(
    id: number,
    tipo: 'entrada_manual' | 'salida_manual',
  ) {
    if (imprimiendoMovCajaId != null) return;
    setImprimiendoMovCajaId(id);
    try {
      const res = await api<{
        impresion_movimiento?: {
          impreso?: boolean;
          en_cola?: boolean;
          error?: string;
          codigo_error?: string;
        };
      }>(`/pedidos/movimientos-caja/${id}/imprimir`, {
        method: 'POST',
        token,
      });
      await avisarImpresionMovimientoCaja(
        tipo,
        res.impresion_movimiento,
        'reimprimir',
      );
    } catch (e) {
      await manejarErrorAccion(e, 'imprimir el comprobante');
    } finally {
      setImprimiendoMovCajaId(null);
    }
  }

  async function avisarImpresionMovimientoCaja(
    tipo: 'entrada_manual' | 'salida_manual',
    imp?: {
      impreso?: boolean;
      en_cola?: boolean;
      error?: string;
      codigo_error?: string;
    },
    contexto: 'registrar' | 'reimprimir' = 'registrar',
  ) {
    const etiqueta = tipo === 'entrada_manual' ? 'Entrada' : 'Salida';
    if (imp && alertarSiSinPapel(imp)) return;
    if (imp?.impreso || imp?.en_cola) {
      await showNotice(
        contexto === 'registrar' ? `${etiqueta} registrada` : 'Comprobante',
        imp.en_cola
          ? contexto === 'registrar'
            ? `${etiqueta} registrada. Comprobante en cola de impresión.`
            : 'Comprobante en cola de impresión.'
          : contexto === 'registrar'
            ? `${etiqueta} registrada e impresa.`
            : 'Comprobante enviado a la impresora.',
        'success',
      );
      return;
    }
    if (imp?.error) {
      if (esErrorImpresionNoDisponible(imp)) {
        await mostrarVistaPreviaTicket(
          imp.preview_html,
          contexto === 'registrar'
            ? `Vista previa — ${etiqueta}`
            : 'Vista previa del comprobante',
        );
        return;
      }
      await showNotice(
        contexto === 'registrar' ? `${etiqueta} registrada` : 'Impresión',
        contexto === 'registrar'
          ? mensajeImpresionFallidaTrasAccion(imp, `${etiqueta} registrada, pero no se imprimió.`)
          : `No se pudo imprimir: ${imp.error}`,
        'warning',
      );
      return;
    }
    if (contexto === 'registrar') {
      await showNotice(
        `${etiqueta} registrada`,
        'El movimiento quedó en el resumen del día.',
        'success',
      );
    }
  }

  async function eliminarMovimientoCaja(id: number) {
    const ok = await confirmAppDialog(
      'Eliminar movimiento',
      '¿Quitar este movimiento manual del resumen del día?',
    );
    if (!ok) return;
    try {
      await api(`/pedidos/movimientos-caja/${id}`, {
        method: 'DELETE',
        token,
      });
      await load();
    } catch (e) {
      await manejarErrorAccion(e, 'eliminar el movimiento');
    }
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
        if (esErrorImpresionNoDisponible(imp)) {
          await mostrarVistaPreviaTicket(imp.preview_html, 'Vista previa — base de caja');
        } else {
          await showNotice(
            'Caja guardada',
            mensajeImpresionFallidaTrasAccion(imp, 'Base registrada, pero no se imprimió.'),
            'warning',
          );
        }
      }
      setModalCaja(false);
    } catch (e) {
      await manejarErrorAccion(e, 'guardar la base de caja');
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
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'Resumen diario',
        message: 'No se pudo consultar esa fecha.',
      });
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
      if (
        res.facturas_impresas === 0 &&
        res.comandas_impresas === 0 &&
        (res.errores.length === 0 ||
          esErrorImpresionNoDisponible({ error: res.errores[0] }))
      ) {
        await mostrarVistaPreviaTicket(undefined, 'Impresión del día');
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
      await manejarErrorAccion(e, 'imprimir facturas y comandas');
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
      await notificarResultadoImpresion(
        imp,
        {
          titulo: 'Cierre impreso',
          mensaje: `Ticket de totales del ${data.fecha} enviado a ${imp?.destino ?? 'la impresora'}.`,
        },
        { titulo: 'Sin imprimir', mensaje: imp?.error ?? 'No se pudo imprimir el cierre.' },
      );
    } catch (e) {
      await manejarErrorAccion(e, 'imprimir el cierre');
    } finally {
      setImprimiendoTotal(false);
    }
  }

  async function cancelarPedidosReabiertos() {
    // Tras «Vaciar día» el contador en pantalla puede quedar viejo: refrescar siempre.
    let n = data?.pedidos_reabiertos_pendientes ?? 0;
    try {
      const fresh = await load();
      n = fresh?.pedidos_reabiertos_pendientes ?? 0;
    } catch {
      /* usar contador en memoria */
    }
    if (n === 0) {
      await showNotice(
        'Sin pedidos reabiertos',
        'No hay pedidos reabiertos sin cobro en esta fecha.',
        'info',
      );
      return;
    }
    const fechaLabel = (data?.fecha ?? fecha) || 'hoy';
    const ok = await confirmAppDialog(
      'Cancelar pedidos reabiertos',
      `Se eliminarán ${n} pedido(s) reabierto(s) del ${fechaLabel} (sin cobro) y se liberarán las mesas.\n\nSolo para pruebas. No se puede deshacer.`,
      'warning',
    );
    if (!ok) return;
    const ok2 = await confirmAppDialog(
      'Confirmar cancelación masiva',
      'Confirma escribiendo mentalmente "CANCELAR" para eliminar todos los pedidos reabiertos pendientes.',
      'warning',
    );
    if (!ok2) return;

    setCancelandoReabiertos(true);
    try {
      const res = await api<{
        fecha: string;
        pedidos_cancelados: number;
        mesas_liberadas: number;
      }>(`/pedidos/resumen-diario/cancelar-reabiertos${qsFecha()}`, {
        method: 'POST',
        token,
        body: JSON.stringify({ confirmar: 'CANCELAR' }),
      });
      await showNotice(
        'Pedidos cancelados',
        `${res.pedidos_cancelados} pedido(s) eliminado(s). ${res.mesas_liberadas} mesa(s) liberada(s).`,
        'success',
      );
      await load();
    } catch (e) {
      await manejarErrorAccion(e, 'cancelar los pedidos reabiertos');
    } finally {
      setCancelandoReabiertos(false);
    }
  }

  async function vaciarResumenDia() {
    const fechaLabel = (data?.fecha ?? fecha) || 'hoy';
    const ok = await confirmAppDialog(
      'Vaciar resumen del día',
      `Se eliminarán todas las facturas del ${fechaLabel}, se reabrirán pedidos afectados y se borrará la caja inicial del día.\n\nSolo para pruebas. Esta acción no se puede deshacer.`,
      'warning',
    );
    if (!ok) return;
    const ok2 = await confirmAppDialog(
      'Confirmar vaciado',
      'Escribe mentalmente "VACIAR" y confirma para borrar el resumen de este día.',
      'warning',
    );
    if (!ok2) return;

    setVaciandoResumen(true);
    try {
      const res = await api<{
        fecha: string;
        facturas_eliminadas: number;
        pedidos_reabiertos: number;
      }>(`/pedidos/resumen-diario/vaciar${qsFecha()}`, {
        method: 'POST',
        token,
        body: JSON.stringify({ confirmar: 'VACIAR' }),
      });
      // Actualizar contador al instante para que «Cancelar reabiertos» funcione de una.
      setData((prev) =>
        prev
          ? {
              ...prev,
              total_facturado: 0,
              total_facturas: 0,
              mesas: [],
              pedidos_detalle: [],
              pedidos_reabiertos_pendientes: res.pedidos_reabiertos,
            }
          : prev,
      );
      await showNotice(
        'Resumen vaciado',
        `${res.facturas_eliminadas} factura(s) eliminada(s). ${res.pedidos_reabiertos} pedido(s) reabierto(s).`,
        'success',
      );
      await load();
    } catch (e) {
      await manejarErrorAccion(e, 'vaciar el resumen del día');
    } finally {
      setVaciandoResumen(false);
    }
  }

  function abrirModalReabrirCobro(idPedido: number) {
    setModalReabrirPedidoId(idPedido);
    setMotivoReabrir('');
  }

  function cerrarModalReabrirCobro() {
    if (reabririendoPedidoId != null) return;
    setModalReabrirPedidoId(null);
    setMotivoReabrir('');
  }

  async function ejecutarReabrirCobro() {
    const idPedido = modalReabrirPedidoId;
    if (idPedido == null) return;
    const motivo = motivoReabrir.trim();
    if (motivo.length < 3) {
      await showNotice(
        'Motivo requerido',
        'Indica por qué se anula el cobro (mínimo 3 caracteres).',
        'warning',
      );
      return;
    }

    setReabririendoPedidoId(idPedido);
    try {
      const res = await api<{
        id_pedido: number;
        facturas_eliminadas: number;
        movimientos_caja_eliminados: number;
        estado: string;
      }>(`/pedidos/${idPedido}/reabrir-cobro`, {
        method: 'POST',
        token,
        body: JSON.stringify({ confirmar: 'REABRIR', motivo }),
      });
      cerrarModalReabrirCobro();
      await load();
      await showNotice(
        'Cobro anulado',
        `Pedido #${res.id_pedido} reabierto (${res.facturas_eliminadas} factura(s), ${res.movimientos_caja_eliminados} mov. caja). Estado: ${res.estado}.`,
        'success',
      );
      const ir = await confirmAppDialog(
        'Ir al pedido',
        '¿Abrir el pedido para corregirlo y volver a cobrar?',
        'info',
      );
      if (ir) {
        router.push(`/(app)/pedido/${idPedido}`);
      }
    } catch (e) {
      await manejarErrorAccion(e, 'reabrir el cobro del pedido');
    } finally {
      setReabririendoPedidoId(null);
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
      if (imp?.impreso) {
        await showNotice(
          'Reimpresión',
          `Total del pedido #${idPedido} reimpreso (${imp.destino ?? 'impresora'}). Incluye todos los ítems${(res.num_cobros ?? 1) > 1 ? ` y ${res.num_cobros} cobros` : ''}.`,
          'success',
        );
      } else {
        await notificarResultadoImpresion(
          imp,
          { titulo: 'Reimpresión', mensaje: '' },
          { titulo: 'Sin imprimir', mensaje: 'No se pudo imprimir el total del pedido.' },
        );
      }
    } catch (e) {
      await manejarErrorAccion(e, 'reimprimir el total del pedido');
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
      if (imp?.impreso) {
        await showNotice(
          'Reimpresión',
          `Factura reimpresa (${imp.destino ?? 'impresora'}). El ticket indica REIMPRESIÓN.`,
          'success',
        );
      } else {
        await notificarResultadoImpresion(
          imp,
          { titulo: 'Reimpresión', mensaje: '' },
          { titulo: 'Sin imprimir', mensaje: 'No se pudo imprimir la factura.' },
        );
      }
    } catch (e) {
      await manejarErrorAccion(e, 'reimprimir la factura');
    } finally {
      setReimprimiendoId(null);
    }
  }

  async function reimprimirComanda(idPedido: number) {
    setReimprimiendoComandaId(idPedido);
    try {
      const res = await api<{
        impresion_comanda?: {
          impreso: boolean;
          error?: string;
          destino?: string;
          codigo_error?: string;
        };
      }>(`/pedidos/${idPedido}/reimprimir-comanda`, {
        method: 'POST',
        token,
      });
      if (alertarSiSinPapel(res)) {
        return;
      }
      const imp = res.impresion_comanda;
      await notificarResultadoImpresion(
        imp,
        {
          titulo: 'Comanda reimpresa',
          mensaje: `Ticket impreso (${imp?.destino ?? 'impresora'}).`,
        },
        { titulo: 'Sin imprimir', mensaje: 'No se pudo imprimir la comanda.' },
      );
    } catch (e) {
      await manejarErrorAccion(e, 'reimprimir la comanda');
    } finally {
      setReimprimiendoComandaId(null);
    }
  }

  function abrirModalArchivo() {
    setSelFacturas({});
    setSelComandas({});
    setArchivoVerFactura({});
    setArchivoTab('comandas');
    setModalArchivo(true);
  }

  function cerrarModalArchivo() {
    setModalArchivo(false);
  }

  function toggleSelFactura(idFactura: number) {
    setSelFacturas((prev) => ({ ...prev, [idFactura]: !prev[idFactura] }));
  }

  function toggleSelCobroArchivo(
    vista: (typeof cobrosArchivoVista)[number],
  ) {
    if (vista.tipo === 'mixto') {
      const ids = vista.cobros.map((c) => c.id_factura);
      const todosMarcados = ids.every((id) => selFacturas[id]);
      setSelFacturas((prev) => {
        const next = { ...prev };
        for (const id of ids) next[id] = !todosMarcados;
        return next;
      });
      return;
    }
    toggleSelFactura(vista.cobro.id_factura);
  }

  function toggleSelComanda(idPedido: number) {
    setSelComandas((prev) => ({ ...prev, [idPedido]: !prev[idPedido] }));
  }

  function seleccionarTodasFacturasArchivo() {
    const next: Record<number, boolean> = {};
    for (const c of cobrosOrdenados) {
      next[c.id_factura] = true;
    }
    setSelFacturas(next);
  }

  function seleccionarTodasComandasArchivo() {
    const next: Record<number, boolean> = {};
    for (const p of pedidosComandaDelDia) {
      next[p.id_pedido] = true;
    }
    setSelComandas(next);
  }

  function limpiarSeleccionArchivo() {
    setSelFacturas({});
    setSelComandas({});
  }

  function toggleArchivoVerFactura(idFactura: number) {
    const abriendo = !(archivoVerFactura[idFactura] ?? false);
    setArchivoVerFactura((prev) => ({ ...prev, [idFactura]: !prev[idFactura] }));
    if (abriendo) {
      InteractionManager.runAfterInteractions(() => {
        void cargarLineasFactura(idFactura);
      });
    }
  }

  async function imprimirSeleccionArchivo() {
    const { facturas, comandas } = archivoSeleccion;
    if (facturas.length === 0 && comandas.length === 0) {
      await showNotice(
        'Sin selección',
        'Marca al menos una factura o comanda.',
        'warning',
      );
      return;
    }
    const ok = await confirmAppDialog(
      'Imprimir selección',
      [
        `Fecha: ${data?.fecha ?? ''}`,
        `Comandas: ${comandas.length}`,
        `Facturas: ${facturas.length}`,
        'Van en secuencia sin pausa entre tickets.',
      ].join('\n'),
    );
    if (!ok) return;
    setImprimiendoSeleccion(true);
    try {
      const res = await api<{
        comandas_impresas: number;
        comandas_omitidas: number;
        facturas_impresas: number;
        errores: string[];
        detenido_sin_papel: boolean;
      }>(`/pedidos/resumen-diario/imprimir-seleccion${qsFecha()}`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          id_facturas: facturas,
          id_pedidos_comanda: comandas,
        }),
      });
      if (res.detenido_sin_papel) {
        await showNotice(
          'Sin papel',
          'La impresión se detuvo: recargue el rollo en la impresora POS.',
          'error',
        );
        return;
      }
      if (
        res.facturas_impresas === 0 &&
        res.comandas_impresas === 0 &&
        (res.errores.length === 0 ||
          esErrorImpresionNoDisponible({ error: res.errores[0] }))
      ) {
        await mostrarVistaPreviaTicket(undefined, 'Impresión del día');
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
        res.facturas_impresas + res.comandas_impresas > 0
          ? 'Impresión en cola'
          : 'Sin imprimir',
        msg,
        res.facturas_impresas + res.comandas_impresas > 0 ? 'success' : 'warning',
      );
      if (res.facturas_impresas + res.comandas_impresas > 0) {
        cerrarModalArchivo();
      }
    } catch (e) {
      await manejarErrorAccion(e, 'imprimir la selección');
    } finally {
      setImprimiendoSeleccion(false);
    }
  }

  function renderCobroFactura(ped: CobroDetalle, opts?: { anidado?: boolean }) {
    const pedAbierto = pedidosAbiertos[ped.id_factura] ?? false;
    const descTotal =
      (ped.descuento_sopas ?? 0) +
      (ped.descuento_muleros ?? 0) +
      (ped.descuento_promociones ?? 0);
    return (
      <ResumenNestedAccordion
        key={ped.id_factura}
        variant="cobro"
        open={pedAbierto}
        onToggle={() => togglePedido(ped.id_factura)}
        title={
          opts?.anidado
            ? `Factura #${ped.id_factura} · ${metodoPagoLabel(ped.metodo_pago)}`
            : `Cobro · Factura #${ped.id_factura}`
        }
        subtitle={`${horaBogota(ped.emitida_en)}${
          !opts?.anidado ? ` · ${metodoPagoLabel(ped.metodo_pago)}` : ''
        }${ped.mesero ? ` · ${ped.mesero}` : ''}${ped.es_parcial ? ' · parcial' : ''}`}
        summaryRight={formatCOP(ped.total)}
        headerActions={
          <IconTooltipButton
            icon={
              reimprimiendoId === ped.id_factura
                ? 'hourglass-outline'
                : AccionIcon.reimprimirCobro
            }
            label={
              reimprimiendoId === ped.id_factura ? 'Imprimiendo…' : 'Reimprimir cobro'
            }
            variant="secondary"
            disabled={reimprimiendoId === ped.id_factura}
            onPress={() => reimprimirFactura(ped.id_pedido, ped.id_factura)}
            fixedSize
            size={22}
          />
        }
      >
        {cargandoLineas[ped.id_factura] ? (
          <ActivityIndicator style={{ marginVertical: 8 }} />
        ) : (
          (lineasPorFactura[ped.id_factura] ?? ped.detalles).map((line, idx) => (
            <View key={`${ped.id_factura}-${idx}`} style={styles.lineRow}>
              <View style={styles.lineLeft}>
                <Text style={styles.lineQty}>{line.cantidad}×</Text>
                <Text style={styles.lineName} numberOfLines={3}>
                  {line.nombre_producto}
                </Text>
              </View>
              <View style={styles.lineRight}>
                <Text style={styles.lineUnit}>
                  {formatCOP(line.precio_unitario)} c/u
                </Text>
                <Text style={styles.lineSub}>{formatCOP(line.subtotal_linea)}</Text>
              </View>
            </View>
          ))
        )}
        <View style={styles.totalsBox}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCOP(ped.subtotal)}</Text>
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
          {(ped.descuento_promociones ?? 0) > 0 && (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Desc. promociones</Text>
              <Text style={styles.totalDiscount}>
                −{formatCOP(ped.descuento_promociones ?? 0)}
              </Text>
            </View>
          )}
          {descTotal > 0 && (
            <View style={styles.totalLine}>
              <Text style={styles.totalStrong}>Total cobrado</Text>
              <Text style={styles.totalStrongVal}>{formatCOP(ped.total)}</Text>
            </View>
          )}
        </View>
      </ResumenNestedAccordion>
    );
  }

  const toolsRail = r.navSidebar && user?.rol === 'admin';

  const cajaActions = useMemo((): ActionIconItem[] => {
    return [
      {
        key: 'caja',
        icon: AccionIcon.guardar,
        label: 'Caja inicial',
        variant: 'primary',
        onPress: openCajaModal,
      },
      {
        key: 'caja-cierre',
        icon: 'lock-closed-outline',
        label: 'Caja cierre',
        variant: 'primary',
        onPress: openCajaCierreModal,
      },
      {
        key: 'entrada-caja',
        icon: 'add-circle-outline',
        label: 'Entrada caja',
        variant: 'secondary',
        onPress: () => openMovCajaModal('entrada_manual'),
      },
      {
        key: 'salida-caja',
        icon: 'remove-circle-outline',
        label: 'Salida caja',
        variant: 'secondary',
        onPress: () => openMovCajaModal('salida_manual'),
      },
      {
        key: 'consultar',
        icon: AccionIcon.consultar,
        label: 'Consultar fecha',
        variant: 'secondary',
        onPress: openConsultaModal,
      },
    ];
  }, []);

  const pruebasActions = useMemo((): ActionIconItem[] => {
    const reabiertos = data?.pedidos_reabiertos_pendientes ?? 0;
    return [
      {
        key: 'vaciar',
        icon: AdminIcon.eliminar,
        label: vaciandoResumen ? 'Vaciando…' : 'Vaciar día',
        variant: 'danger',
        disabled: vaciandoResumen || cancelandoReabiertos,
        onPress: () => void vaciarResumenDia(),
      },
      {
        key: 'cancelar-reabiertos',
        icon: cancelandoReabiertos ? 'hourglass-outline' : 'skull-outline',
        label: cancelandoReabiertos
          ? 'Cancelando…'
          : reabiertos > 0
            ? `Cancelar reabiertos (${reabiertos})`
            : 'Cancelar reabiertos',
        variant: 'danger',
        disabled: cancelandoReabiertos || vaciandoResumen,
        badge: reabiertos > 0 ? reabiertos : undefined,
        onPress: () => void cancelarPedidosReabiertos(),
      },
    ];
  }, [
    data?.pedidos_reabiertos_pendientes,
    vaciandoResumen,
    cancelandoReabiertos,
  ]);

  const impresionActions = useMemo((): ActionIconItem[] => {
    const totalFacturas = data?.total_facturas ?? 0;
    return [
      {
        key: 'elegir',
        icon: ResumenIcon.elegirImpresion,
        label: 'Elegir qué imprimir',
        variant: 'primary',
        disabled: totalFacturas === 0,
        onPress: abrirModalArchivo,
      },
      {
        key: 'completo',
        icon: imprimiendoCompleto ? 'hourglass-outline' : ResumenIcon.imprimirTodas,
        label: imprimiendoCompleto ? 'Imprimiendo…' : 'Imprimir todas',
        variant: 'secondary',
        disabled: imprimiendoCompleto || totalFacturas === 0,
        onPress: imprimirDiaCompleto,
      },
      {
        key: 'totales',
        icon: imprimiendoTotal ? 'hourglass-outline' : ResumenIcon.totalesCaja,
        label: imprimiendoTotal ? 'Imprimiendo…' : 'Solo totales caja',
        variant: 'secondary',
        disabled: imprimiendoTotal,
        onPress: imprimirTotalCierre,
      },
    ];
  }, [data?.total_facturas, imprimiendoCompleto, imprimiendoTotal]);

  useResumenDiarioToolsRail(
    toolsRail && !!data,
    {
      cajaActions,
      impresionActions,
      pruebasActions,
      modoPruebasHabilitado: modoPruebas.habilitado,
      minutosModoPruebas: modoPruebas.minutosRestantes,
      onAbrirModoPruebas: () => {
        setPasswordModoPruebas('');
        setModalModoPruebas(true);
      },
      onDesactivarModoPruebas: () => void modoPruebas.desactivar(),
      filtroNumPedido,
      onFiltroNumPedidoChange: setFiltroNumPedido,
      filtroPedidoDigits,
      pedidoGrupoAccion,
      pedidosCoinciden: pedidosGrupoFiltrados.length,
      reimprimiendoComandaId,
      reimprimiendoPedidoId,
      reabririendoPedidoId,
      onReimprimirComanda: reimprimirComanda,
      onReimprimirPedidoTotal: reimprimirPedidoTotal,
      onReabrirCobro: abrirModalReabrirCobro,
    },
    [
      filtroNumPedido,
      filtroPedidoDigits,
      pedidoGrupoAccion?.id_pedido,
      pedidoGrupoAccion?.pedido_estado,
      pedidoGrupoAccion?.total,
      pedidosGrupoFiltrados.length,
      reimprimiendoComandaId,
      reimprimiendoPedidoId,
      reabririendoPedidoId,
      vaciandoResumen,
      cancelandoReabiertos,
      imprimiendoCompleto,
      imprimiendoTotal,
      data?.total_facturas ?? 0,
      data?.pedidos_reabiertos_pendientes ?? 0,
      modoPruebas.habilitado,
      modoPruebas.minutosRestantes,
    ],
  );

  const mesasDetalleFiltradas = useMemo(
    () =>
      (data?.mesas ?? []).filter((mesa) => {
        if (!filtroPedidoDigits) return true;
        const grupos = pedidosGrupoPorMesa.get(mesa.mesa_numero) ?? [];
        return grupos.some((g) =>
          pedidoCoincideFiltro(g.id_pedido, filtroPedidoDigits),
        );
      }),
    [data?.mesas, filtroPedidoDigits, pedidosGrupoPorMesa],
  );

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
    return <ScreenLoading />;
  }

  const mensajeCobroPendiente =
    pendientesCobro != null ? mensajePendientesCobro(pendientesCobro) : '';

  const platosCategoria = data.platos_por_categoria ?? [];
  const platosVisibles = platosVerTodos
    ? platosCategoria
    : platosCategoria.slice(0, LISTA_VENTAS_PREVIEW);
  const platosOcultos = Math.max(0, platosCategoria.length - LISTA_VENTAS_PREVIEW);

  const itemsMenu = data.items_menu ?? [];
  const itemsVisibles = itemsVerTodos
    ? itemsMenu
    : itemsMenu.slice(0, LISTA_VENTAS_PREVIEW);
  const itemsOcultos = Math.max(0, itemsMenu.length - LISTA_VENTAS_PREVIEW);

  function renderMesaDetalle(mesa: Resumen['mesas'][number]) {
    const grupos = (pedidosGrupoPorMesa.get(mesa.mesa_numero) ?? []).filter(
      (g) => pedidoCoincideFiltro(g.id_pedido, filtroPedidoDigits),
    );
    const mesaAbierta = mesasAbiertas[mesa.mesa_numero] ?? false;
    return (
      <ResumenNestedAccordion
        key={mesa.mesa_numero}
        variant="mesa"
        open={mesaAbierta}
        onToggle={() => toggleMesa(mesa.mesa_numero)}
        title={tituloLugarMesa(mesa.mesa_numero)}
        subtitle={`${mesa.cobros_atendidos ?? mesa.pedidos_atendidos} cobro${
          (mesa.cobros_atendidos ?? mesa.pedidos_atendidos) === 1 ? '' : 's'
        } · facturas del día`}
        summaryRight={formatCOP(mesa.total_facturado)}
      >
        {grupos.map((grupo) => {
          const grupoAbierto = gruposPedidoAbiertos[grupo.id_pedido] ?? false;
          const pedidoPagado = grupo.pedido_estado === 'facturado';
          const cobrosVista = agruparCobrosVista(grupo.facturas);
          return (
            <ResumenNestedAccordion
              key={grupo.id_pedido}
              variant="pedido"
              open={grupoAbierto}
              onToggle={() => toggleGrupoPedido(grupo.id_pedido)}
              title={`Pedido #${grupo.id_pedido}`}
              subtitle={`${cobrosVista.length} cobro${
                cobrosVista.length === 1 ? '' : 's'
              }${pedidoPagado ? ' · pagado' : ''}`}
              summaryRight={formatCOP(grupo.total)}
            >
              {cobrosVista.map((vista) => {
                if (vista.tipo === 'simple') {
                  return renderCobroFactura(vista.cobro);
                }
                const mixtoAbierto = mixtosAbiertos[vista.key] ?? false;
                const totalMixto = vista.cobros.reduce((s, c) => s + c.total, 0);
                const primera = vista.cobros[0];
                const reparto = cobrosResumenMixto(vista.cobros)
                  .map(
                    (p) =>
                      `${metodoPagoLabel(p.metodo_pago)} ${formatCOP(p.total)}`,
                  )
                  .join(' + ');
                return (
                  <ResumenNestedAccordion
                    key={vista.key}
                    variant="cobro"
                    open={mixtoAbierto}
                    onToggle={() => toggleMixto(vista.key)}
                    title="Cobro · Pago mixto"
                    subtitle={`${horaBogota(primera.emitida_en)} · ${reparto}${
                      primera.mesero ? ` · ${primera.mesero}` : ''
                    }`}
                    summaryRight={formatCOP(totalMixto)}
                  >
                    {vista.cobros.map((ped) =>
                      renderCobroFactura(ped, { anidado: true }),
                    )}
                  </ResumenNestedAccordion>
                );
              })}
            </ResumenNestedAccordion>
          );
        })}
      </ResumenNestedAccordion>
    );
  }

  const seccionTabs = [
    {
      id: 'ingresos' as const,
      label: 'Ingresos',
      summary: formatCOP(data.efectivo_esperado_en_caja ?? 0),
    },
    {
      id: 'platos' as const,
      label: 'Platos',
      summary: `${platosCategoria.length} cat.`,
    },
    {
      id: 'items' as const,
      label: 'Ítems',
      summary: `${itemsMenu.length} prod.`,
    },
    {
      id: 'impresion' as const,
      label: 'Impresión',
      summary: `${data.total_facturas} fact.`,
    },
    {
      id: 'detalle' as const,
      label: 'Mesas',
      summary: formatCOP(data.total_facturado),
    },
  ];

  return (
    <>
      <ScreenScroll
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={
          r.navSidebar ? styles.pageWide : undefined
        }
      >
        <View style={r.navSidebar ? styles.heroBlockWide : styles.heroBlock}>
        {r.navSidebar ? (
          <>
            <View style={styles.heroTextCol}>
              <ScreenHeader
                eyebrow="Resumen diario"
                title={data.fecha}
                subtitle={`${data.total_facturas} facturas · ${data.total_mesas_atendidas} mesas atendidas · día Bogotá`}
                align="left"
                variant="plain"
              />
            </View>
            <Text style={styles.totalWide}>{formatCOP(data.total_facturado)}</Text>
          </>
        ) : (
          <ScreenHeader
            eyebrow="Resumen diario"
            title={data.fecha}
            subtitle={`${data.total_facturas} facturas · ${data.total_mesas_atendidas} mesas atendidas · día Bogotá`}
            align="center"
            variant="plain"
          >
            <Text style={styles.total}>{formatCOP(data.total_facturado)}</Text>
          </ScreenHeader>
        )}
        </View>

        {mensajeCobroPendiente ? (
          <StatusAlertBanner
            variant="cobro"
            title="Aún hay pedidos sin cobrar"
            message={mensajeCobroPendiente}
            onPress={() => router.replace('/(app)/mesas')}
          />
        ) : null}

        <ResumenQuickStats
          cajaInicial={data.monto_base_efectivo ?? 0}
          efectivoVentas={data.totales_por_metodo?.efectivo ?? 0}
          transferenciaVentas={data.totales_por_metodo?.transferencia ?? 0}
          efectivoEnCaja={data.efectivo_esperado_en_caja ?? 0}
          totalPagosMeseros={data.total_pagos_meseros ?? 0}
          totalDevolucionesEfectivo={data.total_devoluciones_efectivo ?? 0}
          totalPagosDomicilio={data.total_pagos_domicilio ?? 0}
          totalPagosMeseroExceso={data.total_pagos_mesero_exceso ?? 0}
          totalEntradasManual={data.total_entradas_manual ?? 0}
          totalSalidasManual={data.total_salidas_manual ?? 0}
        />

        {!toolsRail ? (
          <ActionIconBar
            style={[
              formStyles.screenActions,
              r.navSidebar && styles.actionsWide,
            ]}
            actions={cajaActions}
          />
        ) : null}
        {!toolsRail ? (
          <View style={styles.pruebasMobileBlock}>
            <Text style={styles.pruebasMobileTitle}>Pruebas (admin)</Text>
            {modoPruebas.habilitado ? (
              <>
                <Text style={styles.pruebasMobileHint}>
                  Modo activo · {modoPruebas.minutosRestantes} min restantes
                </Text>
                <ActionIconBar style={formStyles.screenActions} actions={pruebasActions} />
                <Pressable onPress={() => void modoPruebas.desactivar()} hitSlop={8}>
                  <Text style={styles.linkAction}>Bloquear acciones de prueba</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.pruebasMobileHint}>
                  Vaciar día y cancelar reabiertos requieren contraseña admin.
                </Text>
                <Pressable
                  style={styles.sectionLinkBtn}
                  onPress={() => {
                    setPasswordModoPruebas('');
                    setModalModoPruebas(true);
                  }}
                >
                  <Text style={styles.linkAction}>Habilitar modo pruebas</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : null}

        <ResumenSeccionNav
          tabs={seccionTabs}
          active={seccionActiva}
          onChange={cambiarSeccion}
        />

        {seccionActiva === 'ingresos' ? (
        <ResumenSeccionPanel
          title="Ingresos por tipo de pago"
          subtitle="Caja inicial, efectivo, transferencia y cuadre"
          summaryRight={formatCOP(data.efectivo_esperado_en_caja ?? 0)}
        >
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
          {(data.total_pagos_meseros ?? 0) > 0 ? (
            <>
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>Pagos meseros (turno)</Text>
                <Text style={[styles.payValue, styles.payEgreso]}>
                  −{formatCOP(data.total_pagos_meseros ?? 0)}
                </Text>
              </View>
              {(data.pagos_meseros?.length ?? 0) > 0 ? (
                <View style={styles.pagosMeserosList}>
                  {data.pagos_meseros!.map((p) => (
                    <View key={p.id_registro} style={styles.pagoMeseroRow}>
                      <Text style={styles.pagoMeseroNombre} numberOfLines={1}>
                        {p.mesero}
                      </Text>
                      <Text style={styles.pagoMeseroMonto}>
                        {formatCOP(p.monto)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
          {(data.total_entradas_manual ?? 0) > 0 ? (
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Entradas de caja</Text>
              <Text style={[styles.payValue, styles.payIngreso]}>
                +{formatCOP(data.total_entradas_manual ?? 0)}
              </Text>
            </View>
          ) : null}
          {(data.total_salidas_manual ?? 0) > 0 ? (
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Salidas de caja</Text>
              <Text style={[styles.payValue, styles.payEgreso]}>
                −{formatCOP(data.total_salidas_manual ?? 0)}
              </Text>
            </View>
          ) : null}
          {(data.total_pagos_domicilio ?? 0) > 0 ? (
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Pagos domiciliario</Text>
              <Text style={[styles.payValue, styles.payEgreso]}>
                −{formatCOP(data.total_pagos_domicilio ?? 0)}
              </Text>
            </View>
          ) : null}
          {(data.total_pagos_mesero_exceso ?? 0) > 0 ? (
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Pagos mesero (exceso transfer.)</Text>
              <Text style={[styles.payValue, styles.payEgreso]}>
                −{formatCOP(data.total_pagos_mesero_exceso ?? 0)}
              </Text>
            </View>
          ) : null}
          {(data.total_devoluciones_efectivo ?? 0) > 0 ? (
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Devoluciones en efectivo</Text>
              <Text style={[styles.payValue, styles.payEgreso]}>
                −{formatCOP(data.total_devoluciones_efectivo ?? 0)}
              </Text>
            </View>
          ) : null}
          {(data.movimientos_caja?.length ?? 0) > 0 ? (
            <View style={styles.pagosMeserosList}>
              {data.movimientos_caja!.map((m) => {
                const esManual =
                  m.tipo === 'entrada_manual' || m.tipo === 'salida_manual';
                const signo =
                  m.tipo === 'entrada_manual'
                    ? '+'
                    : m.tipo === 'pago_domicilio' ||
                        m.tipo === 'pago_mesero' ||
                        m.tipo === 'salida_manual' ||
                        m.metodo_devolucion === 'efectivo'
                      ? '−'
                      : '';
                return (
                  <View key={m.id_movimiento} style={styles.movCajaRow}>
                    <View style={styles.movCajaInfo}>
                      <Text style={styles.movCajaTipo} numberOfLines={1}>
                        {etiquetaTipoMovimientoCaja(m.tipo)}
                      </Text>
                      <Text style={styles.pagoMeseroNombre} numberOfLines={2}>
                        {descripcionMovimientoCaja(m)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.pagoMeseroMonto,
                        m.tipo === 'entrada_manual' && styles.payIngreso,
                        (m.tipo === 'salida_manual' ||
                          m.tipo === 'pago_domicilio' ||
                          m.tipo === 'pago_mesero' ||
                          m.metodo_devolucion === 'efectivo') &&
                          styles.payEgreso,
                      ]}
                    >
                      {signo}
                      {formatCOP(m.monto)}
                    </Text>
                    {esManual ? (
                      <View style={styles.movCajaAcciones}>
                        <Pressable
                          style={styles.movCajaIconBtn}
                          onPress={() =>
                            void reimprimirMovimientoCaja(
                              m.id_movimiento,
                              m.tipo as 'entrada_manual' | 'salida_manual',
                            )
                          }
                          disabled={imprimiendoMovCajaId === m.id_movimiento}
                          hitSlop={8}
                          accessibilityLabel="Imprimir comprobante"
                        >
                          <Ionicons
                            name={
                              imprimiendoMovCajaId === m.id_movimiento
                                ? 'hourglass-outline'
                                : ResumenIcon.imprimirTodas
                            }
                            size={18}
                            color={colors.primary}
                          />
                        </Pressable>
                        <Pressable
                          style={styles.movCajaIconBtn}
                          onPress={() => void eliminarMovimientoCaja(m.id_movimiento)}
                          hitSlop={8}
                          accessibilityLabel="Eliminar movimiento"
                        >
                          <Ionicons
                            name={AdminIcon.eliminar}
                            size={18}
                            color={colors.dangerText}
                          />
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.payRow}>
            <Text style={styles.payLabelStrong}>Total entradas</Text>
            <Text style={[styles.payValue, styles.payIngreso]}>
              {formatCOP(data.subtotal_entradas_caja ?? 0)}
            </Text>
          </View>
          <Text style={styles.helpInline}>
            Caja inicial + ventas en efectivo + entradas manuales
          </Text>
          <View style={styles.payRow}>
            <Text style={styles.payLabelStrong}>Total salidas</Text>
            <Text style={[styles.payValue, styles.payEgreso]}>
              −{formatCOP(data.subtotal_salidas_caja ?? 0)}
            </Text>
          </View>
          <Text style={styles.helpInline}>
            Pagos a meseros + salidas manuales + domicilios + mesero (exceso) + devoluciones en efectivo
          </Text>
          <View style={styles.divider} />
          <View style={styles.payRow}>
            <Text style={styles.payStrong}>Efectivo esperado en caja</Text>
            <Text style={styles.payStrongVal}>
              {formatCOP(data.efectivo_esperado_en_caja ?? 0)}
            </Text>
          </View>
          {data.monto_base_cierre_efectivo != null ? (
            <>
              <View style={styles.payRow}>
                <Text style={styles.payLabelStrong}>Base de cierre</Text>
                <Text style={styles.payStrongVal}>
                  {formatCOP(data.monto_base_cierre_efectivo)}
                </Text>
              </View>
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>Diferencia (arqueo)</Text>
                <Text
                  style={[
                    styles.payValue,
                    data.monto_base_cierre_efectivo -
                      (data.efectivo_esperado_en_caja ?? 0) !==
                    0
                      ? styles.payEgreso
                      : styles.payIngreso,
                  ]}
                >
                  {formatCOP(
                    data.monto_base_cierre_efectivo -
                      (data.efectivo_esperado_en_caja ?? 0),
                  )}
                </Text>
              </View>
            </>
          ) : null}
          <Text style={styles.helpSmall}>
            Total entradas − total salidas. Estimación para cuadrar el efectivo
            físico; no bloquea ventas.
          </Text>
        </ResumenSeccionPanel>
        ) : null}

        {seccionActiva === 'platos' ? (
        <ResumenSeccionPanel
          title="Platos por categoría"
          subtitle={
            (data.platos_por_categoria?.length ?? 0) === 0
              ? 'Sin platos facturados en esta fecha'
              : `${data.platos_por_categoria!.length} categoría${data.platos_por_categoria!.length === 1 ? '' : 's'}`
          }
        >
          <Text style={styles.help}>
            Platos principales facturados, por categoría. Subtotales brutos (antes de
            descuentos del día).
          </Text>
          {(data.platos_por_categoria?.length ?? 0) === 0 ? (
            <Text style={styles.empty}>Sin platos facturados en esta fecha.</Text>
          ) : (
            <>
              <FlatList
                data={platosVisibles}
                keyExtractor={(row) => row.categoria_nombre}
                scrollEnabled={false}
                ListHeaderComponent={
                  <View style={styles.ventaHeadRow}>
                    <Text style={[styles.ventaHeadCell, styles.ventaColNombre]}>
                      Categoría
                    </Text>
                    <Text style={[styles.ventaHeadCell, styles.ventaColCant]}>
                      Cant.
                    </Text>
                    <Text style={[styles.ventaHeadCell, styles.ventaColSub]}>
                      Subtotal
                    </Text>
                  </View>
                }
                renderItem={({ item: row }) => (
                  <View style={styles.ventaRow}>
                    <Text
                      style={[styles.ventaCell, styles.ventaColNombre]}
                      numberOfLines={2}
                    >
                      {row.categoria_nombre}
                    </Text>
                    <Text style={[styles.ventaCell, styles.ventaColCant]}>
                      {row.cantidad}
                    </Text>
                    <Text style={[styles.ventaCell, styles.ventaColSub]}>
                      {formatCOP(row.subtotal)}
                    </Text>
                  </View>
                )}
              />
              {platosOcultos > 0 ? (
                <Pressable
                  style={styles.verMasBtn}
                  onPress={() => setPlatosVerTodos((v) => !v)}
                  hitSlop={8}
                >
                  <Text style={styles.linkAction}>
                    {platosVerTodos ? 'Ver menos' : `Ver ${platosOcultos} más`}
                  </Text>
                </Pressable>
              ) : null}
            </>
          )}
        </ResumenSeccionPanel>
        ) : null}

        {seccionActiva === 'items' ? (
        <ResumenSeccionPanel
          title="Ítems del menú"
          subtitle={
            (data.items_menu?.length ?? 0) === 0
              ? 'Sin ítems facturados en esta fecha'
              : `${data.items_menu!.length} producto${data.items_menu!.length === 1 ? '' : 's'}`
          }
        >
          <Text style={styles.help}>
            Todo lo cobrado en facturas, por producto. Subtotales brutos (antes de
            descuentos del día).
          </Text>
          {(data.items_menu?.length ?? 0) === 0 ? (
            <Text style={styles.empty}>Sin ítems facturados en esta fecha.</Text>
          ) : (
            <>
              <FlatList
                data={itemsVisibles}
                keyExtractor={(row) => String(row.id_producto)}
                scrollEnabled={false}
                ListHeaderComponent={
                  <View style={styles.ventaHeadRow}>
                    <Text style={[styles.ventaHeadCell, styles.ventaColNombre]}>
                      Producto
                    </Text>
                    <Text style={[styles.ventaHeadCell, styles.ventaColCant]}>
                      Cant.
                    </Text>
                    <Text style={[styles.ventaHeadCell, styles.ventaColSub]}>
                      Subtotal
                    </Text>
                  </View>
                }
                renderItem={({ item: row }) => (
                  <View style={styles.ventaRow}>
                    <View style={styles.ventaColNombre}>
                      <Text style={styles.ventaCell} numberOfLines={2}>
                        {row.nombre_producto}
                      </Text>
                      <Text style={styles.ventaMeta}>{row.categoria_nombre}</Text>
                    </View>
                    <Text style={[styles.ventaCell, styles.ventaColCant]}>
                      {row.cantidad}
                    </Text>
                    <Text style={[styles.ventaCell, styles.ventaColSub]}>
                      {formatCOP(row.subtotal)}
                    </Text>
                  </View>
                )}
              />
              {itemsOcultos > 0 ? (
                <Pressable
                  style={styles.verMasBtn}
                  onPress={() => setItemsVerTodos((v) => !v)}
                  hitSlop={8}
                >
                  <Text style={styles.linkAction}>
                    {itemsVerTodos ? 'Ver menos' : `Ver ${itemsOcultos} más`}
                  </Text>
                </Pressable>
              ) : null}
              {(data.total_descuentos_dia ?? 0) > 0 && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.ventaResumenRow}>
                    <Text style={styles.ventaResumenLabel}>
                      Subtotal ítems (bruto)
                    </Text>
                    <Text style={styles.ventaResumenVal}>
                      {formatCOP(data.subtotal_ventas_bruto ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.ventaResumenRow}>
                    <Text style={styles.ventaResumenLabel}>
                      Descuentos del día
                    </Text>
                    <Text style={styles.ventaResumenDiscount}>
                      −{formatCOP(data.total_descuentos_dia ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.ventaResumenRow}>
                    <Text style={styles.ventaResumenStrong}>Total facturado</Text>
                    <Text style={styles.ventaResumenStrongVal}>
                      {formatCOP(data.total_facturado)}
                    </Text>
                  </View>
                </>
              )}
            </>
          )}
        </ResumenSeccionPanel>
        ) : null}

        {seccionActiva === 'impresion' ? (
        <ResumenSeccionPanel
          title="Impresión de cierre"
          subtitle={`${data.total_facturas} factura${data.total_facturas === 1 ? '' : 's'} · imprimir archivo del día`}
        >
          <Text style={styles.help}>
            {toolsRail
              ? 'Usa la barra de herramientas a la derecha para imprimir el archivo del día.'
              : 'Imprime todo el día de una vez o elige facturas y comandas concretas. Requiere API local con impresora POS. Totales en zona Bogotá.'}
          </Text>
          {!toolsRail ? (
            <ActionIconBar actions={impresionActions} />
          ) : null}
        </ResumenSeccionPanel>
        ) : null}

        {seccionActiva === 'detalle' ? (
        <ResumenSeccionPanel
          title="Detalle por mesa y pedido"
          subtitle={
            data.mesas.length === 0
              ? 'Sin pedidos facturados en esta fecha'
              : `${data.mesas.length} mesa${data.mesas.length === 1 ? '' : 's'} · ${data.total_facturas} cobro${data.total_facturas === 1 ? '' : 's'}`
          }
          summaryRight={formatCOP(data.total_facturado)}
          toolbar={
            <>
              <View style={styles.sectionActionsCentered}>
                <Pressable
                  style={styles.sectionLinkBtn}
                  onPress={expandirTodasLasMesas}
                  hitSlop={8}
                >
                  <Text style={styles.linkAction}>Expandir mesas</Text>
                </Pressable>
                <Pressable
                  style={styles.sectionLinkBtn}
                  onPress={contraerTodasLasMesas}
                  hitSlop={8}
                >
                  <Text style={styles.linkAction}>Contraer mesas</Text>
                </Pressable>
              </View>
              {!toolsRail ? (
                <View style={styles.pedidoFiltroBlock}>
                  <Text style={formStyles.label}>Buscar por # de pedido</Text>
                  <TextInput
                    style={formStyles.input}
                    placeholder="Ej. 42"
                    keyboardType="number-pad"
                    value={filtroNumPedido}
                    onChangeText={setFiltroNumPedido}
                  />
                  {filtroPedidoDigits && !pedidoGrupoAccion ? (
                    <Text style={styles.pedidoFiltroHint}>
                      {pedidosGrupoFiltrados.length === 0
                        ? 'Ningún pedido coincide con ese número.'
                        : `${pedidosGrupoFiltrados.length} pedidos coinciden — escribe el número completo.`}
                    </Text>
                  ) : null}
                  {pedidoGrupoAccion ? (
                    <ResumenPedidoAccionesBar
                      grupo={pedidoGrupoAccion}
                      reabririendoPedidoId={reabririendoPedidoId}
                      reimprimiendoComandaId={reimprimiendoComandaId}
                      reimprimiendoPedidoId={reimprimiendoPedidoId}
                      onReabrir={abrirModalReabrirCobro}
                      onReimprimirComanda={reimprimirComanda}
                      onReimprimirTotal={reimprimirPedidoTotal}
                    />
                  ) : null}
                </View>
              ) : null}
            </>
          }
        >
          <Text style={styles.help}>
            {toolsRail
              ? 'Toca una mesa para ver pedidos y cobros. Busca y reimprime desde la barra derecha.'
              : 'Toca una mesa para ver pedidos; expande cada cobro para ver ítems. Busca un # arriba para acciones del pedido.'}
          </Text>
          {data.mesas.length === 0 && (
            <Text style={styles.empty}>No hay pedidos facturados en esta fecha.</Text>
          )}
          {mesasDetalleFiltradas.length > 0 ? (
            <FlatList
              data={mesasDetalleFiltradas}
              keyExtractor={(mesa) => String(mesa.mesa_numero)}
              scrollEnabled={false}
              renderItem={({ item: mesa }) => renderMesaDetalle(mesa)}
            />
          ) : null}
        </ResumenSeccionPanel>
        ) : null}
      </ScreenScroll>

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
        visible={modalCajaCierre}
        title="Caja de cierre (efectivo)"
        onClose={closeCajaCierreModal}
      >
        <Text style={formStyles.help}>
          Efectivo contado al cerrar el día ({data.fecha}). Al guardar se imprime
          un comprobante con la base de cierre, el efectivo esperado y la diferencia.
        </Text>
        <Text style={formStyles.label}>Efectivo esperado</Text>
        <Text style={[formStyles.help, { marginBottom: 8 }]}>
          {formatCOP(data.efectivo_esperado_en_caja ?? 0)}
        </Text>
        <Text style={formStyles.label}>Efectivo contado</Text>
        <MoneyTextInput
          style={[formStyles.input, moneyField]}
          placeholderAmount={data.efectivo_esperado_en_caja ?? 0}
          digits={montoBaseCierreDigits}
          onChangeDigits={setMontoBaseCierreDigits}
        />
        <ActionIconBar
          style={formStyles.modalActionBar}
          actions={[
            {
              key: 'cancel',
              icon: AdminIcon.cancelar,
              label: 'Cancelar',
              variant: 'secondary',
              disabled: savingCajaCierre,
              onPress: closeCajaCierreModal,
            },
            {
              key: 'guardar',
              icon: savingCajaCierre ? 'hourglass-outline' : AccionIcon.guardar,
              label: savingCajaCierre ? 'Guardando…' : 'Guardar cierre',
              variant: 'primary',
              disabled: savingCajaCierre,
              onPress: guardarCajaCierre,
            },
          ]}
        />
      </FormModal>

      <FormModal
        visible={modalMovCaja}
        title={
          tipoMovCaja === 'entrada_manual' ? 'Entrada de caja' : 'Salida de caja'
        }
        onClose={closeMovCajaModal}
      >
        <Text style={formStyles.help}>
          {tipoMovCaja === 'entrada_manual'
            ? 'Registra dinero que entra a la caja (sencillos, ajustes, etc.).'
            : 'Registra dinero que sale de la caja (materiales, compras, etc.).'}
        </Text>
        <Text style={formStyles.label}>Monto</Text>
        <MoneyTextInput
          style={[formStyles.input, moneyField]}
          placeholderAmount={50000}
          digits={montoMovCajaDigits}
          onChangeDigits={setMontoMovCajaDigits}
        />
        <Text style={formStyles.label}>Motivo</Text>
        <TextInput
          style={[formStyles.input, formStyles.inputMultiline]}
          placeholder={
            tipoMovCaja === 'entrada_manual'
              ? 'Ej. cambio de billetes grandes'
              : 'Ej. compra de empaques'
          }
          value={motivoMovCaja}
          onChangeText={setMotivoMovCaja}
          multiline
          numberOfLines={2}
        />
        <ActionIconBar
          style={formStyles.modalActionBar}
          actions={[
            {
              key: 'cancel',
              icon: AdminIcon.cancelar,
              label: 'Cancelar',
              variant: 'secondary',
              disabled: savingMovCaja,
              onPress: closeMovCajaModal,
            },
            {
              key: 'guardar',
              icon: savingMovCaja ? 'hourglass-outline' : AccionIcon.guardar,
              label: savingMovCaja ? 'Guardando…' : 'Registrar',
              variant: 'primary',
              disabled: savingMovCaja,
              onPress: () => void guardarMovimientoCaja(),
            },
          ]}
        />
      </FormModal>

      <FormModal
        visible={modalModoPruebas}
        title="Modo pruebas (admin)"
        onClose={() => {
          if (modoPruebas.verificando) return;
          setModalModoPruebas(false);
          setPasswordModoPruebas('');
        }}
      >
        <Text style={formStyles.help}>
          Confirma tu contraseña de administrador para habilitar «Vaciar día» y
          «Cancelar reabiertos» durante 2 horas. Solo entorno de pruebas.
        </Text>
        <Text style={formStyles.label}>Contraseña</Text>
        <TextInput
          style={formStyles.input}
          placeholder="Contraseña admin"
          value={passwordModoPruebas}
          onChangeText={setPasswordModoPruebas}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <ActionIconBar
          style={formStyles.modalActionBar}
          actions={[
            {
              key: 'cancel',
              icon: AdminIcon.cancelar,
              label: 'Cancelar',
              variant: 'secondary',
              disabled: modoPruebas.verificando,
              onPress: () => {
                setModalModoPruebas(false);
                setPasswordModoPruebas('');
              },
            },
            {
              key: 'ok',
              icon: modoPruebas.verificando ? 'hourglass-outline' : 'settings-outline',
              label: modoPruebas.verificando ? 'Verificando…' : 'Habilitar',
              variant: 'primary',
              disabled: modoPruebas.verificando || !passwordModoPruebas.trim(),
              onPress: () =>
                void (async () => {
                  const ok = await modoPruebas.activarConPassword(passwordModoPruebas);
                  if (!ok) return;
                  setModalModoPruebas(false);
                  setPasswordModoPruebas('');
                  await showNotice(
                    'Modo pruebas activo',
                    'Puedes usar vaciar día y cancelar reabiertos durante 2 horas.',
                    'success',
                  );
                })(),
            },
          ]}
        />
      </FormModal>

      <FormModal
        visible={modalReabrirPedidoId != null}
        title={`Reabrir cobro · pedido #${modalReabrirPedidoId ?? ''}`}
        onClose={cerrarModalReabrirCobro}
      >
        <Text style={formStyles.help}>
          Se eliminarán las facturas de este pedido, los movimientos de caja
          ligados (devoluciones, domicilio, mesero) y la mesa quedará ocupada
          para editar y volver a cobrar. No afecta otros pedidos del día.
        </Text>
        <Text style={formStyles.label}>Motivo</Text>
        <TextInput
          style={[formStyles.input, formStyles.inputMultiline]}
          placeholder="Ej. cobró transferencia en lugar de efectivo"
          value={motivoReabrir}
          onChangeText={setMotivoReabrir}
          multiline
          numberOfLines={3}
        />
        <ActionIconBar
          style={formStyles.modalActionBar}
          actions={[
            {
              key: 'cancel',
              icon: AdminIcon.cancelar,
              label: 'Cancelar',
              variant: 'secondary',
              disabled: reabririendoPedidoId != null,
              onPress: cerrarModalReabrirCobro,
            },
            {
              key: 'reabrir',
              icon:
                reabririendoPedidoId != null ? 'hourglass-outline' : AdminIcon.confirmar,
              label: reabririendoPedidoId != null ? 'Reabriendo…' : 'Confirmar REABRIR',
              variant: 'danger',
              disabled: reabririendoPedidoId != null,
              onPress: () => void ejecutarReabrirCobro(),
            },
          ]}
        />
      </FormModal>

      <FormModal
        visible={modalConsulta}
        title="Consultar por fecha"
        onClose={closeConsultaModal}
      >
        <Text style={formStyles.help}>
          Deja vacío para ver el resumen de hoy (día calendario Bogotá).
        </Text>
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

      <FormModal
        visible={modalArchivo}
        title={`Archivo del día · ${data.fecha}`}
        onClose={cerrarModalArchivo}
        scroll
        cardStyle={styles.modalArchivoCard}
        header={
          <>
            <Text style={formStyles.help}>
              Marca lo que quieras imprimir. En facturas, toca la fila para ver ítems.
            </Text>
            <Text style={formStyles.label}>Filtrar por # de pedido</Text>
            <TextInput
              style={[formStyles.input, styles.archivoFiltroInput]}
              placeholder="Opcional — ej. 42"
              keyboardType="number-pad"
              value={filtroNumPedido}
              onChangeText={setFiltroNumPedido}
            />
            <View style={styles.archivoTabs}>
              <Pressable
                style={[
                  styles.archivoTab,
                  archivoTab === 'comandas' ? styles.archivoTabActive : null,
                ]}
                onPress={() => setArchivoTab('comandas')}
              >
                <Text
                  style={[
                    styles.archivoTabText,
                    archivoTab === 'comandas' ? styles.archivoTabTextActive : null,
                  ]}
                >
                  Comandas ({pedidosComandaDelDia.length})
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.archivoTab,
                  archivoTab === 'facturas' ? styles.archivoTabActive : null,
                ]}
                onPress={() => setArchivoTab('facturas')}
              >
                <Text
                  style={[
                    styles.archivoTabText,
                    archivoTab === 'facturas' ? styles.archivoTabTextActive : null,
                  ]}
                >
                  Facturas ({cobrosArchivoVista.length})
                </Text>
              </Pressable>
            </View>
            <View style={styles.archivoToolbar}>
              {archivoTab === 'comandas' ? (
                <Pressable onPress={seleccionarTodasComandasArchivo} hitSlop={8}>
                  <Text style={styles.linkAction}>Seleccionar todas</Text>
                </Pressable>
              ) : (
                <Pressable onPress={seleccionarTodasFacturasArchivo} hitSlop={8}>
                  <Text style={styles.linkAction}>Seleccionar todas</Text>
                </Pressable>
              )}
              <Pressable onPress={limpiarSeleccionArchivo} hitSlop={8}>
                <Text style={styles.linkAction}>Limpiar</Text>
              </Pressable>
            </View>
            <Text style={styles.archivoSelCount}>
              Seleccionados: {archivoSeleccion.comandas.length} comanda
              {archivoSeleccion.comandas.length === 1 ? '' : 's'} ·{' '}
              {archivoSeleccion.facturas.length} factura
              {archivoSeleccion.facturas.length === 1 ? '' : 's'}
            </Text>
          </>
        }
        footer={
          <ActionIconBar
            style={formStyles.modalActionBar}
            actions={[
              {
                key: 'cerrar',
                icon: AdminIcon.cancelar,
                label: 'Cerrar',
                variant: 'secondary',
                disabled: imprimiendoSeleccion,
                onPress: cerrarModalArchivo,
              },
              {
                key: 'todas',
                icon: imprimiendoCompleto ? 'hourglass-outline' : ResumenIcon.imprimirTodas,
                label: imprimiendoCompleto ? 'Imprimiendo…' : 'Imprimir todas',
                variant: 'secondary',
                disabled:
                  imprimiendoCompleto ||
                  imprimiendoSeleccion ||
                  data.total_facturas === 0,
                onPress: () => {
                  cerrarModalArchivo();
                  void imprimirDiaCompleto();
                },
              },
              {
                key: 'sel',
                icon: imprimiendoSeleccion ? 'hourglass-outline' : 'print-outline',
                label: imprimiendoSeleccion ? 'Imprimiendo…' : 'Imprimir selección',
                variant: 'primary',
                disabled: imprimiendoSeleccion || archivoSeleccion.total === 0,
                onPress: () => void imprimirSeleccionArchivo(),
              },
            ]}
          />
        }
      >
        {archivoTab === 'comandas' ? (
          pedidosComandaArchivo.length === 0 ? (
            <Text style={styles.archivoEmpty}>
              {filtroPedidoDigits
                ? 'Ningún pedido coincide con ese número.'
                : 'No hay pedidos facturados en esta fecha.'}
            </Text>
          ) : (
            pedidosComandaArchivo.map((pedido) => {
              const marcado = selComandas[pedido.id_pedido] ?? false;
              return (
                <View key={`comanda-${pedido.id_pedido}`} style={styles.archivoRow}>
                  <Pressable
                    style={styles.archivoCheck}
                    onPress={() => toggleSelComanda(pedido.id_pedido)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={marcado ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={marcado ? colors.primary : colors.textMuted}
                    />
                  </Pressable>
                  <View style={styles.archivoRowBody}>
                    <Text style={styles.archivoRowTitle}>
                      Pedido #{pedido.id_pedido} · {tituloLugarMesa(pedido.mesa_numero)}
                    </Text>
                    <Text style={styles.archivoRowMeta}>
                      {pedido.num_cobros} cobro{pedido.num_cobros === 1 ? '' : 's'} en el día
                    </Text>
                  </View>
                  <View style={styles.archivoPrintActions}>
                    <Pressable
                      style={styles.archivoPrintBtn}
                      onPress={() => reimprimirComanda(pedido.id_pedido)}
                      disabled={reimprimiendoComandaId === pedido.id_pedido}
                      hitSlop={6}
                    >
                      <Ionicons
                        name={
                          reimprimiendoComandaId === pedido.id_pedido
                            ? 'hourglass-outline'
                            : AccionIcon.reimprimirComanda
                        }
                        size={20}
                        color={colors.primary}
                      />
                    </Pressable>
                    <Pressable
                      style={styles.archivoPrintBtn}
                      onPress={() => reimprimirPedidoTotal(pedido.id_pedido)}
                      disabled={reimprimiendoPedidoId === pedido.id_pedido}
                      hitSlop={6}
                    >
                      <Ionicons
                        name={
                          reimprimiendoPedidoId === pedido.id_pedido
                            ? 'hourglass-outline'
                            : AccionIcon.reimprimirTotalPedido
                        }
                        size={20}
                        color={colors.primary}
                      />
                    </Pressable>
                  </View>
                </View>
              );
            })
          )
        ) : cobrosArchivoFiltrados.length === 0 ? (
          <Text style={styles.archivoEmpty}>
            {filtroPedidoDigits
              ? 'Ninguna factura coincide con ese pedido.'
              : 'No hay facturas en esta fecha.'}
          </Text>
        ) : (
          cobrosArchivoFiltrados.map((vista) => {
            const cobro =
              vista.tipo === 'mixto'
                ? vista.cobros.reduce((a, b) =>
                    a.id_factura < b.id_factura ? a : b,
                  )
                : vista.cobro;
            const idsGrupo =
              vista.tipo === 'mixto'
                ? vista.cobros.map((c) => c.id_factura)
                : [cobro.id_factura];
            const marcado = idsGrupo.every((id) => selFacturas[id]);
            const ver = idsGrupo.some((id) => archivoVerFactura[id]);
            const lineas =
              vista.tipo === 'mixto'
                ? vista.cobros.flatMap(
                    (c) => lineasPorFactura[c.id_factura] ?? c.detalles,
                  )
                : (lineasPorFactura[cobro.id_factura] ?? cobro.detalles);
            const totalVista =
              vista.tipo === 'mixto'
                ? vista.cobros.reduce((s, c) => s + c.total, 0)
                : cobro.total;
            const metaMetodo =
              vista.tipo === 'mixto'
                ? `${metodoPagoLabel('mixto')} (${cobrosResumenMixto(vista.cobros)
                    .map(
                      (c) =>
                        `${metodoPagoLabel(c.metodo_pago)} ${formatCOP(c.total)}`,
                    )
                    .join(' + ')})`
                : metodoPagoLabel(cobro.metodo_pago);
            return (
              <View key={vista.tipo === 'mixto' ? vista.key : `f-${cobro.id_factura}`} style={styles.archivoFacturaBlock}>
                <View style={styles.archivoRow}>
                  <Pressable
                    style={styles.archivoCheck}
                    onPress={() => toggleSelCobroArchivo(vista)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={marcado ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={marcado ? colors.primary : colors.textMuted}
                    />
                  </Pressable>
                  <Pressable
                    style={styles.archivoRowBody}
                    onPress={() => {
                      for (const id of idsGrupo) toggleArchivoVerFactura(id);
                    }}
                  >
                    <Text style={styles.archivoRowTitle}>
                      {vista.tipo === 'mixto'
                        ? `Pago mixto · Pedido #${cobro.id_pedido}`
                        : `Factura #${cobro.id_factura} · Pedido #${cobro.id_pedido}`}
                    </Text>
                    <Text style={styles.archivoRowMeta} numberOfLines={3}>
                      {tituloLugarMesa(cobro.mesa_numero)} · {horaBogota(cobro.emitida_en)} ·{' '}
                      {metaMetodo} · {formatCOP(totalVista)}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.archivoPrintBtn}
                    onPress={() => reimprimirFactura(cobro.id_pedido, cobro.id_factura)}
                    disabled={reimprimiendoId === cobro.id_factura}
                    hitSlop={6}
                  >
                    <Ionicons
                      name={
                        reimprimiendoId === cobro.id_factura
                          ? 'hourglass-outline'
                          : AccionIcon.reimprimirCobro
                      }
                      size={20}
                      color={colors.primary}
                    />
                  </Pressable>
                </View>
                {ver && (
                  <View style={styles.archivoLineas}>
                    {idsGrupo.some((id) => cargandoLineas[id]) ? (
                      <ActivityIndicator style={{ marginVertical: 8 }} />
                    ) : lineas.length === 0 ? (
                      <Text style={styles.archivoEmpty}>Sin ítems en esta factura.</Text>
                    ) : (
                      lineas.map((line, idx) => (
                        <View
                          key={`archivo-${cobro.id_factura}-${idx}`}
                          style={styles.lineRow}
                        >
                          <View style={styles.lineLeft}>
                            <Text style={styles.lineQty}>{line.cantidad}×</Text>
                            <Text style={styles.lineName} numberOfLines={2}>
                              {line.nombre_producto}
                            </Text>
                          </View>
                          <Text style={styles.lineSub}>{formatCOP(line.subtotal_linea)}</Text>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
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

function createResumenDiarioStyles(c: AppColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background, padding: 16 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: c.background,
  },
  denied: { textAlign: 'center', color: c.textMuted, marginBottom: 16, fontSize: 16 },
  pageWide: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
  heroBlock: {
    marginBottom: 4,
  },
  heroBlockWide: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 8,
  },
  heroTextCol: {
    flex: 1,
    minWidth: 0,
  },
  total: { fontSize: 28, fontWeight: '700', color: c.primary, marginTop: 8 },
  totalWide: {
    marginTop: 0,
    fontSize: 32,
    textAlign: 'right',
    flexShrink: 0,
  },
  actionsWide: {
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 12,
  },
  sectionTitle: { fontWeight: '800', color: c.text, marginBottom: 10, textAlign: 'center' },
  sectionActionsCentered: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  seccionesToolbar: {
    marginBottom: 10,
    gap: 8,
    alignItems: 'center',
  },
  seccionesToolbarWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  seccionesHint: {
    fontSize: 12,
    color: c.textMuted,
    textAlign: 'center',
  },
  seccionesHintWide: {
    textAlign: 'left',
    flex: 1,
  },
  seccionesActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  verMasBtn: {
    alignSelf: 'center',
    marginTop: 8,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sectionLinkBtn: {
    minWidth: 120,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkAction: { color: c.text, fontWeight: '800', fontSize: 13, textAlign: 'center' },
  help: { color: c.textMuted, marginBottom: 10 },
  pedidoFiltroBlock: {
    marginBottom: 12,
    gap: 8,
  },
  pedidoFiltroHint: {
    fontSize: 13,
    color: c.textMuted,
    textAlign: 'center',
  },
  pruebasMobileBlock: {
    marginBottom: 12,
    gap: 8,
    alignItems: 'center',
  },
  pruebasMobileTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pruebasMobileHint: {
    fontSize: 13,
    color: c.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  archivoFiltroInput: {
    marginBottom: 8,
  },
  archivoPrintActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterRow: { marginBottom: 4 },
  dateBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: c.borderInput,
    borderRadius: 12,
    padding: 12,
    backgroundColor: c.surface,
    justifyContent: 'center',
  },
  dateBtnText: { fontSize: 16, fontWeight: '700', color: c.text, textAlign: 'center' },
  btn: {
    backgroundColor: c.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  btnText: { color: c.surface, fontWeight: '900' },
  btnDisabled: { opacity: 0.65 },
  input: {
    borderWidth: 1,
    borderColor: c.borderInput,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    backgroundColor: c.surfaceMuted,
    color: c.text,
  },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  payRowLast: { marginBottom: 4 },
  payLabel: { color: c.text, fontWeight: '600' },
  payValue: { fontWeight: '800', color: c.text },
  payEgreso: { color: c.dangerText },
  payIngreso: { color: c.successText },
  pagosMeserosList: {
    marginTop: 4,
    marginBottom: 4,
    paddingLeft: 8,
    gap: 4,
  },
  pagoMeseroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  movCajaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  movCajaInfo: {
    flex: 1,
    minWidth: 0,
  },
  movCajaTipo: {
    fontSize: 11,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  movCajaAcciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  movCajaIconBtn: {
    padding: 4,
  },
  pagoMeseroNombre: {
    flex: 1,
    fontSize: 13,
    color: c.textMuted,
  },
  pagoMeseroMonto: {
    fontSize: 13,
    fontWeight: '700',
    color: c.textMuted,
  },
  payStrong: { fontWeight: '800', color: c.primary },
  payLabelStrong: { fontWeight: '700', color: c.text },
  payStrongVal: { fontWeight: '900', color: c.primary, fontSize: 17 },
  helpInline: {
    fontSize: 11,
    color: c.textMuted,
    marginTop: -4,
    marginBottom: 6,
    lineHeight: 15,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.borderLight,
    marginVertical: 8,
  },
  helpSmall: { fontSize: 12, color: c.textMuted, marginTop: 8, lineHeight: 16 },
  ventaHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.borderLight,
    marginBottom: 4,
  },
  ventaHeadCell: {
    fontSize: 12,
    fontWeight: '800',
    color: c.textMuted,
    textTransform: 'uppercase',
  },
  ventaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.borderLight,
  },
  ventaCell: { color: c.text, fontWeight: '600' },
  ventaMeta: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  ventaColNombre: { flex: 1 },
  ventaColCant: { width: 44, textAlign: 'center', fontWeight: '800' },
  ventaColSub: { width: 96, textAlign: 'right', fontWeight: '800' },
  ventaResumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  ventaResumenLabel: { flex: 1, color: c.textMuted, fontSize: 13 },
  ventaResumenVal: { fontWeight: '700', color: c.text },
  ventaResumenDiscount: { fontWeight: '700', color: c.danger },
  ventaResumenStrong: { flex: 1, fontWeight: '800', color: c.text },
  ventaResumenStrongVal: { fontWeight: '900', color: c.primary, fontSize: 15 },
  cobroMixtoBody: {
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.borderLight,
  },
  cobroMixtoHijo: {
    marginHorizontal: 8,
    marginTop: 4,
    marginBottom: 4,
    borderColor: c.border,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: c.border,
    maxWidth: 360,
    width: '100%',
    alignSelf: 'center',
  },
  modalTitle: { fontWeight: '900', color: c.text, marginBottom: 10 },
  empty: { color: c.textMuted },
  mesaBlock: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: c.borderLight,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: c.surfaceMuted,
  },
  mesaHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: c.backgroundAlt,
    gap: 8,
  },
  mesaHeadLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  mesaHeadText: { flex: 1 },
  mesaTitle: { fontWeight: '900', color: c.text, fontSize: 16 },
  mesaSub: { color: c.textMuted, marginTop: 2, fontSize: 13 },
  mesaTotal: { fontWeight: '900', color: c.primary, fontSize: 16 },
  pedidoGrupoBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
    backgroundColor: c.surface,
  },
  pedidoGrupoHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: c.surfaceMuted,
  },
  pedidoGrupoBody: {
    paddingBottom: 8,
    backgroundColor: c.surface,
  },
  actionRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalArchivoCard: { maxWidth: 560 },
  archivoTabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  archivoTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceMuted,
    alignItems: 'center',
  },
  archivoTabActive: {
    borderColor: c.primary,
    backgroundColor: c.backgroundAlt,
  },
  archivoTabText: {
    fontWeight: '700',
    fontSize: 13,
    color: c.textMuted,
  },
  archivoTabTextActive: {
    color: c.primary,
  },
  archivoToolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    marginBottom: 6,
  },
  archivoSelCount: {
    color: c.textMuted,
    fontSize: 13,
    marginBottom: 10,
  },
  archivoEmpty: { color: c.textMuted, fontSize: 13, marginBottom: 8 },
  archivoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.borderLight,
  },
  archivoCheck: { paddingVertical: 2 },
  archivoRowBody: { flex: 1, minWidth: 0 },
  archivoRowTitle: { fontWeight: '700', color: c.text, fontSize: 13 },
  archivoRowMeta: { color: c.textMuted, fontSize: 12, marginTop: 2 },
  archivoPrintBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivoFacturaBlock: {
    borderWidth: 1,
    borderColor: c.borderLight,
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: c.surfaceMuted,
  },
  archivoLineas: {
    paddingHorizontal: 10,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.borderLight,
  },
  cobroBlock: {
    marginHorizontal: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: c.borderLight,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: c.surfaceMuted,
  },
  cobroTitle: { fontWeight: '700', color: c.text, fontSize: 13 },
  cobroTotal: { fontWeight: '800', color: c.text, fontSize: 14 },
  pedidoBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
    backgroundColor: c.surface,
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
  pedidoTitle: { fontWeight: '800', color: c.text, fontSize: 14 },
  pedidoMeta: { color: c.textMuted, marginTop: 2, fontSize: 12, lineHeight: 16 },
  pedidoTotal: { fontWeight: '900', color: c.text, fontSize: 15 },
  pedidoBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.backgroundAlt,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: 8,
  },
  lineLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  lineQty: { fontWeight: '800', color: c.textMuted, minWidth: 28 },
  lineName: { flex: 1, color: c.text, fontWeight: '600' },
  lineRight: { alignItems: 'flex-end' },
  lineUnit: { fontSize: 11, color: c.textMuted },
  lineSub: { fontWeight: '800', color: c.text, marginTop: 2 },
  totalsBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.borderLight,
    gap: 4,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { color: c.textMuted, fontWeight: '600' },
  totalValue: { fontWeight: '700', color: c.text },
  totalDiscount: { fontWeight: '700', color: c.danger },
  totalStrong: { fontWeight: '800', color: c.primary },
  totalStrongVal: { fontWeight: '900', color: c.primary },
});
}

