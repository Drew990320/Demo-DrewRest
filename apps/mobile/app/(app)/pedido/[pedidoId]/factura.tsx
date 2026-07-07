import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../../src/context/AuthContext';
import { usePermisosMesero } from '../../../../src/hooks/usePermisosMesero';
import { ActionIconBar } from '../../../../src/components/ActionIconBar';
import { CobroMontoPanel } from '../../../../src/components/CobroMontoPanel';
import {
  CobroPersonaPlanPanel,
  cobroPlanCtaEstado,
  type MetodoPagoPlan,
} from '../../../../src/components/CobroPersonaPlanPanel';
import { CtaButton } from '../../../../src/components/CtaButton';
import { IconTooltipButton } from '../../../../src/components/IconTooltipButton';
import {
  EmpaqueParaLlevarAjuste,
  reducirEmpaqueDetalle,
  type DetalleEmpaqueUi,
} from '../../../../src/components/EmpaqueParaLlevarAjuste';
import { empaqueFaltanteEnDetallePadre } from '../../../../src/lib/empaque-para-llevar';
import { MetodoPagoSelector } from '../../../../src/components/MetodoPagoSelector';
import {
  ModoDividirSelector,
  type ModoDividirCuenta,
} from '../../../../src/components/ModoDividirSelector';
import { MoneyTextInput } from '../../../../src/components/MoneyTextInput';
import { PagoExactoButton } from '../../../../src/components/PagoExactoButton';
import { PlanCobroPersonas } from '../../../../src/components/PlanCobroPersonas';
import { MixtoPagoFields } from '../../../../src/components/MixtoPagoFields';
import { TransferenciaSoloFields } from '../../../../src/components/TransferenciaSoloFields';
import { ScreenHeader } from '../../../../src/components/ScreenHeader';
import { RestaurantLogo } from '../../../../src/components/RestaurantLogo';
import { ScreenLoading } from '../../../../src/components/ScreenLoading';
import { api } from '../../../../src/lib/api';
import { AccionIcon, PedidoIcon } from '../../../../src/lib/app-icons';
import { alertarSiSinPapel } from '../../../../src/lib/alarma-impresora';
import { notificarResultadoImpresion, mensajeImpresionFallidaTrasAccion } from '../../../../src/lib/impresion-resultado';
import { showAppDialog, showNotice, confirmAppDialog } from '../../../../src/lib/app-dialog';
import {
  digitsFromMonto,
  parseCOPDigits,
  resumenMixtoUi,
  resumenTransferenciaUi,
  puedeConfirmarCobroMixto,
  puedeConfirmarCobroTransferencia,
  textoResumenCobroMixto,
  textoResumenCobroTransferencia,
  type DevolucionExcesoMetodo,
} from '../../../../src/lib/cop-input';
import { manejarErrorAccion, manejarErrorOperacion } from '../../../../src/lib/recurso-disponible';
import { mensajeErrorUsuario } from '../../../../src/lib/api-error';
import { STICKY_ACTION_BAR_HEIGHT } from '../../../../src/lib/layout-constants';
import { useAppNavLayout } from '../../../../src/hooks/useAppNavLayout';
import {
  avisarSiFaltanObligatorios,
  avisarSiMontoCOPInvalido,
} from '../../../../src/lib/form-validation';
import { calcularDescuentosPedido } from '../../../../src/lib/descuentos-pedido';
import {
  ETIQUETA_LEGACY_MULERO,
  type EtiquetaPromocionPedido,
  type ReglaPromocion,
} from '@la-reserva/shared-domain/promociones-pedido';
import {
  expandirSolicitudesConEmpaques,
  lineasDescuentoDesdeSolicitudes,
  ordenarSolicitudesCobro,
  resolverSolicitudesCobro,
  solicitudesDesdeCantidades,
  unidadesEnSolicitudes,
  type DetalleCobroCantidad,
} from '../../../../src/lib/cobro-parcial';
import { formatCOP } from '../../../../src/lib/format';
import {
  agruparLineasFacturaCobroVista,
  type LineaFacturaGrupo,
} from '../../../../src/lib/factura-lineas-group';
import {
  esNotaSaldoAbono,
  esNotaSaldoFragmentoHuerfano,
  esNotaSaldoRestantePendiente,
  montoSaldoRestantePendiente,
  notaDisplaySaldoPendiente,
  parseSaldoRestantePool,
  saldoNecesitaReconciliarAPlatos,
  NOMBRE_DISPLAY_SALDO_PENDIENTE,
} from '@la-reserva/shared-domain/saldo-restante';
import {
  agruparCobrosVista,
  cobrosResumenMixto,
} from '@la-reserva/shared-domain/factura-mixto';
import { repartirMontoEnCop } from '../../../../src/lib/repartir-monto-cop';
import {
  personasOmitidasDesdeDetalles,
  personasOmitidasDesdeCuotas,
} from '@la-reserva/shared-domain/cuota-pendiente-reparto';
import {
  asignacionCobroPersonaPlan,
  contarCobrosPlanHechos,
  resumenSaldoPlanCombinado,
  firmaCantidadesPlan,
  lineasAsignablesCobroPlan,
  personaPlanYaCobradaEnSlice,
  resolverSolicitudesDesdeCantidadesPlan,
} from '../../../../src/lib/factura-cobro-plan';
import {
  METODO_PAGO_LABEL,
  type MetodoPagoUi,
} from '../../../../src/lib/metodo-pago-ui';
import { RouteRecoveryScreen } from '../../../../src/components/RouteRecoveryScreen';
import { FacturaImpresionOpciones } from '../../../../src/components/FacturaImpresionOpciones';
import { enviarFacturaPorCorreo } from '../../../../src/lib/factura-correo';
import { useNetwork } from '../../../../src/context/NetworkContext';
import { useFormFieldStyle } from '../../../../src/hooks/useFormFieldStyle';
import { useFormStyles } from '../../../../src/lib/form-layout';
import { appShadow } from '../../../../src/lib/shadow';
import { useVisualTheme } from '../../../../src/context/VisualThemeContext';
import { useThemedStyles } from '../../../../src/hooks/useThemedStyles';
import type { AppColors } from '../../../../src/lib/theme';

type DescuentosEstimados = {
  descuento_sopas: number;
  descuento_muleros: number;
  descuento_promociones?: number;
  promociones_desglose?: { id: string; etiqueta: string; monto: number }[];
};

type ConfigDescuentos = {
  reglas_promocion: ReglaPromocion[];
  etiquetas_pedido: EtiquetaPromocionPedido[];
};

type DetalleFactura = {
  id_detalle: number;
  id_factura?: number | null;
  id_producto?: number;
  id_detalle_padre: number | null;
  subtotal_linea: number;
  precio_unitario: number;
  nombre_producto: string;
  cantidad: number;
  categoria_nombre?: string;
  id_categoria?: number;
  participa_descuento_sopas?: boolean;
  es_plato_principal?: boolean;
  es_empacable?: boolean;
  cobrado?: boolean;
  nota_cocina?: string | null;
  es_cuota_pendiente_reparto?: boolean;
  personalizaciones?: { id_opcion?: number; descripcion: string }[];
};

type PedidoFull = {
  id_pedido: number;
  id_mesa?: number;
  modo_servicio?: 'en_mesa' | 'para_llevar';
  num_comensales?: number;
  cliente_mulero?: boolean;
  etiquetas_promocion?: string[];
  detalles: DetalleFactura[];
  descuentos_estimados?: DescuentosEstimados;
  cobro_pendiente?: { items: number; subtotal: number };
  facturas?: {
    id_factura: number;
    total: number;
    es_parcial?: boolean;
    metodo_pago?: string;
    cobro_mixto_grupo?: number | null;
    persona_plan_indice?: number | null;
  }[];
  cuotas_plan_omitidas?: {
    persona_plan_indice: number;
    monto: number;
    facturas_base_plan: number;
    plan_sesion_id?: number;
  }[];
};

type MetodoPago = MetodoPagoUi;

function etiquetasActivasEnPedido(p: PedidoFull): string[] {
  const set = new Set(p.etiquetas_promocion ?? []);
  if (p.cliente_mulero) {
    set.add(ETIQUETA_LEGACY_MULERO);
  }
  return [...set];
}

function contextoDescuentosPedido(p: PedidoFull) {
  return {
    etiquetas_promocion: etiquetasActivasEnPedido(p),
    cliente_mulero: Boolean(p.cliente_mulero),
  };
}

function serialDetallesPedido(p: PedidoFull) {
  return p.detalles.map((d) => ({
    id_detalle: d.id_detalle,
    id_detalle_padre: d.id_detalle_padre ?? null,
    cobrado: Boolean(d.cobrado),
    cantidad: d.cantidad,
  }));
}

function anexarCobroTransferenciaSolo(
  body: Record<string, unknown>,
  total: number,
  transferenciaDigits: string,
  devolucionMetodo: DevolucionExcesoMetodo | null,
) {
  const tr = parseCOPDigits(transferenciaDigits);
  body.monto_transferencia = tr;
  const exceso = resumenTransferenciaUi(total, tr).exceso;
  if (exceso > 0 && devolucionMetodo) {
    body.devolucion_exceso_metodo = devolucionMetodo;
  }
}

function anexarCobroEfectivoRecibido(
  body: Record<string, unknown>,
  recibeDigits: string,
) {
  const recibido = parseCOPDigits(recibeDigits);
  if (recibido > 0) {
    body.monto_recibido_efectivo = recibido;
  }
}

/** Re-resuelve ítems pendientes desde cantidades padre (post sync con el servidor). */
function solicitudesDesdeCantidadesPedido(
  p: PedidoFull,
  cantidades: Record<number, number>,
): DetalleCobroCantidad[] {
  const serial = serialDetallesPedido(p);
  const clamped: Record<number, number> = {};
  for (const [idStr, q] of Object.entries(cantidades)) {
    const id = Number(idStr);
    if (!Number.isFinite(id) || q <= 0) continue;
    const d = p.detalles.find((x) => x.id_detalle === id);
    if (!d || d.cobrado) continue;
    const take = Math.min(q, d.cantidad);
    if (take > 0) clamped[id] = take;
  }
  if (Object.keys(clamped).length === 0) return [];
  return resolverSolicitudesDesdeCantidadesPlan(serial, clamped);
}

function solicitudesPendientesCompletasPedido(p: PedidoFull): DetalleCobroCantidad[] {
  const serial = serialDetallesPedido(p);
  const pendientes = serial.filter((d) => !d.cobrado).map((d) => d.id_detalle);
  if (pendientes.length === 0) return [];
  return ordenarSolicitudesCobro(
    serial,
    expandirSolicitudesConEmpaques(
      serial,
      resolverSolicitudesCobro({}, serial, pendientes),
    ),
  );
}

function personaPlanYaCobrada(
  p: PedidoFull,
  planIdx: number,
  base: number,
): boolean {
  return personaPlanYaCobradaEnSlice(p.facturas ?? [], base, planIdx);
}

function solicitudesCobroParaPedido(
  p: PedidoFull,
  opts: {
    dividirCuenta: boolean;
    modoDividir: ModoDividirCuenta;
    cantidadesCobro: Record<number, number>;
  },
): DetalleCobroCantidad[] {
  const serial = serialDetallesPedido(p);
  const pendientes = serial.filter((d) => !d.cobrado).map((d) => d.id_detalle);
  if (pendientes.length === 0) return [];
  if (!opts.dividirCuenta) {
    return resolverSolicitudesCobro({}, serial, pendientes);
  }
  if (opts.modoDividir === 'personas') return [];
  const cantidades =
    opts.modoDividir === 'platos' || opts.modoDividir === 'combinado'
      ? opts.cantidadesCobro
      : {};
  const base = solicitudesDesdeCantidades(cantidades);
  if (base.length === 0) return [];
  try {
    return ordenarSolicitudesCobro(
      serial,
      expandirSolicitudesConEmpaques(serial, base),
    );
  } catch {
    return [];
  }
}

export default function FacturaScreen() {
  const { colors } = useVisualTheme();
  const styles = useThemedStyles(createFacturaStyles);
  const formStyles = useFormStyles();
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const { token, user } = useAuth();
  const { permisos: permMesero } = usePermisosMesero();
  const esAdmin = user?.rol === 'admin';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const nav = useAppNavLayout();
  /** Con navbar inferior en flujo, el contenido ya termina encima de ella: bottom 0. */
  const chromeBottom = nav.bottomBar ? 0 : Math.max(insets.bottom, 10);
  const [pedido, setPedido] = useState<PedidoFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [recibeDigits, setRecibeDigits] = useState('');
  const [mixtoTransferenciaDigits, setMixtoTransferenciaDigits] = useState('');
  const [mixtoTransferenciaEstandarDigits, setMixtoTransferenciaEstandarDigits] =
    useState('');
  const [transferenciaSoloDigits, setTransferenciaSoloDigits] = useState('');
  const [devolucionExcesoMetodo, setDevolucionExcesoMetodo] =
    useState<DevolucionExcesoMetodo | null>(null);
  const [configReglas, setConfigReglas] = useState<ConfigDescuentos | null>(null);
  const [dividirCuenta, setDividirCuenta] = useState(false);
  const [modoDividir, setModoDividir] = useState<ModoDividirCuenta>('platos');
  const [cantidadesCobro, setCantidadesCobro] = useState<Record<number, number>>({});
  const [personasPlan, setPersonasPlan] = useState(2);
  const [planBaseTotal, setPlanBaseTotal] = useState(0);
  /** Cuotas fijas al iniciar el plan (modo por personas); no se recalculan tras cada cobro. */
  const [cuotasPlanPersonas, setCuotasPlanPersonas] = useState<number[]>([]);
  const [metodosPlan, setMetodosPlan] = useState<(MetodoPagoPlan | null)[]>([]);
  const [facturasBasePlan, setFacturasBasePlan] = useState(0);
  /** Aísla omisiones de repartos anteriores (timestamp de inicio de sesión). */
  const [planSesionId, setPlanSesionId] = useState(0);
  /** Ítems (+/−) del reparto combinado en curso; cambia → nueva sesión de plan. */
  const planCombinadoFirmaRef = useRef<string | null>(null);
  /** Selección congelada al iniciar reparto combinado (referencia en factura). */
  const [seleccionReferenciaCombinado, setSeleccionReferenciaCombinado] = useState<
    DetalleCobroCantidad[]
  >([]);
  const [marcandoEtiquetas, setMarcandoEtiquetas] = useState(false);
  const [precuentaConCopia, setPrecuentaConCopia] = useState(false);
  const [imprimiendoPrecuenta, setImprimiendoPrecuenta] = useState(false);
  const [imprimirFactura, setImprimirFactura] = useState(true);
  const [facturaConCopia, setFacturaConCopia] = useState(false);
  const [enviarPorCorreo, setEnviarPorCorreo] = useState(false);
  const [emailCliente, setEmailCliente] = useState('');
  const { online } = useNetwork();
  const [showCierreAnulacionModal, setShowCierreAnulacionModal] = useState(false);
  const [revertirTandaIdFactura, setRevertirTandaIdFactura] = useState<number | null>(
    null,
  );
  const [motivoRevertirTanda, setMotivoRevertirTanda] = useState('');
  const [motivoCierreAnulacion, setMotivoCierreAnulacion] = useState('');
  const moneyField = useFormFieldStyle('money');
  const scrollRef = useRef<ScrollView>(null);
  const cobroEstandarY = useRef(0);
  const cobroPlanY = useRef(0);

  const scrollToCobroMetodo = useCallback((seccion: 'estandar' | 'plan') => {
    const y = seccion === 'estandar' ? cobroEstandarY.current : cobroPlanY.current;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
  }, []);

  const loadPedido = useCallback(async () => {
    const p = await api<PedidoFull>(`/pedidos/${pedidoId}`, {
      token,
      cacheKey: `pedido_${pedidoId}`,
    });
    setPedido(p);
    return p;
  }, [token, pedidoId]);

  /** Siempre desde el servidor; obligatorio antes de cobrar (evita ids obsoletos en móvil). */
  const loadPedidoFresh = useCallback(async () => {
    const p = await api<PedidoFull>(`/pedidos/${pedidoId}`, {
      token,
      cacheKey: `pedido_${pedidoId}`,
      offlineFallback: false,
    });
    setPedido(p);
    return p;
  }, [token, pedidoId]);

  const loadConfig = useCallback(async () => {
    const cfg = await api<ConfigDescuentos>('/pedidos/config-descuentos', {
      token,
      cacheKey: 'config_descuentos',
    });
    setConfigReglas(cfg);
    return cfg;
  }, [token]);

  const load = useCallback(async () => {
    await Promise.all([loadPedido(), loadConfig()]);
  }, [loadPedido, loadConfig]);

  useEffect(() => {
    (async () => {
      try {
        await load();
        setLoadError(null);
      } catch (e) {
        setLoadError(mensajeErrorUsuario(e, 'No se pudo cargar el pedido.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const montoSaldoPendiente = useMemo(
    () =>
      montoSaldoRestantePendiente(
        (pedido?.detalles ?? []).map((d) => ({
          cobrado: d.cobrado,
          id_factura: d.id_factura,
          nota_cocina: d.nota_cocina,
          precio_unitario: d.precio_unitario,
          cantidad: d.cantidad,
        })),
      ),
    [pedido],
  );
  const modoSaldoRestante = montoSaldoPendiente > 0;

  const saldoPendienteDetalle = useMemo(
    () =>
      pedido?.detalles.find(
        (d) =>
          !d.cobrado &&
          d.id_factura == null &&
          esNotaSaldoRestantePendiente(d.nota_cocina),
      ),
    [pedido],
  );

  /** Pool del saldo combinado; `null` = sobre el total (todos los platos absorbidos). */
  const poolSaldoPendiente = useMemo(
    () => parseSaldoRestantePool(saldoPendienteDetalle?.nota_cocina),
    [saldoPendienteDetalle],
  );

  const idsPoolSaldo = useMemo(() => {
    if (!modoSaldoRestante) return null;
    if (poolSaldoPendiente == null) return null;
    return new Set(poolSaldoPendiente.map((p) => p.id_detalle));
  }, [modoSaldoRestante, poolSaldoPendiente]);

  const enRepartoPlanActivo =
    dividirCuenta &&
    (modoDividir === 'personas' || modoDividir === 'combinado');

  const saldoEsFragmento = esNotaSaldoFragmentoHuerfano(
    saldoPendienteDetalle?.nota_cocina,
  );

  /**
   * Plato absorbido por el saldo (no cobrable).
   * Misma regla personas/combinado: si el saldo aún no se repartió en platos
   * (no es fragmento), los platos reales no se cobran aparte (evita sobrecobro).
   * Tras reconciliarSaldoAPlatos quedan liberados + fragmento opcional.
   */
  const platoAbsorbidoPorSaldo = useMemo(() => {
    return (d: {
      id_detalle: number;
      nota_cocina?: string | null;
      es_cuota_pendiente_reparto?: boolean;
    }) => {
      if (!modoSaldoRestante) return false;
      if (
        esNotaSaldoRestantePendiente(d.nota_cocina) ||
        esNotaSaldoAbono(d.nota_cocina)
      ) {
        return false;
      }
      if (d.es_cuota_pendiente_reparto) return false;
      // Ya reconciliado: platos liberados se cobran por platos/combinado.
      if (saldoEsFragmento) return false;
      // Saldo “lleno” (personas o combinado): solo se cobra el saldo.
      return true;
    };
  }, [modoSaldoRestante, saldoEsFragmento]);

  const notaSaldoPendienteUi = useMemo(() => {
    if (!saldoPendienteDetalle || !pedido) return null;
    const nombres = new Map(
      pedido.detalles.map((d) => [d.id_detalle, d.nombre_producto]),
    );
    return notaDisplaySaldoPendiente(saldoPendienteDetalle.nota_cocina, nombres);
  }, [saldoPendienteDetalle, pedido]);

  const detallesPendientes = useMemo(
    () =>
      pedido?.detalles.filter((d) => {
        if (d.cobrado) return false;
        if (esNotaSaldoRestantePendiente(d.nota_cocina)) return true;
        if (esNotaSaldoAbono(d.nota_cocina)) return false;
        if (d.es_cuota_pendiente_reparto) return false;
        // Platos fuera del pool siguen cobrables junto al saldo pendiente.
        return !platoAbsorbidoPorSaldo(d);
      }) ?? [],
    [pedido, platoAbsorbidoPorSaldo],
  );

  const lineasFacturaAgrupadas = useMemo(() => {
    if (!pedido) return [];
    const padres = pedido.detalles.filter((d) => {
      if (d.id_detalle_padre != null) return false;
      if (d.es_cuota_pendiente_reparto) {
        return (
          esNotaSaldoRestantePendiente(d.nota_cocina) ||
          esNotaSaldoAbono(d.nota_cocina)
        );
      }
      return true;
    });
    return agruparLineasFacturaCobroVista(
      padres.map((d) => {
        const esSaldoPend = esNotaSaldoRestantePendiente(d.nota_cocina);
        const esAbono = esNotaSaldoAbono(d.nota_cocina);
        const nombre = esSaldoPend
          ? NOMBRE_DISPLAY_SALDO_PENDIENTE
          : esAbono
            ? 'Abono'
            : d.nombre_producto;
        // Absorbidos por saldo: referencia (no seleccionables). Resto cobrable.
        const cobradoVista =
          Boolean(d.cobrado) ||
          esAbono ||
          (!esSaldoPend && platoAbsorbidoPorSaldo(d));
        return {
          ...d,
          nombre_producto: nombre,
          cobrado: cobradoVista,
          precio_unitario: d.precio_unitario,
          subtotal_linea: d.precio_unitario * d.cantidad,
          personalizaciones: d.personalizaciones ?? [],
        };
      }),
    );
  }, [pedido, platoAbsorbidoPorSaldo]);

  const usaSelectorPlatos =
    dividirCuenta && (modoDividir === 'platos' || modoDividir === 'combinado');
  const usaPlanPersonas =
    dividirCuenta && (modoDividir === 'personas' || modoDividir === 'combinado');
  const puedeCobrar = permMesero.cobrar;
  const puedePrecuenta = permMesero.precuenta;

  /** Personas que no pagaron su cuota (0-based). */
  const personasOmitidasPlan = useMemo(() => {
    if (!pedido || !usaPlanPersonas || planSesionId <= 0) return [];
    if (pedido.cuotas_plan_omitidas?.length) {
      return personasOmitidasDesdeCuotas(
        pedido.cuotas_plan_omitidas,
        facturasBasePlan,
        planSesionId,
      );
    }
    return personasOmitidasDesdeDetalles(
      pedido.detalles,
      facturasBasePlan,
      planSesionId,
    );
  }, [pedido, usaPlanPersonas, facturasBasePlan, planSesionId]);

  const cuotasPendientesPlan = useMemo(() => {
    if (!pedido || !usaPlanPersonas || planSesionId <= 0) return [];
    const fromApi = (pedido.cuotas_plan_omitidas ?? []).filter(
      (c) =>
        c.facturas_base_plan === facturasBasePlan &&
        c.plan_sesion_id === planSesionId,
    );
    if (fromApi.length > 0) return fromApi;
    return pedido.detalles
      .filter((d) => !d.cobrado && d.es_cuota_pendiente_reparto)
      .map((d) => ({
        persona_plan_indice:
          (personasOmitidasDesdeDetalles([d], facturasBasePlan)[0] ?? 0) + 1,
        monto: d.subtotal_linea ?? d.precio_unitario * d.cantidad,
        facturas_base_plan: facturasBasePlan,
      }))
      .filter((c) => c.persona_plan_indice >= 1);
  }, [pedido, usaPlanPersonas, facturasBasePlan]);

  const detalleSerial = useMemo(
    () =>
      pedido?.detalles
        .filter((d) => {
          if (esNotaSaldoRestantePendiente(d.nota_cocina)) return true;
          if (esNotaSaldoAbono(d.nota_cocina)) return false;
          if (d.es_cuota_pendiente_reparto) return false;
          return true;
        })
        .map((d) => ({
          id_detalle: d.id_detalle,
          id_detalle_padre: d.id_detalle_padre ?? null,
          // Absorbidos por saldo: no entran en solicitudes de platos reales.
          cobrado:
            Boolean(d.cobrado) ||
            (!esNotaSaldoRestantePendiente(d.nota_cocina) &&
              platoAbsorbidoPorSaldo(d)),
          cantidad: d.cantidad,
        })) ?? [],
    [pedido, platoAbsorbidoPorSaldo],
  );

  function totalesDesdeSolicitudes(
    solicitudes: DetalleCobroCantidad[],
    pedidoRef?: PedidoFull,
  ) {
    const p = pedidoRef ?? pedido;
    if (!p || solicitudes.length === 0) {
      return { total: 0, descuentosValidos: true };
    }
    const lineas = lineasDescuentoDesdeSolicitudes(
      p.detalles.map((d) => ({
        id_detalle: d.id_detalle,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        nombre_producto: d.nombre_producto,
        categoria_nombre: d.categoria_nombre ?? '',
        id_categoria: d.id_categoria,
        participa_descuento_sopas: d.participa_descuento_sopas,
        es_plato_principal: d.es_plato_principal,
      })),
      solicitudes,
    );
    const desc = configReglas
      ? calcularDescuentosPedido(
          lineas,
          configReglas,
          contextoDescuentosPedido(p),
        )
      : (p.descuentos_estimados ?? {
          descuento_sopas: 0,
          descuento_muleros: 0,
          descuento_promociones: 0,
        });
    const sub = lineas.reduce((s, d) => s + d.subtotal_linea, 0);
    const sumaDesc = desc.descuento_promociones ?? 0;
    const total = Math.max(0, sub - sumaDesc);
    return { total, descuentosValidos: sumaDesc <= sub };
  }

  const solicitudesPendienteTotal = useMemo((): DetalleCobroCantidad[] => {
    if (!pedido) return [];
    const pendientes = detalleSerial.filter((d) => !d.cobrado).map((d) => d.id_detalle);
    if (pendientes.length === 0) return [];
    return resolverSolicitudesCobro({}, detalleSerial, pendientes);
  }, [pedido, detalleSerial]);

  const totalPendienteCompleto = useMemo(() => {
    // Saldo pendiente + platos fuera del pool (si los hay).
    return totalesDesdeSolicitudes(solicitudesPendienteTotal).total;
  }, [pedido, solicitudesPendienteTotal, configReglas]);

  const cantidadesEfectivas = useMemo(() => {
    if (!dividirCuenta) return {};
    if (modoDividir === 'platos' || modoDividir === 'combinado') {
      return cantidadesCobro;
    }
    return {};
  }, [dividirCuenta, modoDividir, cantidadesCobro]);

  /** Selección +/− en combinado (para total del reparto y cuotas). */
  const solicitudesSeleccionCombinado = useMemo((): DetalleCobroCantidad[] => {
    if (!pedido || !dividirCuenta || modoDividir !== 'combinado') return [];
    const base = solicitudesDesdeCantidades(cantidadesCobro);
    if (base.length === 0) return [];
    try {
      return ordenarSolicitudesCobro(
        detalleSerial,
        expandirSolicitudesConEmpaques(detalleSerial, base),
      );
    } catch {
      return [];
    }
  }, [pedido, dividirCuenta, modoDividir, cantidadesCobro, detalleSerial]);

  const totalSeleccionCombinado = useMemo(
    () => totalesDesdeSolicitudes(solicitudesSeleccionCombinado).total,
    // totalesDesdeSolicitudes usa pedido/config del closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [solicitudesSeleccionCombinado, pedido, configReglas],
  );

  const solicitudesCobro = useMemo((): DetalleCobroCantidad[] => {
    if (!pedido) return [];
    // Plan personas/combinado: el API cobra sobre el saldo (no sobre platos).
    if (dividirCuenta && (modoDividir === 'personas' || modoDividir === 'combinado')) {
      return [];
    }
    const pendientes = detalleSerial
      .filter((d) => !d.cobrado)
      .map((d) => d.id_detalle);
    if (!dividirCuenta) {
      return resolverSolicitudesCobro({}, detalleSerial, pendientes);
    }
    // Modo platos: selección (+ saldo pendiente si está marcado o es el único pendiente).
    const base = solicitudesDesdeCantidades(cantidadesEfectivas);
    if (base.length === 0) return [];
    try {
      return ordenarSolicitudesCobro(
        detalleSerial,
        expandirSolicitudesConEmpaques(detalleSerial, base),
      );
    } catch {
      return [];
    }
  }, [
    pedido,
    dividirCuenta,
    modoDividir,
    cantidadesEfectivas,
    detalleSerial,
  ]);

  const solicitudesPrecuenta = useMemo((): DetalleCobroCantidad[] => {
    if (!pedido) return [];
    const pendientes = detalleSerial.filter((d) => !d.cobrado).map((d) => d.id_detalle);
    if (pendientes.length === 0) return [];
    if (!dividirCuenta || modoDividir === 'personas') {
      return resolverSolicitudesCobro({}, detalleSerial, pendientes);
    }
    return solicitudesCobro;
  }, [pedido, dividirCuenta, modoDividir, solicitudesCobro, detalleSerial]);

  const idsCobroActuales = useMemo(
    () => solicitudesCobro.map((s) => s.id_detalle),
    [solicitudesCobro],
  );

  const lineasCobro = useMemo(() => {
    if (!pedido || solicitudesCobro.length === 0) return [];
    return lineasDescuentoDesdeSolicitudes(
      pedido.detalles.map((d) => ({
        id_detalle: d.id_detalle,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        nombre_producto: d.nombre_producto,
        categoria_nombre: d.categoria_nombre ?? '',
        id_categoria: d.id_categoria,
        participa_descuento_sopas: d.participa_descuento_sopas,
        es_plato_principal: d.es_plato_principal,
      })),
      solicitudesCobro,
    );
  }, [pedido, solicitudesCobro]);

  const descuentosCobro = useMemo(() => {
    if (lineasCobro.length === 0) {
      return {
        descuento_sopas: 0,
        descuento_muleros: 0,
        descuento_promociones: 0,
        promociones_desglose: [],
      };
    }
    if (configReglas && pedido) {
      return calcularDescuentosPedido(
        lineasCobro,
        configReglas,
        contextoDescuentosPedido(pedido),
      );
    }
    return {
      ...(pedido?.descuentos_estimados ?? {
        descuento_sopas: 0,
        descuento_muleros: 0,
        descuento_promociones: 0,
      }),
      promociones_desglose: pedido?.descuentos_estimados?.promociones_desglose ?? [],
    };
  }, [lineasCobro, configReglas, pedido]);

  const subtotalItems = lineasCobro.reduce((s, d) => s + d.subtotal_linea, 0);
  const desglosePromociones = descuentosCobro.promociones_desglose ?? [];
  const montoDescPromo = descuentosCobro.descuento_promociones ?? 0;
  const sumaDescuentos = montoDescPromo;
  const totalCobrar = Math.max(0, subtotalItems - sumaDescuentos);
  const descuentosValidos = sumaDescuentos <= subtotalItems;
  const etiquetasPedidoUi = useMemo(
    () => (configReglas?.etiquetas_pedido ?? []).filter((e) => e.activa),
    [configReglas],
  );
  const etiquetasActivasPedido = useMemo(
    () => (pedido ? new Set(etiquetasActivasEnPedido(pedido)) : new Set<string>()),
    [pedido],
  );
  const hayPendientes = (pedido?.cobro_pendiente?.items ?? detallesPendientes.length) > 0;
  const esParaLlevar = pedido?.modo_servicio === 'para_llevar';
  const detallesEmpaqueUi = useMemo(
    (): DetalleEmpaqueUi[] =>
      (pedido?.detalles ?? []).map((d) => ({
        id_detalle: d.id_detalle,
        id_detalle_padre: d.id_detalle_padre,
        cantidad: d.cantidad,
        es_empacable: d.es_empacable,
        es_plato_principal: d.es_plato_principal,
        categoria_nombre: d.categoria_nombre,
      })),
    [pedido?.detalles],
  );
  const cobrosParciales = (pedido?.facturas?.length ?? 0) > 0;

  const cobrosVistaParciales = useMemo(() => {
    const facturas = pedido?.facturas ?? [];
    if (facturas.length === 0) return [];
    return agruparCobrosVista(
      facturas.map((f) => ({
        id_factura: f.id_factura,
        metodo_pago: f.metodo_pago ?? 'efectivo',
        cobro_mixto_grupo: f.cobro_mixto_grupo,
        persona_plan_indice: f.persona_plan_indice,
        total: f.total,
      })),
    );
  }, [pedido?.facturas]);

  const cobrosPlanHechos = useMemo(() => {
    if (!usaPlanPersonas) return 0;
    return contarCobrosPlanHechos(pedido?.facturas ?? [], facturasBasePlan);
  }, [usaPlanPersonas, pedido?.facturas, facturasBasePlan]);

  const planMontos = useMemo(() => {
    if (!usaPlanPersonas || personasPlan < 2) return [];
    // Cuotas congeladas al iniciar el reparto (no recalcular con el saldo que baja).
    if (
      cuotasPlanPersonas.length === personasPlan &&
      planBaseTotal > 0 &&
      cuotasPlanPersonas.reduce((s, x) => s + x, 0) === planBaseTotal
    ) {
      return cuotasPlanPersonas;
    }
    const base =
      modoDividir === 'combinado'
        ? planBaseTotal > 0
          ? planBaseTotal
          : totalSeleccionCombinado
        : planBaseTotal > 0
          ? planBaseTotal
          : totalPendienteCompleto;
    if (base <= 0) return [];
    return repartirMontoEnCop(base, personasPlan);
  }, [
    usaPlanPersonas,
    personasPlan,
    modoDividir,
    totalSeleccionCombinado,
    totalPendienteCompleto,
    planBaseTotal,
    cuotasPlanPersonas,
  ]);

  const montosPlanUi = planMontos;

  const facturasResumenPlan = useMemo(() => {
    if (!usaPlanPersonas || personasPlan < 2) return [];
    const slice = pedido?.facturas?.slice(facturasBasePlan) ?? [];
    return Array.from({ length: personasPlan }, (_, i) => {
      const idx = i + 1;
      const grupo = slice.filter((f) => f.persona_plan_indice === idx);
      if (grupo.length === 0) return null;
      const metodos = new Set(grupo.map((f) => f.metodo_pago));
      const mixto = metodos.size > 1 || grupo.some((f) => f.cobro_mixto_grupo != null);
      const resumen = cobrosResumenMixto(
        grupo.map((f) => ({
          id_factura: f.id_factura,
          metodo_pago: f.metodo_pago ?? 'efectivo',
          total: f.total,
        })),
      );
      return {
        total: grupo.reduce((s, f) => s + f.total, 0),
        metodo_pago: mixto ? ('mixto' as const) : (grupo[0]?.metodo_pago as MetodoPago),
        efectivo: resumen.find((r) => r.metodo_pago === 'efectivo')?.total,
        transferencia: resumen.find((r) => r.metodo_pago === 'transferencia')?.total,
      };
    });
  }, [usaPlanPersonas, personasPlan, pedido?.facturas, facturasBasePlan]);

  useEffect(() => {
    if (!usaPlanPersonas) return;
    if (personasPlan < 2 && pedido) {
      const sugerido = Math.max(2, Math.min(6, pedido.num_comensales ?? 2));
      setPersonasPlan(sugerido);
      setPlanBaseTotal(totalPendienteCompleto);
      setMetodosPlan(Array.from({ length: sugerido }, () => null));
    }
  }, [
    usaPlanPersonas,
    pedido?.id_pedido,
    pedido?.num_comensales,
    personasPlan,
    totalPendienteCompleto,
  ]);

  useEffect(() => {
    if (!dividirCuenta || personasPlan < 2 || planBaseTotal > 0) return;
    const base =
      modoSaldoRestante && modoDividir === 'personas'
        ? montoSaldoPendiente
        : totalPendienteCompleto;
    if (base > 0) setPlanBaseTotal(base);
  }, [
    dividirCuenta,
    personasPlan,
    planBaseTotal,
    totalPendienteCompleto,
    modoSaldoRestante,
    modoDividir,
    montoSaldoPendiente,
  ]);

  function cerrarSesionPlanCobro(facturasLength: number) {
    setFacturasBasePlan(facturasLength);
    setPlanSesionId(0);
    setMetodosPlan(Array.from({ length: personasPlan }, () => null));
    setCuotasPlanPersonas([]);
    setPlanBaseTotal(0);
    setSeleccionReferenciaCombinado([]);
    planCombinadoFirmaRef.current = null;
  }

  /** Sale del modo plan y deja visible el saldo pendiente (si lo hay). */
  function finalizarPlanCobroTrasSesion(facturasLength: number) {
    cerrarSesionPlanCobro(facturasLength);
    setCantidadesCobro({});
    setDividirCuenta(false);
    setModoDividir('platos');
    setRecibeDigits('');
    setMixtoTransferenciaDigits('');
    setTransferenciaSoloDigits('');
    setMetodo(null);
  }

  function congelarPlanCombinado(
    p: PedidoFull,
    base: number,
    n: number,
    cantidades: Record<number, number>,
  ) {
    setPlanBaseTotal(base);
    recalcularCuotasPersonas(base, n);
    setSeleccionReferenciaCombinado(
      solicitudesDesdeCantidadesPedido(p, cantidades),
    );
  }

  function referenciaCombinadoParaCobro(p: PedidoFull): DetalleCobroCantidad[] {
    if (seleccionReferenciaCombinado.length > 0) {
      return seleccionReferenciaCombinado;
    }
    const ref = solicitudesDesdeCantidadesPedido(p, cantidadesCobro);
    if (ref.length > 0) setSeleccionReferenciaCombinado(ref);
    return ref;
  }

  function extrasCobroCombinadoCuota(p: PedidoFull, montoObjetivo: number) {
    return {
      plan_combinado_sobre_seleccion: true,
      monto_persona_plan: montoObjetivo,
      detalles_seleccion_referencia: referenciaCombinadoParaCobro(p),
    };
  }

  function recalcularCuotasPersonas(base: number, n: number) {
    if (base <= 0 || n < 2) {
      setCuotasPlanPersonas([]);
      return;
    }
    setCuotasPlanPersonas(repartirMontoEnCop(base, n));
  }

  function cambiarPersonasPlan(n: number) {
    // Solo bloquea si ya hubo cobros reales en ESTA sesión (no omisiones viejas).
    if (
      (modoDividir === 'personas' || modoDividir === 'combinado') &&
      cobrosPlanHechos > 0
    ) {
      void showNotice(
        'Plan de cobro',
        'Ya hay cobros en este reparto. Termina el plan antes de cambiar el número de personas.',
        'info',
      );
      return;
    }
    setPersonasPlan(n);
    setMetodosPlan((prev) => {
      const next = [...prev];
      while (next.length < n) next.push(null);
      return next.slice(0, n);
    });
    if (modoDividir === 'combinado') {
      const base = totalSeleccionCombinado;
      if (pedido && base > 0) {
        congelarPlanCombinado(pedido, base, n, cantidadesCobro);
      } else {
        setPlanBaseTotal(0);
        setCuotasPlanPersonas([]);
      }
    } else if (modoDividir === 'personas') {
      const base =
        planBaseTotal > 0 ? planBaseTotal : totalPendienteCompleto;
      if (base > 0) {
        setPlanBaseTotal(base);
        recalcularCuotasPersonas(base, n);
      }
    }
  }

  function iniciarPlanPersonas(opts?: { forzarNuevaSesion?: boolean }) {
    const base =
      modoDividir === 'combinado'
        ? totalSeleccionCombinado > 0
          ? totalSeleccionCombinado
          : 0
        : modoSaldoRestante && modoDividir === 'personas'
          ? montoSaldoPendiente
          : totalPendienteCompleto;
    const cobrosEnEstePlan = contarCobrosPlanHechos(
      pedido?.facturas ?? [],
      facturasBasePlan,
    );
    // Misma sesión en curso: no reiniciar (salvo cambio de modo).
    if (
      !opts?.forzarNuevaSesion &&
      (modoDividir === 'personas' || modoDividir === 'combinado') &&
      cobrosEnEstePlan > 0 &&
      cuotasPlanPersonas.length === personasPlan &&
      planBaseTotal > 0
    ) {
      return;
    }
    // Nueva sesión: ignorar cobros/omisiones de repartos anteriores.
    setFacturasBasePlan(pedido?.facturas?.length ?? 0);
    setPlanSesionId(Date.now());
    setPlanBaseTotal(base);
    if (modoDividir === 'combinado') {
      planCombinadoFirmaRef.current = null;
      setSeleccionReferenciaCombinado([]);
      if (base > 0) recalcularCuotasPersonas(base, personasPlan);
      else setCuotasPlanPersonas([]);
    } else if (modoDividir === 'personas' && base > 0) {
      recalcularCuotasPersonas(base, personasPlan);
    } else {
      setCuotasPlanPersonas([]);
    }
    setMetodosPlan(Array.from({ length: personasPlan }, () => null));
  }

  useEffect(() => {
    if (dividirCuenta && (modoDividir === 'personas' || modoDividir === 'combinado')) {
      iniciarPlanPersonas({ forzarNuevaSesion: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dividirCuenta, modoDividir]);

  useEffect(() => {
    if (!dividirCuenta || modoDividir !== 'combinado' || personasPlan < 2) return;

    const facturas = pedido?.facturas ?? [];
    const cobrosEnSlice = contarCobrosPlanHechos(facturas, facturasBasePlan);
    // Reparto en curso: no tocar base/cuotas (el saldo baja tras cada pago).
    if (cobrosEnSlice > 0 || personasOmitidasPlan.length > 0) {
      return;
    }

    const firma = firmaCantidadesPlan(cantidadesCobro);
    const haySeleccion = firma !== '[]';
    if (!haySeleccion) {
      if (planBaseTotal > 0 || cuotasPlanPersonas.length > 0) {
        setPlanBaseTotal(0);
        setCuotasPlanPersonas([]);
        setSeleccionReferenciaCombinado([]);
        planCombinadoFirmaRef.current = null;
      }
      return;
    }

    if (totalSeleccionCombinado <= 0 || !pedido) return;

    if (
      planCombinadoFirmaRef.current == null ||
      firma !== planCombinadoFirmaRef.current ||
      planBaseTotal !== totalSeleccionCombinado
    ) {
      planCombinadoFirmaRef.current = firma;
      congelarPlanCombinado(
        pedido,
        totalSeleccionCombinado,
        personasPlan,
        cantidadesCobro,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cantidadesCobro,
    dividirCuenta,
    modoDividir,
    personasPlan,
    totalSeleccionCombinado,
    pedido?.facturas?.length,
    facturasBasePlan,
    personasOmitidasPlan.length,
  ]);

  const unidadesTanda = unidadesEnSolicitudes(solicitudesCobro);
  /** Unidades marcadas con +/− en modo combinado (solicitudesCobro va vacío en plan). */
  const unidadesSeleccionCombinado = unidadesEnSolicitudes(
    solicitudesSeleccionCombinado,
  );
  const haySeleccionCombinado =
    modoDividir === 'combinado' &&
    unidadesSeleccionCombinado > 0 &&
    totalSeleccionCombinado > 0;
  /** Selección ya fijada para el reparto (no hay que volver a marcar ítems). */
  const planCombinadoCongelado =
    modoDividir === 'combinado' &&
    planBaseTotal > 0 &&
    (cuotasPlanPersonas.length === personasPlan ||
      seleccionReferenciaCombinado.length > 0);

  function pendienteDetalle(id: number): number {
    const d = pedido?.detalles.find((x) => x.id_detalle === id);
    if (!d || d.cobrado) return 0;
    return d.cantidad;
  }

  function lineasAsignablesPlan() {
    if (!pedido) return [];
    return lineasAsignablesCobroPlan({
      detalles: pedido.detalles,
      pendienteDetalle,
      modoDividir,
      dividirCuenta,
      cantidadesCobro,
    });
  }

  function asignacionCobroPersonaPlanLocal(
    montoNeto: number,
    ctx?: {
      personaIndice?: number;
      totalPersonas?: number;
      soloCuota?: boolean;
    },
    pedidoRef?: PedidoFull,
  ) {
    const p = pedidoRef ?? pedido;
    if (!p || montoNeto <= 0) return null;
    const serial = serialDetallesPedido(p);
    const pendienteEn = (id: number) => {
      const d = p.detalles.find((x) => x.id_detalle === id);
      if (!d || d.cobrado) return 0;
      return d.cantidad;
    };
    const totalReferencia =
      modoDividir === 'combinado' ? totalCobrar : totalPendienteCompleto;
    return asignacionCobroPersonaPlan({
      montoNeto,
      modoDividir,
      totalReferencia,
      lineasAsignables: lineasAsignablesCobroPlan({
        detalles: p.detalles,
        pendienteDetalle: pendienteEn,
        modoDividir,
        dividirCuenta,
        cantidadesCobro,
      }),
      serial,
      totalNeto: (sol) => totalesDesdeSolicitudes(sol, p).total,
      personaIndice: ctx?.personaIndice,
      totalPersonas: ctx?.totalPersonas,
      soloCuota: ctx?.soloCuota,
    });
  }

  function cantidadSeleccionadaGrupo(g: LineaFacturaGrupo): number {
    return g.ids_detalle.reduce((s, id) => s + (cantidadesCobro[id] ?? 0), 0);
  }

  function maxPendienteGrupo(g: LineaFacturaGrupo): number {
    return g.ids_detalle.reduce((s, id) => s + pendienteDetalle(id), 0);
  }

  function cambiarCantidadGrupo(g: LineaFacturaGrupo, delta: number) {
    setCantidadesCobro((prev) => {
      const next = { ...prev };
      if (delta > 0) {
        for (const id of g.ids_detalle) {
          const max = pendienteDetalle(id);
          const cur = next[id] ?? 0;
          if (cur < max) {
            next[id] = cur + 1;
            break;
          }
        }
      } else {
        for (const id of [...g.ids_detalle].reverse()) {
          const cur = next[id] ?? 0;
          if (cur > 0) {
            next[id] = cur - 1;
            if (next[id] === 0) delete next[id];
            break;
          }
        }
      }
      return next;
    });
  }

  useEffect(() => {
    if (!dividirCuenta) {
      setCantidadesCobro({});
      setCuotasPlanPersonas([]);
      setPlanBaseTotal(0);
      setSeleccionReferenciaCombinado([]);
      planCombinadoFirmaRef.current = null;
    }
  }, [dividirCuenta]);

  const recibidoNum = parseCOPDigits(recibeDigits);
  const montoTransferenciaEstandarMixto = parseCOPDigits(
    mixtoTransferenciaEstandarDigits,
  );
  const resumenMixtoEstandar = useMemo(
    () => resumenMixtoUi(totalCobrar, montoTransferenciaEstandarMixto, recibidoNum),
    [totalCobrar, montoTransferenciaEstandarMixto, recibidoNum],
  );
  const montoTransferenciaSolo = parseCOPDigits(transferenciaSoloDigits);
  const resumenTransferenciaEstandar = useMemo(
    () => resumenTransferenciaUi(totalCobrar, montoTransferenciaSolo),
    [totalCobrar, montoTransferenciaSolo],
  );

  const avancePlanCobro = cobrosPlanHechos + personasOmitidasPlan.length;
  /** Sesión terminada solo con avance real en este reparto (no cobros viejos). */
  const planSesionCompleta =
    usaPlanPersonas &&
    personasPlan >= 2 &&
    avancePlanCobro >= personasPlan &&
    avancePlanCobro > 0 &&
    planBaseTotal > 0;
  /** En combinado/personas siempre mostramos el panel de reparto. */
  const cobroPorPlan = usaPlanPersonas;
  const usaCobroEstandar = !cobroPorPlan;
  /** Índice de la persona en curso; no se sale de rango si la sesión ya cerró. */
  const personaActivaCobro = planSesionCompleta
    ? Math.max(0, personasPlan - 1)
    : avancePlanCobro;
  const saldoPlanReparto = useMemo(() => {
    if (!usaPlanPersonas || planBaseTotal <= 0) {
      return { cobrado: 0, saldoRestante: 0, saldoOmitido: 0 };
    }
    const slice = pedido?.facturas?.slice(facturasBasePlan) ?? [];
    return resumenSaldoPlanCombinado({
      planBaseTotal,
      facturasSlice: slice,
      planMontos,
      personasOmitidas: personasOmitidasPlan,
    });
  }, [
    usaPlanPersonas,
    planBaseTotal,
    pedido?.facturas,
    facturasBasePlan,
    planMontos,
    personasOmitidasPlan,
  ]);
  const cuotaPersonaActiva = planMontos[personaActivaCobro] ?? 0;
  const asignacionPersonaActiva = useMemo(() => {
    if (modoDividir === 'personas' || modoDividir === 'combinado') return null;
    const montoObjetivo = planMontos[personaActivaCobro] ?? 0;
    return asignacionCobroPersonaPlanLocal(montoObjetivo, {
      personaIndice: personaActivaCobro,
      totalPersonas: personasPlan,
    });
  }, [
    planMontos,
    personaActivaCobro,
    personasPlan,
    pedido,
    modoDividir,
    totalCobrar,
    totalPendienteCompleto,
    cantidadesCobro,
    configReglas,
    cobrosPlanHechos,
  ]);
  const montoPersonaActiva =
    modoDividir === 'personas' || modoDividir === 'combinado'
      ? cuotaPersonaActiva
      : (asignacionPersonaActiva?.total ?? montosPlanUi[personaActivaCobro] ?? 0);
  const metodoPersonaActiva = metodosPlan[personaActivaCobro] ?? null;

  const resumenTandaActual = useMemo(() => {
    if (!pedido || !dividirCuenta) return null;
    if (
      usaPlanPersonas &&
      modoDividir === 'personas' &&
      cuotaPersonaActiva > 0
    ) {
      return {
        titulo: `Persona ${personaActivaCobro + 1}`,
        esCuotaSobreTotal: true,
        lineas: [] as typeof lineasCobro,
        total: cuotaPersonaActiva,
        totalCuenta:
          planBaseTotal > 0 ? planBaseTotal : totalPendienteCompleto,
      };
    }
    if (
      usaPlanPersonas &&
      modoDividir === 'combinado' &&
      cuotaPersonaActiva > 0 &&
      seleccionReferenciaCombinado.length > 0
    ) {
      const lineasRef = lineasDescuentoDesdeSolicitudes(
        pedido.detalles.map((d) => ({
          id_detalle: d.id_detalle,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          nombre_producto: d.nombre_producto,
          categoria_nombre: d.categoria_nombre ?? '',
          id_categoria: d.id_categoria,
          participa_descuento_sopas: d.participa_descuento_sopas,
          es_plato_principal: d.es_plato_principal,
        })),
        seleccionReferenciaCombinado,
      );
      return {
        titulo: `Persona ${personaActivaCobro + 1} · esta tanda`,
        esCuotaSobreSeleccion: true,
        lineas: lineasRef,
        total: cuotaPersonaActiva,
        totalCuenta: planBaseTotal > 0 ? planBaseTotal : totalCobrar,
      };
    }
    if (usaPlanPersonas && montoPersonaActiva > 0 && asignacionPersonaActiva) {
      const lineas = lineasDescuentoDesdeSolicitudes(
        pedido.detalles.map((d) => ({
          id_detalle: d.id_detalle,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          nombre_producto: d.nombre_producto,
          categoria_nombre: d.categoria_nombre ?? '',
          id_categoria: d.id_categoria,
          participa_descuento_sopas: d.participa_descuento_sopas,
          es_plato_principal: d.es_plato_principal,
        })),
        asignacionPersonaActiva.solicitudes,
      );
      if (lineas.length === 0) return null;
      return {
        titulo:
          modoDividir === 'combinado'
            ? `Persona ${personaActivaCobro + 1} · esta tanda`
            : `Persona ${personaActivaCobro + 1}`,
        lineas,
        total:
          modoDividir === 'combinado'
            ? cuotaPersonaActiva
            : asignacionPersonaActiva.total,
      };
    }
    if (lineasCobro.length > 0) {
      return {
        titulo: 'Esta tanda',
        lineas: lineasCobro,
        total: totalCobrar,
      };
    }
    return null;
  }, [
    pedido,
    dividirCuenta,
    usaPlanPersonas,
    montoPersonaActiva,
    asignacionPersonaActiva,
    personaActivaCobro,
    modoDividir,
    cuotaPersonaActiva,
    totalPendienteCompleto,
    lineasCobro,
    totalCobrar,
    planBaseTotal,
    seleccionReferenciaCombinado,
  ]);

  useEffect(() => {
    if (cobroPorPlan) {
      setRecibeDigits('');
      setMixtoTransferenciaDigits('');
    }
  }, [cobroPorPlan, personaActivaCobro, metodoPersonaActiva, montoPersonaActiva]);

  // No auto-cerrar aquí: cobros/omisiones de sesiones anteriores hacían
  // planSesionCompleta=true al elegir combinado y reseteaban el modo.
  // El cierre lo hacen omitirPersonaPlan / cobrarPersonaPlan al terminar.

  const platosParaReconciliarSaldo = useMemo(() => {
    if (!pedido || !modoSaldoRestante) return [];
    return pedido.detalles
      .filter((d) => {
        if (d.cobrado || d.id_factura != null) return false;
        if (d.id_detalle_padre != null) return false;
        if (d.es_cuota_pendiente_reparto) return false;
        if (esNotaSaldoRestantePendiente(d.nota_cocina)) return false;
        if (esNotaSaldoAbono(d.nota_cocina)) return false;
        if (idsPoolSaldo != null) return idsPoolSaldo.has(d.id_detalle);
        return true;
      })
      .map((d) => ({
        id_detalle: d.id_detalle,
        precio_unitario: d.precio_unitario,
        cantidad: d.cantidad,
      }));
  }, [pedido, modoSaldoRestante, idsPoolSaldo]);

  /** Reparto en curso solo si ya hubo cobros/omisiones en ESTA sesión. */
  const planRepartoEnCurso =
    enRepartoPlanActivo &&
    (cobrosPlanHechos > 0 || personasOmitidasPlan.length > 0);

  // Personas y combinado: al salir del reparto (o al abrir uno nuevo sin avance),
  // reparte el saldo en unidades de plato como en modo platos.
  const necesitaReconciliarSaldoAPlatos =
    modoSaldoRestante &&
    !planRepartoEnCurso &&
    saldoNecesitaReconciliarAPlatos(
      montoSaldoPendiente,
      platosParaReconciliarSaldo,
      saldoPendienteDetalle?.nota_cocina,
    );

  // Tras personas/combinado: al cobrar por platos (o total), reparte el saldo en
  // unidades del menú y deja el remanente como saldo pendiente.
  useEffect(() => {
    if (!necesitaReconciliarSaldoAPlatos || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api<PedidoFull>(
          `/pedidos/${pedidoId}/plan/reconciliar-saldo-platos`,
          { method: 'POST', token },
        );
        if (!cancelled) {
          setPedido(res);
        }
      } catch (e) {
        if (!cancelled) {
          await manejarErrorOperacion(e, {
            title: 'Saldo pendiente',
            message: mensajeErrorUsuario(
              e,
              'No se pudo organizar el saldo en platos.',
            ),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [necesitaReconciliarSaldoAPlatos, pedidoId, token]);

  const vuelto =
    metodo === 'efectivo' && recibidoNum >= totalCobrar
      ? recibidoNum - totalCobrar
      : null;
  const faltaEfectivo =
    metodo === 'efectivo' && recibeDigits !== '' && recibidoNum < totalCobrar;
  const vueltoPlan =
    metodoPersonaActiva === 'efectivo' &&
    recibidoNum >= montoPersonaActiva
      ? recibidoNum - montoPersonaActiva
      : null;
  const faltaEfectivoPlan =
    metodoPersonaActiva === 'efectivo' &&
    recibeDigits !== '' &&
    recibidoNum < montoPersonaActiva;
  const efectivoCubreTotal =
    metodo === 'efectivo' && recibeDigits !== '' && recibidoNum >= totalCobrar;
  const bloqueaCobroEstandar =
    busy ||
    !online ||
    !descuentosValidos ||
    solicitudesCobro.length === 0 ||
    (dividirCuenta && unidadesTanda === 0);
  const cobroEstandarIncompleto =
    !metodo ||
    (metodo === 'efectivo' && !efectivoCubreTotal) ||
    (metodo === 'mixto' &&
      !puedeConfirmarCobroMixto(resumenMixtoEstandar, devolucionExcesoMetodo)) ||
    (metodo === 'transferencia' &&
      !puedeConfirmarCobroTransferencia(
        totalCobrar,
        montoTransferenciaSolo,
        devolucionExcesoMetodo,
      ));
  const deshabilitarCobro =
    bloqueaCobroEstandar || (Boolean(metodo) && cobroEstandarIncompleto);
  // Combinado: con plan congelado ya no se piden ítems; solo la cuota de la persona.
  const sinItemsPlanCobro =
    modoDividir === 'combinado' &&
    !planCombinadoCongelado &&
    !haySeleccionCombinado;
  const estadoCobroPlan = useMemo(
    () =>
      cobroPlanCtaEstado({
        monto: montoPersonaActiva,
        metodo: metodoPersonaActiva,
        mixtoTransferenciaDigits: mixtoTransferenciaDigits,
        transferenciaSoloDigits,
        devolucionExcesoMetodo,
        recibeDigits,
        faltaEfectivo: faltaEfectivoPlan,
        busy,
        sinItems: sinItemsPlanCobro,
      }),
    [
      montoPersonaActiva,
      metodoPersonaActiva,
      mixtoTransferenciaDigits,
      transferenciaSoloDigits,
      devolucionExcesoMetodo,
      recibeDigits,
      faltaEfectivoPlan,
      busy,
      sinItemsPlanCobro,
    ],
  );
  const bloqueaCobroPlan =
    busy || !online || !estadoCobroPlan.puedeIntentarCobro;
  const deshabilitarCobroPlan =
    bloqueaCobroPlan ||
    (Boolean(metodoPersonaActiva) && estadoCobroPlan.cobroIncompleto);
  const usaBarraCobroFija =
    puedeCobrar && (usaCobroEstandar || cobroPorPlan);
  const deshabilitarPrecuenta =
    busy ||
    imprimiendoPrecuenta ||
    !descuentosValidos ||
    solicitudesPrecuenta.length === 0;

  const scrollBottomPad = usaBarraCobroFija
    ? STICKY_ACTION_BAR_HEIGHT + chromeBottom + 12
    : chromeBottom + 12;

  const tituloTotalCard = useMemo(() => {
    if (!dividirCuenta) return 'Total a cobrar';
    if (modoDividir === 'combinado') return 'Total marcado a dividir';
    if (modoDividir === 'personas') return 'Cuenta pendiente · reparto por persona';
    return 'Total de esta tanda';
  }, [dividirCuenta, modoDividir]);

  const totalResumenVisible =
    dividirCuenta && modoDividir === 'personas'
      ? totalPendienteCompleto
      : totalCobrar;

  async function actualizarEtiquetasPromocion(etiquetaId: string, activa: boolean) {
    if (!pedido) return;
    const actuales = etiquetasActivasEnPedido(pedido);
    const next = activa
      ? [...new Set([...actuales, etiquetaId])]
      : actuales.filter((id) => id !== etiquetaId);
    setMarcandoEtiquetas(true);
    try {
      const p = await api<PedidoFull>(`/pedidos/${pedidoId}/etiquetas-promocion`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ etiquetas_promocion: next }),
      });
      setPedido(p);
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'No se actualizaron las etiquetas',
        message: 'Intenta de nuevo en unos segundos.',
      });
    } finally {
      setMarcandoEtiquetas(false);
    }
  }

  async function validarCorreoClienteSiAplica(): Promise<boolean> {
    if (!enviarPorCorreo) return true;
    const email = emailCliente.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await showNotice(
        'Correo del cliente',
        'Activa «Enviar por correo» solo si indicas un correo válido.',
        'warning',
      );
      return false;
    }
    return true;
  }

  async function notificarEnvioCorreoSiAplica(
    idFactura?: number | null,
  ) {
    if (!enviarPorCorreo) return;
    await enviarFacturaPorCorreo({
      token,
      idPedido: Number(pedidoId),
      idFactura: idFactura ?? undefined,
      email: emailCliente,
      online,
    });
  }

  async function reimprimirFacturaCobrada() {
    setBusy(true);
    try {
      const res = await api<{
        impresion_factura?: {
          impreso: boolean;
          error?: string;
          destino?: string;
          codigo_error?: string;
        };
      }>(`/pedidos/${pedidoId}/reimprimir-factura`, {
        method: 'POST',
        token,
      });
      if (alertarSiSinPapel(res.impresion_factura ?? {})) {
        return;
      }
      await notificarResultadoImpresion(
        res.impresion_factura,
        {
          titulo: 'Factura reimpresa',
          mensaje: `Ticket impreso (${res.impresion_factura?.destino ?? 'impresora'}).`,
        },
        { titulo: 'Sin imprimir' },
      );
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'No se reimprimió la factura',
        message: 'Comprueba la impresora e intenta de nuevo.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function imprimirPrecuenta() {
    if (solicitudesPrecuenta.length === 0) {
      await showNotice(
        'Pre-cuenta',
        dividirCuenta
          ? 'Indica al menos una unidad para imprimir en esta tanda.'
          : 'No hay ítems pendientes para imprimir.',
        'warning',
      );
      return;
    }
    if (!descuentosValidos) {
      await showNotice(
        'Descuentos',
        'La suma de descuentos no puede superar el subtotal de ítems.',
        'warning',
      );
      return;
    }
    setImprimiendoPrecuenta(true);
    try {
      const body: Record<string, unknown> = {
        factura_con_copia: precuentaConCopia,
      };
      if (dividirCuenta || solicitudesPrecuenta.length > 0) {
        body.detalles_cobro = solicitudesPrecuenta;
      }
      const res = await api<{
        impresion_precuenta?: {
          impreso: boolean;
          omitido?: boolean;
          en_cola?: boolean;
          error?: string;
          destino?: string;
          codigo_error?: string;
        };
        factura_con_copia?: boolean;
      }>(`/pedidos/${pedidoId}/imprimir-precuenta`, {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      });
      const imp = res.impresion_precuenta;
      if (imp && alertarSiSinPapel(imp)) {
        return;
      }
      if (imp?.en_cola) {
        await showNotice(
          'Pre-cuenta en cola',
          'El ticket se imprime en cola (puede tardar si hay comandas antes).',
          'success',
        );
      } else {
        await notificarResultadoImpresion(
          imp,
          {
            titulo: 'Pre-cuenta impresa',
            mensaje: `Ticket enviado a la impresora${
              res.factura_con_copia ? ' (copia negocio y copia cliente)' : ''
            }. Aún no se ha cobrado.`,
          },
          { titulo: 'Sin imprimir' },
        );
      }
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'No se imprimió la pre-cuenta',
        message: 'Comprueba la impresora e intenta de nuevo.',
      });
    } finally {
      setImprimiendoPrecuenta(false);
    }
  }

  async function ejecutarCobroMixto(opts: {
    totalReferencia?: number;
    transferenciaReal: number;
    recibeDigits?: string;
    detallesCobro?: DetalleCobroCantidad[];
    cantidadesCobro?: Record<number, number>;
    personaPlanIndice?: number;
    planPersonasSobreTotal?: boolean;
    planCombinadoSobreSeleccion?: boolean;
    montoPersonaPlan?: number;
    detallesSeleccionReferencia?: DetalleCobroCantidad[];
    imprimirFactura?: boolean;
    mensajeExito?: string;
  }) {
    if (!(await validarCorreoClienteSiAplica())) return;
    const transferReal = opts.transferenciaReal;
    if (transferReal <= 0) {
      await showNotice(
        'Pago mixto',
        'Indica cuánto transfirió el cliente.',
        'warning',
      );
      return;
    }

    setBusy(true);
    try {
      const pFresh = await loadPedidoFresh();
      let solActualizadas: DetalleCobroCantidad[];
      if (opts.planPersonasSobreTotal) {
        solActualizadas = solicitudesPendientesCompletasPedido(pFresh);
      } else if (opts.planCombinadoSobreSeleccion) {
        const saldoLine = pFresh.detalles.find(
          (d) =>
            !d.cobrado &&
            d.id_factura == null &&
            esNotaSaldoRestantePendiente(d.nota_cocina),
        );
        const ref =
          opts.detallesSeleccionReferencia ??
          seleccionReferenciaCombinado;
        if (saldoLine) {
          solActualizadas = [
            { id_detalle: saldoLine.id_detalle, cantidad: saldoLine.cantidad },
          ];
        } else if (ref.length > 0) {
          solActualizadas = ref;
        } else if (
          opts.cantidadesCobro &&
          Object.keys(opts.cantidadesCobro).length > 0
        ) {
          solActualizadas = solicitudesDesdeCantidadesPedido(
            pFresh,
            opts.cantidadesCobro,
          );
        } else {
          solActualizadas = solicitudesPendientesCompletasPedido(pFresh);
        }
      } else if (opts.cantidadesCobro && Object.keys(opts.cantidadesCobro).length > 0) {
        solActualizadas = solicitudesDesdeCantidadesPedido(
          pFresh,
          opts.cantidadesCobro,
        );
      } else if (opts.detallesCobro?.length) {
        solActualizadas = opts.detallesCobro;
      } else {
        solActualizadas = solicitudesCobroParaPedido(pFresh, {
          dividirCuenta,
          modoDividir,
          cantidadesCobro,
        });
      }
      if (solActualizadas.length === 0) {
        await showNotice(
          'Cobro',
          opts.planCombinadoSobreSeleccion
            ? 'No queda saldo pendiente en este reparto.'
            : 'No quedan ítems pendientes de cobro. Actualiza el pedido.',
          'warning',
        );
        return;
      }

      const { total: totalNetoSolicitudes, descuentosValidos } =
        totalesDesdeSolicitudes(solActualizadas, pFresh);
      const totalNetoReal =
        (opts.planPersonasSobreTotal || opts.planCombinadoSobreSeleccion) &&
        opts.montoPersonaPlan != null
          ? opts.montoPersonaPlan
          : opts.totalReferencia ?? totalNetoSolicitudes;
      if (!descuentosValidos || totalNetoSolicitudes <= 0) {
        await showNotice(
          'Cobro',
          'No se pudo calcular el total de esta tanda. Actualiza el pedido.',
          'warning',
        );
        return;
      }

      const recibidoEfectivo = parseCOPDigits(opts.recibeDigits ?? '');
      const resumen = resumenMixtoUi(totalNetoReal, transferReal, recibidoEfectivo);

      if (!puedeConfirmarCobroMixto(resumen, devolucionExcesoMetodo)) {
        await showNotice(
          'Pago mixto',
          textoResumenCobroMixto(resumen, devolucionExcesoMetodo),
          'info',
        );
        return;
      }

      const imprimir = opts.imprimirFactura ?? imprimirFactura;
      const body: Record<string, unknown> = {
        monto_transferencia: transferReal,
        imprimir_factura: imprimir,
        factura_con_copia: imprimir && facturaConCopia,
        detalles_cobro: solActualizadas,
      };
      // Exceso de transferencia exige método; vuelto solo en efectivo puede ir por transferencia.
      if (
        resumen.vueltoTotal > 0 &&
        (devolucionExcesoMetodo || resumen.vueltoPorTransferencia > 0)
      ) {
        body.devolucion_exceso_metodo =
          devolucionExcesoMetodo ?? ('efectivo' as DevolucionExcesoMetodo);
      }
      if (resumen.efectivoFactura > 0 || recibidoEfectivo > 0) {
        body.monto_recibido_efectivo = recibidoEfectivo;
      }
      if (opts.personaPlanIndice != null) {
        body.persona_plan_indice = opts.personaPlanIndice;
        body.total_personas_plan = personasPlan;
        if (opts.planPersonasSobreTotal) {
          body.plan_personas_sobre_total = true;
          if (opts.montoPersonaPlan != null) {
            body.monto_persona_plan = opts.montoPersonaPlan;
          }
        } else if (opts.planCombinadoSobreSeleccion) {
          body.plan_combinado_sobre_seleccion = true;
          if (opts.montoPersonaPlan != null) {
            body.monto_persona_plan = opts.montoPersonaPlan;
          }
          if (opts.detallesSeleccionReferencia?.length) {
            body.detalles_seleccion_referencia = opts.detallesSeleccionReferencia;
          }
        }
      }

      const res = await api<
        PedidoFull & {
          cobro_completo?: boolean;
          id_factura_emitida?: number;
          impresion_factura?: {
            impreso: boolean;
            omitido?: boolean;
            en_cola?: boolean;
            error?: string;
            destino?: string;
            codigo_error?: string;
          };
        }
      >(`/pedidos/${pedidoId}/facturar-mixto`, {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      });

      setPedido(res);
      await notificarEnvioCorreoSiAplica(
        res.id_factura_emitida ??
          res.facturas?.[res.facturas.length - 1]?.id_factura,
      );

      const imp = res.impresion_factura;
      const quedaPendiente = res.cobro_completo === false;
      const enPlan = opts.personaPlanIndice != null;
      const quedanPersonasEnPlan =
        enPlan && (opts.personaPlanIndice ?? 0) < personasPlan;
      const debeQuedarEnFactura = quedaPendiente || quedanPersonasEnPlan;
      const msgExito =
        opts.mensajeExito ?? textoResumenCobroMixto(resumen, devolucionExcesoMetodo);

      const continuarTrasCobro = async () => {
        if (debeQuedarEnFactura) {
          setRecibeDigits('');
          setMixtoTransferenciaEstandarDigits('');
          setMixtoTransferenciaDigits('');
          if (enPlan) {
            const planQueda = (opts.personaPlanIndice ?? 0) < personasPlan;
            if (!(modoDividir === 'combinado' && planQueda)) {
              setCantidadesCobro({});
              if (modoDividir === 'combinado') {
                cerrarSesionPlanCobro(res.facturas?.length ?? 0);
              }
            }
          } else {
            setCantidadesCobro({});
          }
          await loadPedido();
        } else {
          router.replace('/(app)/mesas');
        }
      };

      if (imp && alertarSiSinPapel(imp)) {
        await showAppDialog({
          title: debeQuedarEnFactura ? 'Cobro parcial registrado' : 'Cobro registrado',
          message: `${msgExito}\n\nSin papel en la impresora; reintenta cuando cambies el rollo.`,
          variant: 'warning',
          buttons: [
            {
              text: debeQuedarEnFactura ? 'Continuar' : 'Ir a mesas',
              style: 'cancel',
              onPress: continuarTrasCobro,
            },
          ],
        });
        return;
      }

      await showNotice(
        debeQuedarEnFactura ? 'Cobro parcial registrado' : 'Cobro registrado',
        imp?.error ? `${msgExito}\n\nFactura: ${imp.error}` : msgExito,
        imp?.error ? 'warning' : 'success',
      );
      setRecibeDigits('');
      setMixtoTransferenciaEstandarDigits('');
      setMixtoTransferenciaDigits('');
      setDevolucionExcesoMetodo(null);
      await continuarTrasCobro();
    } catch (e) {
      await manejarErrorAccion(
        e,
        'registrar el cobro mixto',
        mensajeErrorUsuario(
          e,
          'Comprueba la conexión con el PC del restaurante.',
        ),
      );
      await loadPedido();
    } finally {
      setBusy(false);
    }
  }

  function cambiarMixtoTransferenciaEstandar(digits: string) {
    setMixtoTransferenciaEstandarDigits(digits);
    const resumen = resumenMixtoUi(
      totalCobrar,
      parseCOPDigits(digits),
      parseCOPDigits(recibeDigits),
    );
    if (resumen.vueltoTotal <= 0) {
      setDevolucionExcesoMetodo(null);
    }
  }

  function cambiarTransferenciaSolo(digits: string) {
    setTransferenciaSoloDigits(digits);
    const r = resumenTransferenciaUi(totalCobrar, parseCOPDigits(digits));
    if (r.exceso <= 0) {
      setDevolucionExcesoMetodo(null);
    }
  }

  function cambiarTransferenciaSoloPlan(digits: string) {
    setTransferenciaSoloDigits(digits);
    const r = resumenTransferenciaUi(montoPersonaActiva, parseCOPDigits(digits));
    if (r.exceso <= 0) {
      setDevolucionExcesoMetodo(null);
    }
  }

  function cambiarMixtoTransferenciaPlan(digits: string) {
    setMixtoTransferenciaDigits(digits);
    const resumen = resumenMixtoUi(
      montoPersonaActiva,
      parseCOPDigits(digits),
      parseCOPDigits(recibeDigits),
    );
    if (resumen.vueltoTotal <= 0) {
      setDevolucionExcesoMetodo(null);
    }
  }

  function cambiarMixtoRecibeEstandar(digits: string) {
    setRecibeDigits(digits);
    const resumen = resumenMixtoUi(
      totalCobrar,
      parseCOPDigits(mixtoTransferenciaEstandarDigits),
      parseCOPDigits(digits),
    );
    if (resumen.vueltoTotal <= 0) {
      setDevolucionExcesoMetodo(null);
    }
  }

  function cambiarMixtoRecibePlan(digits: string) {
    setRecibeDigits(digits);
    const resumen = resumenMixtoUi(
      montoPersonaActiva,
      parseCOPDigits(mixtoTransferenciaDigits),
      parseCOPDigits(digits),
    );
    if (resumen.vueltoTotal <= 0) {
      setDevolucionExcesoMetodo(null);
    }
  }

  function setMetodoPersonaActiva(met: MetodoPagoPlan) {
    setMetodosPlan((prev) => {
      const next = [...prev];
      next[personaActivaCobro] = met;
      return next;
    });
    setRecibeDigits('');
    setMixtoTransferenciaDigits('');
    setTransferenciaSoloDigits('');
    setDevolucionExcesoMetodo(null);
  }

  async function cobrarPersonaPlan(indice: number) {
    if (!online) {
      await showNotice(
        'Sin conexión',
        'No se puede cobrar sin conexión al servidor del restaurante.',
        'warning',
      );
      return;
    }
    if (planMontos.length === 0) return;
    if (indice !== avancePlanCobro) {
      await showNotice(
        'Plan de cobro',
        `Cobra en orden: sigue con la persona ${avancePlanCobro + 1}.`,
        'info',
      );
      return;
    }
    const montoObjetivo = planMontos[indice] ?? 0;
    if (montoObjetivo <= 0) {
      if (modoDividir === 'combinado') {
        await showNotice(
          'Selecciona ítems',
          'Marca con +/− los platos a dividir antes de cobrar.',
          'warning',
        );
      }
      return;
    }

    setBusy(true);
    let pFresh: PedidoFull;
    try {
      pFresh = await loadPedidoFresh();
    } catch (e) {
      setBusy(false);
      await manejarErrorOperacion(e, {
        title: 'Sin conexión',
        message:
          'No se pudo sincronizar el pedido con el servidor. Comprueba la Wi‑Fi y que el programa esté abierto en el PC.',
      });
      return;
    }

    const esPlanPersonasTotal = modoDividir === 'personas';
    const esCombinadoCuota = modoDividir === 'combinado';
    let totalCobroPersona = montoObjetivo;
    let solActualizadas: DetalleCobroCantidad[];

    if (esPlanPersonasTotal) {
      solActualizadas = solicitudesPendientesCompletasPedido(pFresh);
      if (solActualizadas.length === 0) {
        setBusy(false);
        await showNotice(
          'Plan de cobro',
          'No queda saldo pendiente por cobrar en este pedido.',
          'warning',
        );
        return;
      }
    } else if (esCombinadoCuota) {
      // Misma idea que personas: la selección quedó fija; se cobra sobre el saldo.
      const ref = referenciaCombinadoParaCobro(pFresh);
      const saldoLine = pFresh.detalles.find(
        (d) =>
          !d.cobrado &&
          d.id_factura == null &&
          esNotaSaldoRestantePendiente(d.nota_cocina),
      );
      if (saldoLine) {
        solActualizadas = [
          { id_detalle: saldoLine.id_detalle, cantidad: saldoLine.cantidad },
        ];
      } else if (ref.length > 0) {
        solActualizadas = ref;
      } else {
        solActualizadas = solicitudesDesdeCantidadesPedido(
          pFresh,
          cantidadesCobro,
        );
      }
      if (solActualizadas.length === 0 && planBaseTotal <= 0) {
        setBusy(false);
        await showNotice(
          'Plan de cobro',
          'Marca con +/− los ítems a repartir antes de cobrar.',
          'warning',
        );
        return;
      }
      if (solActualizadas.length === 0) {
        solActualizadas = solicitudesPendientesCompletasPedido(pFresh);
      }
      if (solActualizadas.length === 0) {
        setBusy(false);
        await showNotice(
          'Plan de cobro',
          'No queda saldo pendiente por cobrar en este reparto.',
          'warning',
        );
        return;
      }
    } else {
      const asignacion = asignacionCobroPersonaPlanLocal(
        montoObjetivo,
        {
          personaIndice: indice,
          totalPersonas: personasPlan,
        },
        pFresh,
      );
      if (!asignacion || asignacion.total <= 0 || asignacion.solicitudes.length === 0) {
        setBusy(false);
        await showNotice(
          'Plan de cobro',
          'No hay ítems pendientes para asignar a esta persona.',
          'warning',
        );
        return;
      }
      totalCobroPersona = asignacion.total;
      solActualizadas = solicitudesDesdeCantidadesPedido(pFresh, asignacion.cantidades);
    }

    if (solActualizadas.length === 0) {
      setBusy(false);
      await loadPedido();
      await showNotice(
        'Plan de cobro',
        'No quedan ítems pendientes para esta persona. El pedido se actualizó.',
        'warning',
      );
      return;
    }

    const met =
      indice === personaActivaCobro
        ? metodoPersonaActiva
        : (metodosPlan[indice] ?? null);
    const planIdx = indice + 1;

    if (personaPlanYaCobrada(pFresh, planIdx, facturasBasePlan)) {
      setBusy(false);
      await loadPedido();
      await showNotice(
        'Plan de cobro',
        `La persona ${indice + 1} ya tiene un cobro registrado.`,
        'info',
      );
      return;
    }

    if (met === 'mixto') {
      setBusy(false);
      await ejecutarCobroMixto({
        totalReferencia: totalCobroPersona,
        transferenciaReal: parseCOPDigits(mixtoTransferenciaDigits),
        recibeDigits,
        detallesCobro: solActualizadas,
        cantidadesCobro: esCombinadoCuota ? cantidadesCobro : undefined,
        personaPlanIndice: planIdx,
        planPersonasSobreTotal: esPlanPersonasTotal,
        planCombinadoSobreSeleccion: esCombinadoCuota,
        montoPersonaPlan: montoObjetivo,
        detallesSeleccionReferencia: esCombinadoCuota
          ? referenciaCombinadoParaCobro(pFresh)
          : undefined,
        mensajeExito: (() => {
          const transferReal = parseCOPDigits(mixtoTransferenciaDigits);
          const recibidoEfectivo = parseCOPDigits(recibeDigits);
          const resumen = resumenMixtoUi(totalCobroPersona, transferReal, recibidoEfectivo);
          return `Persona ${indice + 1}: ${textoResumenCobroMixto(resumen, devolucionExcesoMetodo)}`;
        })(),
      });
      return;
    }

    if (!met) {
      setBusy(false);
      scrollToCobroMetodo('plan');
      return;
    }

    if (met === 'efectivo' && parseCOPDigits(recibeDigits) < totalCobroPersona) {
      setBusy(false);
      await showNotice(
        'Cobro',
        `El monto recibido debe cubrir ${formatCOP(totalCobroPersona)}.`,
        'info',
      );
      return;
    }

    if (
      met === 'transferencia' &&
      !puedeConfirmarCobroTransferencia(
        totalCobroPersona,
        parseCOPDigits(transferenciaSoloDigits),
        devolucionExcesoMetodo,
      )
    ) {
      setBusy(false);
      await showNotice(
        'Transferencia',
        textoResumenCobroTransferencia(
          totalCobroPersona,
          parseCOPDigits(transferenciaSoloDigits),
          devolucionExcesoMetodo,
        ),
        'warning',
      );
      return;
    }

    try {
      const body: Record<string, unknown> = {
        metodo_pago: met,
        imprimir_factura: imprimirFactura,
        factura_con_copia: imprimirFactura && facturaConCopia,
        detalles_cobro: solActualizadas,
        persona_plan_indice: planIdx,
        total_personas_plan: personasPlan,
      };
      if (esPlanPersonasTotal) {
        body.plan_personas_sobre_total = true;
        body.monto_persona_plan = montoObjetivo;
      } else if (esCombinadoCuota) {
        Object.assign(body, extrasCobroCombinadoCuota(pFresh, montoObjetivo));
      }
      if (met === 'transferencia') {
        anexarCobroTransferenciaSolo(
          body,
          totalCobroPersona,
          transferenciaSoloDigits,
          devolucionExcesoMetodo,
        );
      } else if (met === 'efectivo') {
        anexarCobroEfectivoRecibido(body, recibeDigits);
      }
      const res = await api<
        PedidoFull & { cobro_completo?: boolean; id_factura_emitida?: number }
      >(`/pedidos/${pedidoId}/facturar`, {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      });
      setPedido(res);
      await notificarEnvioCorreoSiAplica(
        res.id_factura_emitida ??
          res.facturas?.[res.facturas.length - 1]?.id_factura,
      );
      setRecibeDigits('');
      setMixtoTransferenciaDigits('');
      setTransferenciaSoloDigits('');
      if (res.cobro_completo) {
        router.replace('/(app)/mesas');
        return;
      }
      const omitidas = personasOmitidasDesdeCuotas(
        res.cuotas_plan_omitidas ?? [],
        facturasBasePlan,
        planSesionId,
      );
      const avanceTrasCobro =
        contarCobrosPlanHechos(res.facturas ?? [], facturasBasePlan) +
        omitidas.length;
      const planTerminado =
        avanceTrasCobro >= personasPlan || indice >= personasPlan - 1;
      const planQueda = !planTerminado;
      const quedaSaldo = montoSaldoRestantePendiente(
        (res.detalles ?? []).map((d) => ({
          cobrado: d.cobrado,
          id_factura: d.id_factura,
          nota_cocina: d.nota_cocina,
          precio_unitario: d.precio_unitario,
          cantidad: d.cantidad,
        })),
      );
      if (planTerminado) {
        if (quedaSaldo > 0) {
          finalizarPlanCobroTrasSesion(res.facturas?.length ?? 0);
        } else {
          cerrarSesionPlanCobro(res.facturas?.length ?? 0);
          setCantidadesCobro({});
        }
      } else if (!(modoDividir === 'combinado' && planQueda)) {
        setCantidadesCobro({});
        if (modoDividir === 'combinado') {
          cerrarSesionPlanCobro(res.facturas?.length ?? 0);
        }
      }
      await loadPedido();
    } catch (e) {
      await manejarErrorAccion(
        e,
        'registrar el cobro',
        mensajeErrorUsuario(
          e,
          'Comprueba la conexión con el PC del restaurante.',
        ),
      );
      await loadPedido();
    } finally {
      setBusy(false);
    }
  }

  function confirmarCobroPersonaActiva() {
    if (!metodoPersonaActiva) {
      scrollToCobroMetodo('plan');
      return;
    }
    void (async () => {
      if (!(await validarCorreoClienteSiAplica())) return;
      await cobrarPersonaPlan(personaActivaCobro);
    })();
  }

  async function omitirPersonaPlan() {
    if (!cobroPorPlan || busy || planSesionCompleta) return;
    const indice = avancePlanCobro;
    if (indice < 0 || indice >= personasPlan) return;
    const monto = planMontos[indice] ?? 0;
    if (monto <= 0) {
      await showNotice(
        'Plan de cobro',
        'Esta persona no tiene cuota asignada.',
        'warning',
      );
      return;
    }
    const esUltimaPersona = indice >= personasPlan - 1;
    const ok = await confirmAppDialog(
      'Dejar cuota pendiente',
      esUltimaPersona
        ? `La persona ${indice + 1} (última) no paga ${formatCOP(monto)} ahora. Quedará como «Saldo pendiente» para cobrarlo después (sin partir platos ni liberar la mesa).\n\n¿Registrar omisión?`
        : `La persona ${indice + 1} no paga ${formatCOP(monto)} ahora. Se registrará en «Saldo pendiente» (sin partir platos).\n\n¿Continuar con la siguiente persona?`,
      'warning',
    );
    if (!ok) return;

    setBusy(true);
    try {
      const pFresh = pedido;
      const bodyOmitir: Record<string, unknown> = {
        persona_plan_indice: indice + 1,
        monto_persona_plan: monto,
        total_personas_plan: personasPlan,
        facturas_base_plan: facturasBasePlan,
        plan_sesion_id: planSesionId > 0 ? planSesionId : Date.now(),
        plan_base_total:
          planBaseTotal > 0
            ? planBaseTotal
            : montoSaldoPendiente || totalPendienteCompleto,
        plan_personas_sobre_total: modoDividir === 'personas',
        plan_combinado_sobre_seleccion: modoDividir === 'combinado',
      };
      if (modoDividir === 'combinado' && pFresh) {
        bodyOmitir.detalles_seleccion_referencia =
          referenciaCombinadoParaCobro(pFresh);
      }
      const res = await api<PedidoFull>(`/pedidos/${pedidoId}/plan/omitir-cuota`, {
        method: 'POST',
        token,
        body: JSON.stringify(bodyOmitir),
      });
      setPedido(res);
      setRecibeDigits('');
      setMixtoTransferenciaDigits('');
      setMetodosPlan((prev) => {
        const next = [...prev];
        next[indice] = null;
        return next;
      });

      const omitidas = personasOmitidasDesdeCuotas(
        res.cuotas_plan_omitidas ?? [],
        facturasBasePlan,
        planSesionId,
      );
      const avanceTrasOmitir =
        contarCobrosPlanHechos(res.facturas ?? [], facturasBasePlan) +
        omitidas.length;
      // La última persona siempre cierra la sesión de plan.
      const planTerminado =
        esUltimaPersona || avanceTrasOmitir >= personasPlan;

      const montoSaldo = montoSaldoRestantePendiente(
        (res.detalles ?? []).map((d) => ({
          cobrado: d.cobrado,
          id_factura: d.id_factura,
          nota_cocina: d.nota_cocina,
          precio_unitario: d.precio_unitario,
          cantidad: d.cantidad,
        })),
      );

      if (planTerminado) {
        finalizarPlanCobroTrasSesion(res.facturas?.length ?? 0);
      }

      await loadPedido();
      await showNotice(
        'Saldo pendiente',
        planTerminado
          ? montoSaldo > 0
            ? `Persona ${indice + 1}: ${formatCOP(monto)} quedó en «Saldo pendiente» (${formatCOP(montoSaldo)}). La mesa sigue ocupada; puedes cobrarlo o dividirlo de nuevo.`
            : `Persona ${indice + 1} omitida. No quedó saldo por cobrar.`
          : `Persona ${indice + 1}: ${formatCOP(monto)} quedó pendiente. Continúa con la siguiente persona.`,
        'info',
      );
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'Cuota pendiente',
        message: mensajeErrorUsuario(
          e,
          'No se pudo registrar la cuota pendiente.',
        ),
      });
      await loadPedido();
    } finally {
      setBusy(false);
    }
  }

  async function confirmarCobroEstandar() {
    if (!(await validarCorreoClienteSiAplica())) return;
    if (!metodo) {
      scrollToCobroMetodo('estandar');
      return;
    }
    if (metodo === 'mixto') {
      await ejecutarCobroMixto({
        totalReferencia: totalCobrar,
        transferenciaReal: parseCOPDigits(mixtoTransferenciaEstandarDigits),
        recibeDigits,
      });
      return;
    }
    await cobrar();
  }

  async function cobrar() {
    if (!online) {
      await showNotice(
        'Sin conexión',
        'No se puede cobrar sin conexión al servidor del restaurante.',
        'warning',
      );
      return;
    }
    if (metodo === 'mixto') {
      await confirmarCobroEstandar();
      return;
    }
    if (!metodo) {
      scrollToCobroMetodo('estandar');
      return;
    }
    if (solicitudesCobro.length === 0) {
      await showNotice(
        'Dividir cuenta',
        dividirCuenta
          ? 'Indica al menos una unidad para cobrar en esta tanda.'
          : 'No hay ítems pendientes de cobro.',
        'warning',
      );
      return;
    }
    if (!descuentosValidos || totalCobrar < 0) {
      await showNotice(
        'Descuentos',
        'La suma de descuentos no puede superar el subtotal de ítems.',
        'warning',
      );
      return;
    }
    if (metodo === 'efectivo') {
      if (
        await avisarSiFaltanObligatorios(
          [{ etiqueta: 'Cliente paga con', valor: recibeDigits }],
          showNotice,
        )
      ) {
        return;
      }
      if (recibidoNum < totalCobrar) {
        await showNotice(
          'Cobro',
          'El monto recibido debe cubrir el total.',
          'info',
        );
        return;
      }
    }
    if (
      metodo === 'transferencia' &&
      !puedeConfirmarCobroTransferencia(
        totalCobrar,
        montoTransferenciaSolo,
        devolucionExcesoMetodo,
      )
    ) {
      await showNotice(
        'Transferencia',
        textoResumenCobroTransferencia(
          totalCobrar,
          montoTransferenciaSolo,
          devolucionExcesoMetodo,
        ),
        'warning',
      );
      return;
    }
    setBusy(true);
    try {
      const pFresh = await loadPedidoFresh();
      const solActualizadas = solicitudesCobroParaPedido(pFresh, {
        dividirCuenta,
        modoDividir,
        cantidadesCobro,
      });
      if (solActualizadas.length === 0) {
        await showNotice(
          'Cobro',
          'No quedan ítems pendientes de cobro.',
          'warning',
        );
        return;
      }

      const body: Record<string, unknown> = {
        metodo_pago: metodo,
        imprimir_factura: imprimirFactura,
        factura_con_copia: imprimirFactura && facturaConCopia,
        detalles_cobro: solActualizadas,
      };
      if (metodo === 'transferencia') {
        anexarCobroTransferenciaSolo(
          body,
          totalCobrar,
          transferenciaSoloDigits,
          devolucionExcesoMetodo,
        );
      } else if (metodo === 'efectivo') {
        anexarCobroEfectivoRecibido(body, recibeDigits);
      }
      const res = await api<{
        cobro_completo?: boolean;
        id_factura_emitida?: number;
        factura_con_copia?: boolean;
        impresion_factura?: {
          impreso: boolean;
          omitido?: boolean;
          en_cola?: boolean;
          error?: string;
          destino?: string;
          codigo_error?: string;
        };
        facturas?: { id_factura: number }[];
      }>(`/pedidos/${pedidoId}/facturar`, {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      });
      await notificarEnvioCorreoSiAplica(
        res.id_factura_emitida ??
          res.facturas?.[res.facturas.length - 1]?.id_factura,
      );
      const imp = res.impresion_factura;
      const quedaPendiente = res.cobro_completo === false;

      const continuarTrasCobro = async () => {
      if (quedaPendiente) {
        setRecibeDigits('');
        setCantidadesCobro({});
        await loadPedido();
      } else {
          router.replace('/(app)/mesas');
        }
      };

      if (imp && alertarSiSinPapel(imp)) {
        await showAppDialog({
          title: quedaPendiente ? 'Cobro parcial registrado' : 'Cobro registrado',
          message:
            'Sin papel en la impresora. El cobro quedó guardado; reintenta la impresión cuando cambies el rollo.',
          variant: 'warning',
          buttons: [
            {
              text: quedaPendiente ? 'Continuar' : 'Ir a mesas',
              style: 'cancel',
              onPress: continuarTrasCobro,
            },
            ...(permMesero.reimprimir_factura
              ? [
                  {
                    text: 'Reintentar impresión',
                    style: 'primary' as const,
                    onPress: () => reimprimirFacturaCobrada(),
                  },
                ]
              : []),
          ],
        });
        return;
      }

      if (imp?.omitido || !imprimirFactura) {
        await showNotice(
          quedaPendiente ? 'Cobro parcial registrado' : 'Cobro registrado',
          'El pago quedó guardado sin imprimir factura.',
          'success',
        );
      } else if (imp?.en_cola) {
        await showNotice(
          quedaPendiente ? 'Cobro parcial registrado' : 'Cobro registrado',
          'El pago quedó guardado. La factura se imprime en cola.',
          'success',
        );
      } else if (imp?.impreso) {
        const copiaMsg = res.factura_con_copia
          ? ' (copia negocio y copia cliente)'
          : '';
        await showNotice(
          quedaPendiente ? 'Cobro parcial registrado' : 'Cobro registrado',
          `Factura impresa${copiaMsg} (${imp.destino ?? 'impresora'}).`,
          'success',
        );
      } else if (imp?.error) {
        await showAppDialog({
          title: quedaPendiente ? 'Cobro parcial (sin imprimir)' : 'Cobro registrado (sin imprimir)',
          message: mensajeImpresionFallidaTrasAccion(
            imp,
            'El cobro quedó guardado.',
          ),
          variant: 'warning',
          buttons: [
            {
              text: quedaPendiente ? 'Continuar' : 'Ir a mesas',
              style: 'cancel',
              onPress: continuarTrasCobro,
            },
            ...(permMesero.reimprimir_factura
              ? [
                  {
                    text: 'Reintentar impresión',
                    style: 'primary' as const,
                    onPress: () => reimprimirFacturaCobrada(),
                  },
                ]
              : []),
          ],
        });
        return;
      } else {
        await showNotice(
          quedaPendiente ? 'Cobro parcial registrado' : 'Cobro registrado',
          'El pago quedó guardado correctamente.',
          'success',
        );
      }

      if (res.cobro_completo) {
        router.replace('/(app)/mesas');
        return;
      }
      setRecibeDigits('');
      setCantidadesCobro({});
      await loadPedido();
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'No se registró el cobro',
        message: mensajeErrorUsuario(
          e,
          'Revisa el método de pago e intenta de nuevo. Comprueba la conexión con el PC.',
        ),
      });
    } finally {
      setBusy(false);
    }
  }

  async function ejecutarCierreAnulandoPendiente() {
    const motivo = motivoCierreAnulacion.trim();
    if (motivo.length < 3) {
      await showNotice(
        'Motivo requerido',
        'Indica por qué se anula lo pendiente (mínimo 3 caracteres).',
        'warning',
      );
      return;
    }
    const ok = await confirmAppDialog(
      'Cerrar mesa — anular pendiente',
      `Se conservan los cobros ya registrados y se eliminan ${pedido?.cobro_pendiente?.items ?? detallesPendientes.length} ítem(s) pendientes. La mesa quedará libre. ¿Continuar?`,
    );
    if (!ok) return;
    setBusy(true);
    try {
      await api(`/pedidos/${pedidoId}/cerrar-anulando-pendiente`, {
        method: 'POST',
        token,
        body: JSON.stringify({ motivo }),
      });
      setShowCierreAnulacionModal(false);
      setMotivoCierreAnulacion('');
      await showNotice(
        'Mesa cerrada',
        'Lo pendiente fue anulado. Los cobros parciales se mantienen en caja.',
        'success',
      );
      router.replace('/(app)/mesas');
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'No se pudo cerrar',
        message: 'Revisa el permiso y el estado del pedido.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function ejecutarRevertirTandaCobro() {
    const idFactura = revertirTandaIdFactura;
    if (idFactura == null) return;
    const motivo = motivoRevertirTanda.trim();
    if (motivo.length < 3) {
      await showNotice(
        'Motivo requerido',
        'Indica por qué se anula esta tanda (mínimo 3 caracteres).',
        'warning',
      );
      return;
    }
    const ok = await confirmAppDialog(
      'Revertir tanda de cobro',
      'Se anula solo este cobro (si es mixto, efectivo y transferencia). El resto de tandas se conservan y los ítems vuelven a pendientes.',
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await api<{
        id_pedido: number;
        facturas_eliminadas: number[];
        quedan_cobros: boolean;
        estado: string;
        pedido?: PedidoFull;
      }>(`/pedidos/${pedidoId}/revertir-tanda-cobro`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          id_factura: idFactura,
          confirmar: 'REVERTIR',
          motivo,
        }),
      });
      setRevertirTandaIdFactura(null);
      setMotivoRevertirTanda('');
      if (res.pedido) {
        setPedido(res.pedido);
      }
      await loadPedido();
      await showNotice(
        'Tanda revertida',
        res.quedan_cobros
          ? `Se anularon ${res.facturas_eliminadas.length} factura(s). El saldo pendiente se recalculó; puedes cobrar por platos o personas.`
          : `Se anularon ${res.facturas_eliminadas.length} factura(s). El pedido quedó sin cobros.`,
        'success',
      );
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'No se pudo revertir',
        message: 'Solo admin puede anular una tanda. Revisa el estado del pedido.',
      });
    } finally {
      setBusy(false);
    }
  }

  const mostrarCierreAnulacion =
    cobrosParciales && hayPendientes && permMesero.puede_cerrar_anulando;

  if (loadError && !pedido) {
    return (
      <RouteRecoveryScreen
        title="Pedido no disponible"
        message={loadError}
        buttonLabel="Volver a mesas"
      />
    );
  }

  if (loading || !pedido) {
    return <ScreenLoading />;
  }

  return (
    <View style={styles.screenRoot}>
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={[
        formStyles.pageScrollContent,
        { paddingBottom: scrollBottomPad },
      ]}
    >
      <ScreenHeader
        eyebrow="Factura"
        title={`Cobrar pedido #${pedido.id_pedido}`}
      />
      {!online && puedeCobrar ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            Sin conexión al servidor. No se puede cobrar hasta recuperar la red.
          </Text>
        </View>
      ) : null}
      <RestaurantLogo compact variant="factura" />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Detalle</Text>

        {modoSaldoRestante ? (
          <View style={styles.parcialBanner}>
            <Text style={styles.parcialBannerTitle}>
              {NOMBRE_DISPLAY_SALDO_PENDIENTE}: {formatCOP(montoSaldoPendiente)}
            </Text>
            {notaSaldoPendienteUi ? (
              <Text style={styles.parcialBannerText}>{notaSaldoPendienteUi}</Text>
            ) : null}
            <Text style={styles.parcialBannerText}>
              {necesitaReconciliarSaldoAPlatos
                ? 'Organizando el saldo en platos del menú…'
                : planRepartoEnCurso
                  ? 'Los platos no se parten. Cada persona paga su cuota del reparto.'
                  : saldoEsFragmento
                    ? 'Marca con +/− el saldo y/o los platos liberados (platos o combinado), o reparte el saldo por personas.'
                    : 'Marca el saldo pendiente con +/− para cobrarlo por platos o combinado, o usa por personas para repartirlo.'}
            </Text>
          </View>
        ) : null}

        {cobrosParciales ? (
          <View style={styles.parcialBanner}>
            <Text style={styles.parcialBannerTitle}>
              Cobros parciales: {cobrosVistaParciales.length}
            </Text>
            <Text style={styles.parcialBannerText}>
              {pedido.cobro_pendiente
                ? `Quedan ${pedido.cobro_pendiente.items} ítem(s) por ${formatCOP(pedido.cobro_pendiente.subtotal)}`
                : `Quedan ${detallesPendientes.length} ítem(s) pendientes`}
            </Text>
            {cobrosVistaParciales.map((g, i) => {
              const idFacturaTanda =
                g.tipo === 'mixto'
                  ? Math.min(...g.cobros.map((f) => f.id_factura))
                  : g.cobro.id_factura;
              const linea =
                g.tipo === 'mixto' ? (
                  <View style={styles.parcialCobroMixto}>
                    <Text style={styles.parcialCobroLine}>
                      Cobro {i + 1}:{' '}
                      {formatCOP(g.cobros.reduce((s, f) => s + f.total, 0))} ·{' '}
                      {METODO_PAGO_LABEL.mixto}
                    </Text>
                    <Text style={styles.parcialCobroMixtoDetalle}>
                      {cobrosResumenMixto(g.cobros)
                        .map(
                          (c) =>
                            `${METODO_PAGO_LABEL[c.metodo_pago] ?? c.metodo_pago} ${formatCOP(c.total)}`,
                        )
                        .join(' · ')}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.parcialCobroLine}>
                    Cobro {i + 1}: {formatCOP(g.cobro.total)}
                    {g.cobro.metodo_pago
                      ? ` · ${METODO_PAGO_LABEL[g.cobro.metodo_pago as MetodoPago] ?? g.cobro.metodo_pago}`
                      : ''}
                  </Text>
                );
              return (
                <View
                  key={g.tipo === 'mixto' ? g.key : g.cobro.id_factura}
                  style={styles.parcialCobroRow}
                >
                  <View style={{ flex: 1 }}>{linea}</View>
                  {esAdmin ? (
                    <Pressable
                      disabled={busy}
                      onPress={() => {
                        setRevertirTandaIdFactura(idFacturaTanda);
                        setMotivoRevertirTanda('');
                      }}
                      style={styles.parcialRevertirBtn}
                    >
                      <Text style={styles.parcialRevertirBtnText}>Revertir</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
            {mostrarCierreAnulacion ? (
              <CtaButton
                icon="close-circle-outline"
                title="Cerrar mesa — anular pendiente"
                subtitle="Conserva los cobros hechos; libera la mesa si algo no llegó"
                onPress={() => setShowCierreAnulacionModal(true)}
                busy={busy}
                variant="secondary"
                style={styles.cierreAnulacionBtn}
              />
            ) : null}
          </View>
        ) : null}

        {hayPendientes && esParaLlevar && pedido ? (
          <EmpaqueParaLlevarAjuste
            idPedido={pedido.id_pedido}
            detalles={detallesEmpaqueUi}
            esParaLlevar={esParaLlevar}
            token={token}
            onRefresh={async () => {
              await loadPedido();
            }}
            puedeEditar={permMesero.editar_cantidades}
          />
        ) : null}

        {hayPendientes ? (
          <View style={styles.discHead}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.discLabel}>Dividir cuenta</Text>
              <Text style={styles.adminHint}>
                Activa para cobrar en varias tandas con distintos métodos de pago.
              </Text>
            </View>
            <Switch
              value={dividirCuenta}
              onValueChange={(v) => {
                setDividirCuenta(v);
                if (!v) {
                  setCantidadesCobro({});
                  setModoDividir('platos');
                }
              }}
              trackColor={{ false: colors.borderInput, true: colors.successBorder }}
              thumbColor={dividirCuenta ? colors.primary : colors.borderLight}
              disabled={busy}
            />
          </View>
        ) : null}

        {dividirCuenta ? (
          <View style={styles.subsectionGap}>
            <ModoDividirSelector
              value={modoDividir}
              onChange={(m) => {
                setModoDividir(m);
                setCantidadesCobro({});
                // Nueva sesión al cambiar de modo (no heredar cobros/omisiones viejos).
                if (m === 'personas' || m === 'combinado') {
                  setFacturasBasePlan(pedido?.facturas?.length ?? 0);
                  setPlanSesionId(Date.now());
                  setMetodosPlan(Array.from({ length: personasPlan }, () => null));
                  setSeleccionReferenciaCombinado([]);
                  planCombinadoFirmaRef.current = null;
                }
              }}
              disabled={busy}
            />
          </View>
        ) : null}

        {lineasFacturaAgrupadas.map((g) => {
          const cobrado = Boolean(g.cobrado);
          // Abonos y cuotas internas no se marcan; el saldo pendiente sí (platos/combinado).
          const esLineaNoSeleccionable = g.ids_detalle.some((id) => {
            const d = pedido.detalles.find((x) => x.id_detalle === id);
            if (!d) return false;
            if (esNotaSaldoRestantePendiente(d.nota_cocina)) return false;
            return (
              esNotaSaldoAbono(d.nota_cocina) ||
              Boolean(d.es_cuota_pendiente_reparto)
            );
          });
          const seleccionable =
            usaSelectorPlatos &&
            !cobrado &&
            hayPendientes &&
            !esLineaNoSeleccionable;
          const sel = cantidadSeleccionadaGrupo(g);
          const max = maxPendienteGrupo(g);
          const incluidoHijo =
            dividirCuenta &&
            !cobrado &&
            g.ids_detalle.some((idPadre) =>
              pedido.detalles.some(
                (h) =>
                  h.id_detalle_padre === idPadre &&
                  !h.cobrado &&
                  (cantidadesCobro[idPadre] ?? 0) > 0,
              ),
            );
          const empaquesGrupo = pedido.detalles.filter(
            (h) =>
              h.id_detalle_padre != null &&
              g.ids_detalle.includes(h.id_detalle_padre),
          );
          const empaqueCantidad = empaquesGrupo.reduce(
            (sum, h) => sum + h.cantidad,
            0,
          );
          const empaqueSubtotal = empaquesGrupo.reduce(
            (sum, h) => sum + h.subtotal_linea,
            0,
          );
          const faltanteGrupo = g.ids_detalle.reduce((sum, idPadre) => {
            const d = pedido.detalles.find((x) => x.id_detalle === idPadre);
            if (!d) return sum;
            return (
              sum +
              empaqueFaltanteEnDetallePadre(
                {
                  id_detalle: d.id_detalle,
                  id_detalle_padre: d.id_detalle_padre,
                  cantidad: d.cantidad,
                  es_empacable: d.es_empacable,
                  es_plato_principal: d.es_plato_principal,
                  categoria_nombre: d.categoria_nombre,
                },
                detallesEmpaqueUi,
              )
            );
          }, 0);

          return (
            <View key={g.ids_detalle.join('-')}>
              <View
                style={[
                  styles.line,
                  cobrado && styles.lineCobrado,
                ]}
              >
                {seleccionable ? (
                  <View style={styles.qtyPickCol}>
                    <View style={styles.qtyRow}>
                      <IconTooltipButton
                        icon="remove-circle-outline"
                        label="Quitar una unidad de esta tanda"
                        size={22}
                        onPress={() => cambiarCantidadGrupo(g, -1)}
                        disabled={busy || sel <= 0}
                      />
                      <Text style={styles.qtyPickVal}>
                        {sel}/{max}
                      </Text>
                      <IconTooltipButton
                        icon="add-circle-outline"
                        label="Agregar una unidad a esta tanda"
                        size={22}
                        onPress={() => cambiarCantidadGrupo(g, 1)}
                        disabled={busy || sel >= max}
                      />
                    </View>
                  </View>
                ) : null}
                <View style={styles.lineBody}>
                  <Text
                    style={[
                      styles.lineName,
                      cobrado && styles.lineNameCobrado,
                      incluidoHijo && sel === 0 && styles.lineNameSeleccionado,
                    ]}
                  >
                    {g.cantidad}× {g.nombre_producto}
                    {cobrado ? ' · cobrado' : ''}
                    {seleccionable && sel > 0 ? ` · ${sel} en esta tanda` : ''}
                  </Text>
                </View>
                <Text
                  style={[styles.price, cobrado && styles.lineNameCobrado]}
                >
                  {formatCOP(g.subtotal_linea)}
                </Text>
              </View>
              {empaqueCantidad > 0 ? (
                <View style={[styles.line, styles.lineHijo, cobrado && styles.lineCobrado]}>
                  <View style={styles.checkPlaceholder} />
                  <View style={[styles.lineBody, styles.empaqueSubRow]}>
                    <Text
                      style={[
                        styles.lineName,
                        cobrado && styles.lineNameCobrado,
                        incluidoHijo && styles.lineNameSeleccionado,
                      ]}
                    >
                      ↳ {empaqueCantidad > 1 ? `${empaqueCantidad}× ` : ''}
                      empaque para llevar
                      {faltanteGrupo > 0
                        ? ` · ${faltanteGrupo} plato${faltanteGrupo === 1 ? '' : 's'} sin empaque`
                        : ''}
                      {incluidoHijo && sel === 0 ? ' · incluido' : ''}
                    </Text>
                    {esParaLlevar &&
                    !cobrado &&
                    permMesero.editar_cantidades ? (
                      <IconTooltipButton
                        icon="remove-circle-outline"
                        label="Quitar un empaque"
                        size={20}
                        onPress={async () => {
                          if (busy) return;
                          setBusy(true);
                          try {
                            await reducirEmpaqueDetalle(
                              empaquesGrupo.map((d) => ({
                                id_detalle: d.id_detalle,
                                id_detalle_padre: d.id_detalle_padre,
                                cantidad: d.cantidad,
                                es_empacable: d.es_empacable,
                                es_plato_principal: d.es_plato_principal,
                                categoria_nombre: d.categoria_nombre,
                              })),
                              token,
                            );
                            await loadPedido();
                          } catch (e) {
                            await manejarErrorAccion(e, 'quitar empaque');
                          } finally {
                            setBusy(false);
                          }
                        }}
                        disabled={busy}
                      />
                    ) : null}
                  </View>
                  <Text
                    style={[styles.price, cobrado && styles.lineNameCobrado]}
                  >
                    {formatCOP(empaqueSubtotal)}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}

        {usaSelectorPlatos &&
        hayPendientes &&
        (modoDividir === 'combinado'
          ? !haySeleccionCombinado
          : unidadesTanda === 0) ? (
          <Text style={styles.seleccionHint}>
            {modoDividir === 'combinado'
              ? 'Marca con +/− los platos a repartir entre las personas.'
              : 'Usa +/− en cada ítem para indicar cuántas unidades cobra esta tanda.'}
          </Text>
        ) : null}
      </View>

      {resumenTandaActual ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{resumenTandaActual.titulo}</Text>
          {'esCuotaSobreTotal' in resumenTandaActual &&
          resumenTandaActual.esCuotaSobreTotal ? (
            <>
              <Text style={styles.adminHint}>
                Cuota {personaActivaCobro + 1} de {personasPlan} sobre el total de
                la cuenta ({formatCOP(resumenTandaActual.totalCuenta ?? 0)}). No se
                asignan platos a cada persona; solo se cobra su parte.
              </Text>
              <Text style={styles.totalTanda}>
                Cuota a cobrar: {formatCOP(resumenTandaActual.total)}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.adminHint}>
                Lo que se incluye en el cobro de esta tanda (lo verá el cliente en la
                factura impresa).
              </Text>
              {resumenTandaActual.lineas.map((l, i) => (
                <View
                  key={`tanda-${l.id_detalle ?? i}-${l.cantidad}-${l.nombre_producto}`}
                  style={styles.line}
                >
                  <Text style={styles.lineName}>
                    {l.cantidad}× {l.nombre_producto}
                  </Text>
                  <Text style={styles.price}>{formatCOP(l.subtotal_linea)}</Text>
                </View>
              ))}
              <Text style={styles.totalTanda}>
                Total tanda: {formatCOP(resumenTandaActual.total)}
              </Text>
            </>
          )}
        </View>
      ) : null}

      {cobroPorPlan ? (
        <View style={styles.card}>
          <PlanCobroPersonas
            variant={
              modoDividir === 'personas' || modoDividir === 'combinado'
                ? 'igual'
                : 'asignacion'
            }
            totalPendiente={
              modoDividir === 'combinado'
                ? planBaseTotal > 0
                  ? planBaseTotal
                  : totalSeleccionCombinado
                : planBaseTotal > 0
                  ? planBaseTotal
                  : totalPendienteCompleto
            }
            personas={personasPlan}
            onPersonasChange={cambiarPersonasPlan}
            planMontos={montosPlanUi}
            metodos={metodosPlan}
            onMetodoChange={(i, m) => {
              setMetodosPlan((prev) => {
                const next = [...prev];
                next[i] = m;
                return next;
              });
            }}
            cobrosHechos={cobrosPlanHechos}
            avancePlan={avancePlanCobro}
            personasOmitidas={personasOmitidasPlan}
            saldoRestantePlan={saldoPlanReparto.saldoRestante}
            saldoPendienteOmitidos={saldoPlanReparto.saldoOmitido}
            facturas={facturasResumenPlan.filter(
              (f): f is NonNullable<typeof f> => f != null,
            )}
            busy={busy}
            sugerenciaComensales={pedido.num_comensales}
            onCobrarPersona={(i) => void cobrarPersonaPlan(i)}
            repartoDesdeItemsSeleccionados={modoDividir === 'combinado'}
            cobroEnTarjeta={false}
          />
        </View>
      ) : null}

      {etiquetasPedidoUi.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Promociones del pedido</Text>
          <Text style={styles.adminHint}>
            Activa las etiquetas que correspondan a este pedido antes de cobrar.
          </Text>
          {etiquetasPedidoUi.map((et) => (
            <View key={et.id} style={styles.discHead}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.discLabel}>{et.etiqueta}</Text>
                {et.descripcion ? (
                  <Text style={styles.adminHint}>{et.descripcion}</Text>
                ) : null}
              </View>
              <Switch
                value={etiquetasActivasPedido.has(et.id)}
                onValueChange={(v) => void actualizarEtiquetasPromocion(et.id, v)}
                disabled={marcandoEtiquetas || busy}
                trackColor={{ false: colors.borderInput, true: colors.successBorder }}
                thumbColor={
                  etiquetasActivasPedido.has(et.id) ? colors.primary : colors.borderLight
                }
              />
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.card, styles.totalCard]}>
        <Text style={styles.sectionTitle}>{tituloTotalCard}</Text>
        {dividirCuenta && modoDividir !== 'personas' && idsCobroActuales.length > 0 ? (
          <Text style={styles.tandaHint}>
            {unidadesTanda} unidad(es) en esta tanda
          </Text>
        ) : null}
        <Text style={styles.subtotalLine}>
          Subtotal ítems: {formatCOP(subtotalItems)}
        </Text>
        {desglosePromociones.map((d) => (
          <Text key={d.id} style={styles.descLine}>
            − {d.etiqueta}: {formatCOP(d.monto)}
          </Text>
        ))}
        {desglosePromociones.length === 0 && montoDescPromo > 0 ? (
          <Text style={styles.descLine}>
            − Promociones: {formatCOP(montoDescPromo)}
          </Text>
        ) : null}
        <Text style={styles.total}>{formatCOP(totalResumenVisible)}</Text>
        {!descuentosValidos ? (
          <Text style={styles.errorHint}>
            Los descuentos superan el subtotal; revisa la configuración.
          </Text>
        ) : null}
      </View>

      {puedePrecuenta ? (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pre-cuenta (antes de cobrar)</Text>
        <Text style={styles.adminHint}>
          Imprime el detalle para que el cliente revise. No registra pago. Puedes
          desactivar la copia o imprimir solo una vez.
        </Text>

        <View style={styles.printRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.printLabel}>Con copia</Text>
            <Text style={styles.printHint}>
              Copia negocio (restaurante) y copia cliente.
            </Text>
          </View>
          <View style={styles.switchWrap}>
            <Switch
              value={precuentaConCopia}
              onValueChange={setPrecuentaConCopia}
              trackColor={{ false: colors.borderInput, true: colors.successBorder }}
              thumbColor={precuentaConCopia ? colors.primary : colors.borderLight}
              disabled={busy || imprimiendoPrecuenta}
            />
          </View>
        </View>

        <ActionIconBar
          style={styles.precuentaActions}
          actions={[
            {
              key: 'precuenta',
              icon: imprimiendoPrecuenta
                ? 'hourglass-outline'
                : 'print-outline',
              label: imprimiendoPrecuenta
                ? 'Imprimiendo…'
                : dividirCuenta && unidadesTanda === 0
                  ? 'Selecciona ítems para imprimir'
                  : precuentaConCopia
                    ? 'Imprimir pre-cuenta (2 copias)'
                    : 'Imprimir pre-cuenta',
              variant: 'secondary',
              disabled: deshabilitarPrecuenta,
              onPress: imprimirPrecuenta,
            },
          ]}
        />
      </View>
      ) : null}

      {usaCobroEstandar && puedeCobrar ? (
        <View
          style={styles.card}
          onLayout={(e) => {
            cobroEstandarY.current = e.nativeEvent.layout.y;
          }}
        >
          {dividirCuenta ? (
            <Text style={[styles.adminHint, styles.subsectionGap]}>
              Elige método de pago y confirma esta tanda de ítems.
            </Text>
          ) : null}

          <CobroMontoPanel
            title={dividirCuenta ? 'Cobro de esta tanda' : 'Cobro'}
            monto={totalCobrar}
          >
            <MetodoPagoSelector
              metodo={metodo}
              onMetodoChange={(m) => {
                setMetodo(m);
                setRecibeDigits('');
                setMixtoTransferenciaEstandarDigits('');
                setTransferenciaSoloDigits('');
                setDevolucionExcesoMetodo(null);
              }}
              disabled={busy}
              pendiente={!metodo}
            />

            {metodo === 'mixto' ? (
              <MixtoPagoFields
                total={totalCobrar}
                transferenciaDigits={mixtoTransferenciaEstandarDigits}
                efectivoDigits={recibeDigits}
                onTransferenciaChange={cambiarMixtoTransferenciaEstandar}
                onEfectivoChange={cambiarMixtoRecibeEstandar}
                devolucionExcesoMetodo={devolucionExcesoMetodo}
                onDevolucionExcesoMetodoChange={setDevolucionExcesoMetodo}
                busy={busy}
                moneyInputStyle={moneyField}
                hintStyle={styles.cobroFieldHint}
                fieldLabelStyle={styles.cobroFieldLabel}
                inputStyle={styles.input}
              />
            ) : null}

            {metodo === 'transferencia' ? (
              <TransferenciaSoloFields
                total={totalCobrar}
                transferenciaDigits={transferenciaSoloDigits}
                onTransferenciaChange={cambiarTransferenciaSolo}
                devolucionExcesoMetodo={devolucionExcesoMetodo}
                onDevolucionExcesoMetodoChange={setDevolucionExcesoMetodo}
                busy={busy}
                moneyInputStyle={moneyField}
                hintStyle={styles.cobroFieldHint}
                fieldLabelStyle={styles.cobroFieldLabel}
                inputStyle={styles.input}
              />
            ) : null}

            {metodo === 'efectivo' ? (
              <View style={styles.efectivoBox}>
                <Text style={styles.cobroFieldLabel}>Cliente paga con</Text>
                <MoneyTextInput
                  style={[styles.input, moneyField]}
                  placeholderAmount={50000}
                  digits={recibeDigits}
                  onChangeDigits={setRecibeDigits}
                />
                <PagoExactoButton
                  onPress={() => setRecibeDigits(digitsFromMonto(totalCobrar))}
                  disabled={busy || totalCobrar <= 0}
                  style={styles.pagoExactoBtn}
                />
                {recibeDigits !== '' && !faltaEfectivo && vuelto !== null ? (
                  <Text style={styles.vueltoOk}>Vuelto: {formatCOP(vuelto)}</Text>
                ) : null}
                {faltaEfectivo ? (
                  <Text style={styles.vueltoFalta}>
                    Falta {formatCOP(totalCobrar - recibidoNum)} para cubrir el total
                  </Text>
                ) : null}
              </View>
            ) : null}
          </CobroMontoPanel>

          <FacturaImpresionOpciones
            imprimirFactura={imprimirFactura}
            facturaConCopia={facturaConCopia}
            onImprimirChange={setImprimirFactura}
            onCopiaChange={setFacturaConCopia}
            enviarPorCorreo={enviarPorCorreo}
            emailCliente={emailCliente}
            onEnviarPorCorreoChange={setEnviarPorCorreo}
            onEmailClienteChange={setEmailCliente}
            disabled={busy}
          />
        </View>
      ) : cobroPorPlan && puedeCobrar ? (
        <View
          style={styles.card}
          onLayout={(e) => {
            cobroPlanY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>
            {modoDividir === 'combinado' ? 'Cobro combinado' : 'Cobro por persona'}
          </Text>
          <Text style={styles.adminHint}>
            {modoDividir === 'combinado'
              ? 'Cada persona paga su parte del total marcado con +/−.'
              : 'Cada persona paga su cuota sobre el total de la cuenta (reparto igual).'}
          </Text>

          {usaPlanPersonas && planBaseTotal > 0 ? (
            <View style={styles.saldoPlanBanner}>
              <Text style={styles.saldoPlanTitle}>Saldo del reparto</Text>
              <Text style={styles.saldoPlanText}>
                Cobrado {formatCOP(saldoPlanReparto.cobrado)} de{' '}
                {formatCOP(planBaseTotal)} · Restante{' '}
                {formatCOP(saldoPlanReparto.saldoRestante)}
              </Text>
              {saldoPlanReparto.saldoOmitido > 0 ? (
                <Text style={styles.saldoPlanOmitido}>
                  Incluye {formatCOP(saldoPlanReparto.saldoOmitido)} de{' '}
                  {personasOmitidasPlan.length} persona
                  {personasOmitidasPlan.length === 1 ? '' : 's'} que no pagó
                  {personasOmitidasPlan.length === 1 ? '' : 'ron'} (ítem en
                  factura)
                </Text>
              ) : null}
            </View>
          ) : null}

          <CobroPersonaPlanPanel
            personaIndice={personaActivaCobro}
            monto={montoPersonaActiva}
            metodo={metodoPersonaActiva}
            onMetodoChange={setMetodoPersonaActiva}
            mixtoTransferenciaDigits={mixtoTransferenciaDigits}
            onMixtoTransferenciaDigitsChange={cambiarMixtoTransferenciaPlan}
            transferenciaSoloDigits={transferenciaSoloDigits}
            onTransferenciaSoloDigitsChange={cambiarTransferenciaSoloPlan}
            devolucionExcesoMetodo={devolucionExcesoMetodo}
            onDevolucionExcesoMetodoChange={setDevolucionExcesoMetodo}
            recibeDigits={recibeDigits}
            onRecibeDigitsChange={cambiarMixtoRecibePlan}
            recibidoNum={recibidoNum}
            vuelto={vueltoPlan}
            faltaEfectivo={faltaEfectivoPlan}
            busy={busy}
            sinItems={
              modoDividir === 'combinado' &&
              !planCombinadoCongelado &&
              !haySeleccionCombinado
            }
            saldoRestantePlan={saldoPlanReparto.saldoRestante}
            saldoPendienteOmitidos={saldoPlanReparto.saldoOmitido}
            onOmitirPersona={() => void omitirPersonaPlan()}
            mostrarBotonCobro={false}
            moneyInputStyle={moneyField}
          />

          <FacturaImpresionOpciones
            imprimirFactura={imprimirFactura}
            facturaConCopia={facturaConCopia}
            onImprimirChange={setImprimirFactura}
            onCopiaChange={setFacturaConCopia}
            enviarPorCorreo={enviarPorCorreo}
            emailCliente={emailCliente}
            onEnviarPorCorreoChange={setEnviarPorCorreo}
            onEmailClienteChange={setEmailCliente}
            disabled={busy}
          />
        </View>
      ) : null}
    </ScrollView>
    {usaCobroEstandar && puedeCobrar ? (
      <View
        style={[
          styles.stickyPayBar,
          nav.bottomBar && styles.stickyPayBarFlush,
          {
            paddingBottom: nav.bottomBar ? 0 : Math.max(insets.bottom, 10),
            bottom: chromeBottom,
          },
        ]}
      >
        <CtaButton
          icon={busy ? 'hourglass-outline' : PedidoIcon.cobrar}
          title={
            busy
              ? 'Procesando cobro…'
              : dividirCuenta && unidadesTanda === 0
                ? 'Selecciona ítems'
                : 'Confirmar cobro'
          }
          style={nav.bottomBar ? styles.stickyPayCta : undefined}
          subtitle={
            !metodo
              ? 'Elige método de pago arriba'
              : !imprimirFactura
                ? dividirCuenta
                  ? 'Sin imprimir · tanda parcial'
                  : 'Sin imprimir POS'
                : facturaConCopia
                  ? 'Imprime 2 copias'
                  : 'Imprime factura'
          }
          variant="success"
          disabled={deshabilitarCobro}
          busy={busy}
          onPress={() => void confirmarCobroEstandar()}
        />
      </View>
    ) : cobroPorPlan && puedeCobrar ? (
      <View
        style={[
          styles.stickyPayBar,
          nav.bottomBar && styles.stickyPayBarFlush,
          {
            paddingBottom: nav.bottomBar ? 0 : Math.max(insets.bottom, 10),
            bottom: chromeBottom,
          },
        ]}
      >
        <CtaButton
          icon={busy ? 'hourglass-outline' : estadoCobroPlan.icon}
          title={
            busy
              ? 'Procesando cobro…'
              : sinItemsPlanCobro
                ? 'Selecciona ítems'
                : `Confirmar cobro persona ${personaActivaCobro + 1}`
          }
          style={nav.bottomBar ? styles.stickyPayCta : undefined}
          subtitle={
            estadoCobroPlan.sinItems || !metodoPersonaActiva
              ? estadoCobroPlan.sinMetodo
                ? 'Elige método de pago arriba'
                : estadoCobroPlan.subtitleCobro
              : estadoCobroPlan.cobroIncompleto
                ? estadoCobroPlan.subtitleCobro
                : !imprimirFactura
                  ? 'Sin imprimir POS'
                  : facturaConCopia
                    ? 'Imprime 2 copias'
                    : 'Imprime factura'
          }
          variant="success"
          disabled={deshabilitarCobroPlan}
          busy={busy}
          onPress={() => confirmarCobroPersonaActiva()}
        />
      </View>
    ) : null}

      <Modal
        visible={showCierreAnulacionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCierreAnulacionModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => !busy && setShowCierreAnulacionModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Anular lo pendiente y cerrar mesa</Text>
            <Text style={styles.modalHint}>
              Los cobros parciales ya registrados no se modifican. Indica el motivo
              (por ejemplo: platos que no llegaron de cocina).
            </Text>
            <TextInput
              style={[formStyles.input, styles.motivoInput]}
              value={motivoCierreAnulacion}
              onChangeText={setMotivoCierreAnulacion}
              placeholder="Motivo del cierre…"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
              editable={!busy}
            />
            <ActionIconBar
              style={formStyles.modalActionBar}
              actions={[
                {
                  key: 'cancel',
                  icon: AccionIcon.cancelar,
                  label: 'Cancelar',
                  variant: 'secondary',
                  disabled: busy,
                  onPress: () => setShowCierreAnulacionModal(false),
                },
                {
                  key: 'confirm',
                  icon: AccionIcon.guardar,
                  label: busy ? 'Cerrando…' : 'Confirmar cierre',
                  variant: 'primary',
                  disabled: busy,
                  onPress: () => void ejecutarCierreAnulandoPendiente(),
                },
              ]}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={revertirTandaIdFactura != null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!busy) {
            setRevertirTandaIdFactura(null);
            setMotivoRevertirTanda('');
          }
        }}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {
            if (!busy) {
              setRevertirTandaIdFactura(null);
              setMotivoRevertirTanda('');
            }
          }}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Revertir tanda de cobro</Text>
            <Text style={styles.modalHint}>
              Solo se anula este cobro (en mixto, ambas patas). Los ítems vuelven a
              pendientes y puedes cobrarlos de nuevo con otra modalidad o método.
            </Text>
            <TextInput
              style={[formStyles.input, styles.motivoInput]}
              value={motivoRevertirTanda}
              onChangeText={setMotivoRevertirTanda}
              placeholder="Motivo de la reversa…"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
              editable={!busy}
            />
            <ActionIconBar
              style={formStyles.modalActionBar}
              actions={[
                {
                  key: 'cancel',
                  icon: AccionIcon.cancelar,
                  label: 'Cancelar',
                  variant: 'secondary',
                  disabled: busy,
                  onPress: () => {
                    setRevertirTandaIdFactura(null);
                    setMotivoRevertirTanda('');
                  },
                },
                {
                  key: 'confirm',
                  icon: AccionIcon.guardar,
                  label: busy ? 'Revirtiendo…' : 'Revertir tanda',
                  variant: 'primary',
                  disabled: busy,
                  onPress: () => void ejecutarRevertirTandaCobro(),
                },
              ]}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function createFacturaStyles(colors: AppColors) {
  return StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  offlineBanner: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  offlineBannerText: {
    color: colors.warningText,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  stickyPayBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stickyPayBarFlush: {
    paddingHorizontal: 0,
    paddingTop: 0,
    borderTopWidth: 0,
  },
  stickyPayCta: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subtotalLine: {
    fontSize: 15,
    color: colors.offline,
    marginTop: 10,
    fontWeight: '600',
  },
  descLine: {
    fontSize: 14,
    color: colors.danger,
    marginTop: 4,
    fontWeight: '700',
  },
  total: { fontSize: 28, fontWeight: '900', marginTop: 12, color: colors.primary },
  totalTanda: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'right',
  },
  errorHint: {
    marginTop: 8,
    color: colors.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...appShadow('soft'),
  },
  totalCard: {
    borderColor: colors.successBorder,
    backgroundColor: colors.surfaceMuted,
  },
  sectionTitle: { fontWeight: '800', color: colors.text, marginBottom: 8 },
  subsectionTitle: { fontWeight: '800', color: colors.text, fontSize: 15 },
  subsectionGap: { marginTop: 8 },
  adminHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
    lineHeight: 18,
  },
  fieldHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  discRow: { marginBottom: 14 },
  discHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  discLabel: { fontWeight: '800', color: colors.text, fontSize: 16 },
  saveConfigRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qtyPickCol: { marginRight: 8 },
  qtyPickVal: {
    minWidth: 36,
    textAlign: 'center',
    fontWeight: '800',
    color: colors.primary,
    fontSize: 14,
  },
  splitBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.successBorder,
  },
  splitTitle: { fontWeight: '800', color: colors.text, marginBottom: 4 },
  splitInput: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: colors.surface,
    maxWidth: 120,
  },
  splitLine: { fontSize: 14, color: colors.text, marginTop: 4, fontWeight: '600' },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  lineHijo: { paddingLeft: 28 },
  empaqueSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  lineCobrado: { opacity: 0.55 },
  lineBody: { flex: 1, paddingRight: 8 },
  lineName: { color: colors.text, fontWeight: '600' },
  lineNameCobrado: { color: colors.textHint, textDecorationLine: 'line-through' },
  lineNameSeleccionado: { color: colors.primary },
  check: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.borderInput,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  checkMark: { color: colors.primary, fontWeight: '900', fontSize: 16 },
  checkPlaceholder: { width: 28, marginRight: 10 },
  parcialBanner: {
    backgroundColor: colors.secondaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  parcialBannerTitle: { fontWeight: '800', color: colors.warningText, marginBottom: 4 },
  parcialBannerText: { color: colors.warningText, fontSize: 13, fontWeight: '600' },
  saldoPlanBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  saldoPlanTitle: { fontWeight: '800', color: colors.primaryDark, marginBottom: 4 },
  saldoPlanText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  saldoPlanOmitido: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: colors.warningText,
    lineHeight: 18,
  },
  cuotasPendientesSection: {
    backgroundColor: colors.secondaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  cuotasPendientesTitle: {
    fontWeight: '800',
    color: colors.warningText,
    marginBottom: 4,
    fontSize: 15,
  },
  cuotasPendientesHint: {
    fontSize: 12,
    color: colors.warningText,
    marginBottom: 10,
    lineHeight: 17,
    fontWeight: '600',
  },
  cuotaPendienteLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.warningBorder,
  },
  cuotaPendienteName: { flex: 1, fontWeight: '700', color: colors.text, fontSize: 14 },
  cuotaPendienteMonto: { fontWeight: '900', color: colors.warningText, fontSize: 15 },
  cuotaPendienteTotal: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '800',
    color: colors.warningText,
    textAlign: 'right',
  },
  parcialCobroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
  },
  parcialCobroLine: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.warningText,
  },
  parcialCobroMixto: { flex: 1 },
  parcialCobroMixtoDetalle: {
    fontSize: 12,
    color: colors.warningText,
    fontWeight: '600',
    marginLeft: 8,
  },
  parcialRevertirBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warningText,
    backgroundColor: colors.background,
  },
  parcialRevertirBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.warningText,
  },
  cobroFieldHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 10,
    lineHeight: 18,
    textAlign: 'center',
  },
  cobroFieldLabel: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  mixtoAjusteHint: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: colors.successText,
    lineHeight: 18,
    textAlign: 'center',
  },
  pagoExactoBtn: { marginTop: 4, marginBottom: 6, alignSelf: 'center' },
  seleccionHint: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  tandaHint: {
    fontSize: 13,
    color: colors.successText,
    fontWeight: '600',
    marginBottom: 4,
  },
  price: { fontWeight: '800', color: colors.text },
  label: { fontWeight: '800', marginBottom: 10, color: colors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { textTransform: 'capitalize', color: colors.text, fontWeight: '700' },
  chipTextOn: { color: colors.surface },
  efectivoBox: { marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    fontWeight: '700',
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
  },
  vueltoOk: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '900',
    color: colors.mesaLibre,
  },
  vueltoFalta: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
  },
  walletBtnWrap: { marginTop: 14, alignSelf: 'flex-start' },
  printRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
  },
  switchWrap: { paddingTop: 2 },
  printLabel: { fontWeight: '800', color: colors.text, fontSize: 15 },
  printHint: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 16 },
  payActions: { marginTop: 4, paddingTop: 8 },
  precuentaActions: { marginTop: 4 },
  cierreAnulacionBtn: { marginTop: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  modalTitle: { fontWeight: '900', color: colors.text, marginBottom: 8, fontSize: 17 },
  modalHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  motivoInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
});
}
