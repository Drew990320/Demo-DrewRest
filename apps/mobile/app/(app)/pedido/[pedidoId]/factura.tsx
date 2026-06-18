import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../../src/context/AuthContext';
import { ActionIconBar } from '../../../../src/components/ActionIconBar';
import { IconTooltipButton } from '../../../../src/components/IconTooltipButton';
import { MoneyTextInput } from '../../../../src/components/MoneyTextInput';
import { api } from '../../../../src/lib/api';
import { AccionIcon } from '../../../../src/lib/app-icons';
import { alertarSiSinPapel } from '../../../../src/lib/alarma-impresora';
import { showAppDialog, showNotice } from '../../../../src/lib/app-dialog';
import { digitsFromMonto, parseCOPDigits } from '../../../../src/lib/cop-input';
import {
  avisarSiFaltanObligatorios,
  avisarSiMontoCOPInvalido,
} from '../../../../src/lib/form-validation';
import { UMBRAL_SUBTOTAL_OTROS_COP, calcularDescuentosPedido } from '../../../../src/lib/descuentos-pedido';
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
  agruparLineasFactura,
  type LineaFacturaGrupo,
} from '../../../../src/lib/factura-lineas-group';
import { repartirMontoEnCop } from '../../../../src/lib/repartir-monto-cop';
import { RouteRecoveryScreen } from '../../../../src/components/RouteRecoveryScreen';
import { useFormFieldStyle } from '../../../../src/hooks/useFormFieldStyle';
import { formStyles } from '../../../../src/lib/form-layout';
import { appShadow } from '../../../../src/lib/shadow';

type DescuentosEstimados = {
  descuento_sopas: number;
  descuento_muleros: number;
};

type ConfigDescuentos = {
  sopas_activo: boolean;
  sopas_monto_por_unidad: number;
  muleros_activo: boolean;
  muleros_monto_por_plato_principal: number;
  umbral_subtotal_otros: number;
};

type DetalleFactura = {
  id_detalle: number;
  id_producto?: number;
  id_detalle_padre: number | null;
  subtotal_linea: number;
  precio_unitario: number;
  nombre_producto: string;
  cantidad: number;
  categoria_nombre?: string;
  es_plato_principal?: boolean;
  cobrado?: boolean;
  nota_cocina?: string | null;
  personalizaciones?: { id_opcion?: number; descripcion: string }[];
};

type PedidoFull = {
  id_pedido: number;
  cliente_mulero?: boolean;
  detalles: DetalleFactura[];
  descuentos_estimados?: DescuentosEstimados;
  cobro_pendiente?: { items: number; subtotal: number };
  facturas?: { id_factura: number; total: number; es_parcial?: boolean }[];
};

const METODOS = ['efectivo', 'transferencia'] as const;

const METODO_LABEL: Record<(typeof METODOS)[number], string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
};

export default function FacturaScreen() {
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const { token, user } = useAuth();
  const esAdmin = user?.rol === 'admin';
  const router = useRouter();
  const [pedido, setPedido] = useState<PedidoFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [metodo, setMetodo] = useState<(typeof METODOS)[number]>('efectivo');
  const [recibeDigits, setRecibeDigits] = useState('');
  const [descSopaOn, setDescSopaOn] = useState(false);
  const [descMulerosOn, setDescMulerosOn] = useState(false);
  const [descSopaDigits, setDescSopaDigits] = useState('');
  const [descMulerosDigits, setDescMulerosDigits] = useState('');
  const [configDirty, setConfigDirty] = useState(false);
  const [reglaCamionerosActiva, setReglaCamionerosActiva] = useState(false);
  const [configReglas, setConfigReglas] = useState<ConfigDescuentos | null>(null);
  const [dividirCuenta, setDividirCuenta] = useState(false);
  const [cantidadesCobro, setCantidadesCobro] = useState<Record<number, number>>({});
  const [personasSplit, setPersonasSplit] = useState('');
  const [marcandoCamionero, setMarcandoCamionero] = useState(false);
  const [precuentaConCopia, setPrecuentaConCopia] = useState(false);
  const [imprimiendoPrecuenta, setImprimiendoPrecuenta] = useState(false);
  const [imprimirFactura, setImprimirFactura] = useState(true);
  const [facturaConCopia, setFacturaConCopia] = useState(true);
  const moneyField = useFormFieldStyle('money');

  const loadPedido = useCallback(async () => {
    const p = await api<PedidoFull>(`/pedidos/${pedidoId}`, {
      token,
      cacheKey: `pedido_${pedidoId}`,
    });
    setPedido(p);
    return p;
  }, [token, pedidoId]);

  const loadConfig = useCallback(async () => {
    const cfg = await api<ConfigDescuentos>('/pedidos/config-descuentos', {
      token,
      cacheKey: 'config_descuentos',
    });
    setDescSopaOn(cfg.sopas_activo);
    setDescMulerosOn(cfg.muleros_activo);
    setDescSopaDigits(digitsFromMonto(cfg.sopas_monto_por_unidad));
    setDescMulerosDigits(digitsFromMonto(cfg.muleros_monto_por_plato_principal));
    setReglaCamionerosActiva(cfg.muleros_activo);
    setConfigReglas(cfg);
    setConfigDirty(false);
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
        setLoadError(e instanceof Error ? e.message : 'No se pudo cargar el pedido');
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const detallesPendientes = useMemo(
    () => pedido?.detalles.filter((d) => !d.cobrado) ?? [],
    [pedido],
  );

  const lineasFacturaAgrupadas = useMemo(() => {
    if (!pedido) return [];
    const padres = pedido.detalles.filter((d) => d.id_detalle_padre == null);
    return agruparLineasFactura(
      padres.map((d) => ({
        ...d,
        precio_unitario: d.precio_unitario,
        personalizaciones: d.personalizaciones ?? [],
      })),
    );
  }, [pedido]);

  const solicitudesCobro = useMemo((): DetalleCobroCantidad[] => {
    if (!pedido) return [];
    const serial = pedido.detalles.map((d) => ({
      id_detalle: d.id_detalle,
      id_detalle_padre: d.id_detalle_padre ?? null,
      cobrado: Boolean(d.cobrado),
      cantidad: d.cantidad,
    }));
    const pendientes = serial.filter((d) => !d.cobrado).map((d) => d.id_detalle);
    if (!dividirCuenta) {
      return resolverSolicitudesCobro({}, serial, pendientes);
    }
    const base = solicitudesDesdeCantidades(cantidadesCobro);
    if (base.length === 0) return [];
    try {
      return ordenarSolicitudesCobro(
        serial,
        expandirSolicitudesConEmpaques(serial, base),
      );
    } catch {
      return [];
    }
  }, [pedido, dividirCuenta, cantidadesCobro]);

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
        es_plato_principal: d.es_plato_principal,
      })),
      solicitudesCobro,
    );
  }, [pedido, solicitudesCobro]);

  const descuentosCobro = useMemo(() => {
    if (lineasCobro.length === 0) {
      return { descuento_sopas: 0, descuento_muleros: 0 };
    }
    if (configReglas) {
      return calcularDescuentosPedido(
        lineasCobro,
        configReglas,
        Boolean(pedido?.cliente_mulero),
      );
    }
    return pedido?.descuentos_estimados ?? { descuento_sopas: 0, descuento_muleros: 0 };
  }, [lineasCobro, configReglas, pedido]);

  const subtotalItems = lineasCobro.reduce((s, d) => s + d.subtotal_linea, 0);
  const montoDescSopa = descuentosCobro.descuento_sopas;
  const montoDescMuleros = descuentosCobro.descuento_muleros;
  const sumaDescuentos = montoDescSopa + montoDescMuleros;
  const totalCobrar = Math.max(0, subtotalItems - sumaDescuentos);
  const descuentosValidos = sumaDescuentos <= subtotalItems;
  const umbralOtros = UMBRAL_SUBTOTAL_OTROS_COP;
  const hayPendientes = (pedido?.cobro_pendiente?.items ?? detallesPendientes.length) > 0;
  const cobrosParciales = (pedido?.facturas?.length ?? 0) > 0;

  const unidadesTanda = unidadesEnSolicitudes(solicitudesCobro);

  const repartoIgual = useMemo(() => {
    const n = parseInt(personasSplit, 10);
    if (!dividirCuenta || !Number.isFinite(n) || n < 2 || totalCobrar <= 0) {
      return null;
    }
    return repartirMontoEnCop(totalCobrar, n);
  }, [dividirCuenta, personasSplit, totalCobrar]);

  function pendienteDetalle(id: number): number {
    const d = pedido?.detalles.find((x) => x.id_detalle === id);
    if (!d || d.cobrado) return 0;
    return d.cantidad;
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
    }
  }, [dividirCuenta]);

  useEffect(() => {
    if (pedido && (pedido.facturas?.length ?? 0) > 0 && hayPendientes) {
      setDividirCuenta(true);
    }
  }, [pedido?.id_pedido, pedido?.facturas?.length, hayPendientes]);

  const recibidoNum = parseCOPDigits(recibeDigits);
  const vuelto =
    metodo === 'efectivo' && recibidoNum >= totalCobrar
      ? recibidoNum - totalCobrar
      : null;
  const faltaEfectivo =
    metodo === 'efectivo' && recibeDigits !== '' && recibidoNum < totalCobrar;
  const efectivoCubreTotal =
    metodo === 'efectivo' && recibeDigits !== '' && recibidoNum >= totalCobrar;
  const deshabilitarCobro =
    busy || !descuentosValidos || solicitudesCobro.length === 0;
  const deshabilitarPrecuenta =
    busy ||
    imprimiendoPrecuenta ||
    !descuentosValidos ||
    solicitudesCobro.length === 0;

  async function guardarConfigDescuentos() {
    if (
      descSopaOn &&
      (await avisarSiMontoCOPInvalido(
        'Monto descuento por sopa',
        descSopaDigits,
        showNotice,
      ))
    ) {
      return;
    }
    if (
      descMulerosOn &&
      (await avisarSiMontoCOPInvalido(
        'Monto descuento camionero',
        descMulerosDigits,
        showNotice,
      ))
    ) {
      return;
    }
    setSavingConfig(true);
    try {
      await api<ConfigDescuentos>('/pedidos/config-descuentos', {
        method: 'PUT',
        token,
        body: JSON.stringify({
          sopas_activo: descSopaOn,
          sopas_monto_por_unidad: parseCOPDigits(descSopaDigits),
          muleros_activo: descMulerosOn,
          muleros_monto_por_plato_principal: parseCOPDigits(descMulerosDigits),
        }),
      });
      setConfigDirty(false);
      setReglaCamionerosActiva(descMulerosOn);
      await loadPedido();
      await showNotice(
        'Descuentos guardados',
        'La regla queda activa para todos los pedidos posteriores.',
        'success',
      );
    } catch (e) {
      await showNotice(
        'Error',
        e instanceof Error ? e.message : 'No se pudo guardar la configuración',
        'error',
      );
    } finally {
      setSavingConfig(false);
    }
  }

  async function marcarClienteCamionero(clienteMulero: boolean) {
    setMarcandoCamionero(true);
    try {
      const p = await api<PedidoFull>(`/pedidos/${pedidoId}/cliente-mulero`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ cliente_mulero: clienteMulero }),
      });
      setPedido(p);
    } catch (e) {
      await showNotice(
        'Error',
        e instanceof Error ? e.message : 'No se pudo actualizar el cliente',
        'error',
      );
    } finally {
      setMarcandoCamionero(false);
    }
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
      const imp = res.impresion_factura;
      if (imp?.impreso) {
        await showNotice(
          'Factura reimpresa',
          `Ticket impreso (${imp.destino ?? 'impresora'}).`,
          'success',
        );
      } else {
        await showNotice(
          'Sin imprimir',
          imp?.error ?? 'No se pudo imprimir.',
          'error',
        );
      }
    } catch (e) {
      await showNotice('Error', e instanceof Error ? e.message : 'No se pudo reimprimir', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function imprimirPrecuenta() {
    if (solicitudesCobro.length === 0) {
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
      if (dividirCuenta) {
        body.detalles_cobro = solicitudesCobro;
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
      } else if (imp?.impreso) {
        const copiaMsg = res.factura_con_copia
          ? ' (copia negocio y copia cliente)'
          : '';
        await showNotice(
          'Pre-cuenta impresa',
          `Ticket enviado a la impresora${copiaMsg}. Aún no se ha cobrado.`,
          'success',
        );
      } else {
        await showNotice(
          'Sin imprimir',
          imp?.error ?? 'No se pudo imprimir la pre-cuenta.',
          'error',
        );
      }
    } catch (e) {
      await showNotice(
        'Error',
        e instanceof Error ? e.message : 'No se pudo imprimir la pre-cuenta',
        'error',
      );
    } finally {
      setImprimiendoPrecuenta(false);
    }
  }

  async function cobrar() {
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
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        metodo_pago: metodo,
        imprimir_factura: imprimirFactura,
        factura_con_copia: imprimirFactura && facturaConCopia,
      };
      if (dividirCuenta) {
        body.detalles_cobro = solicitudesCobro;
      }
      const res = await api<{
        cobro_completo?: boolean;
        factura_con_copia?: boolean;
        impresion_factura?: {
          impreso: boolean;
          omitido?: boolean;
          en_cola?: boolean;
          error?: string;
          destino?: string;
          codigo_error?: string;
        };
      }>(`/pedidos/${pedidoId}/facturar`, {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      });
      const imp = res.impresion_factura;
      const quedaPendiente = res.cobro_completo === false;

      const continuarTrasCobro = async () => {
        if (quedaPendiente) {
          setRecibeDigits('');
          setCantidadesCobro({});
          setDividirCuenta(true);
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
            {
              text: 'Reintentar impresión',
              style: 'primary',
              onPress: () => reimprimirFacturaCobrada(),
            },
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
          message: `El cobro quedó guardado.\n\nFactura: ${imp.error}`,
          variant: 'warning',
          buttons: [
            {
              text: quedaPendiente ? 'Continuar' : 'Ir a mesas',
              style: 'cancel',
              onPress: continuarTrasCobro,
            },
            {
              text: 'Reintentar impresión',
              style: 'primary',
              onPress: () => reimprimirFacturaCobrada(),
            },
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
      setDividirCuenta(true);
      await loadPedido();
    } catch (e) {
      await showNotice('Error', e instanceof Error ? e.message : 'No se pudo facturar', 'error');
    } finally {
      setBusy(false);
    }
  }

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
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={formStyles.pageScrollContent}
    >
      <View style={styles.headerCard}>
        <Text style={styles.kicker}>Factura</Text>
        <Text style={styles.h1}>Cobrar pedido #{pedido.id_pedido}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Detalle</Text>

        {cobrosParciales ? (
          <View style={styles.parcialBanner}>
            <Text style={styles.parcialBannerTitle}>
              Cobros parciales: {pedido.facturas?.length ?? 0}
            </Text>
            <Text style={styles.parcialBannerText}>
              {pedido.cobro_pendiente
                ? `Quedan ${pedido.cobro_pendiente.items} ítem(s) por ${formatCOP(pedido.cobro_pendiente.subtotal)}`
                : `Quedan ${detallesPendientes.length} ítem(s) pendientes`}
            </Text>
          </View>
        ) : null}

        {hayPendientes ? (
          <View style={styles.discHead}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.discLabel}>Dividir cuenta</Text>
              <Text style={styles.adminHint}>
                Indica cuántas unidades paga cada persona en esta tanda. La mesa
                sigue ocupada hasta pagar todo.
              </Text>
            </View>
            <Switch
              value={dividirCuenta}
              onValueChange={setDividirCuenta}
              trackColor={{ false: '#d9d5ca', true: '#9ec4b5' }}
              thumbColor={dividirCuenta ? '#2f5e4f' : '#f4f3f4'}
              disabled={busy}
            />
          </View>
        ) : null}

        {lineasFacturaAgrupadas.map((g) => {
          const cobrado = Boolean(g.cobrado);
          const seleccionable =
            dividirCuenta && !cobrado && hayPendientes;
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
                  <View style={styles.lineBody}>
                    <Text
                      style={[
                        styles.lineName,
                        cobrado && styles.lineNameCobrado,
                        incluidoHijo && styles.lineNameSeleccionado,
                      ]}
                    >
                      ↳ {empaqueCantidad > 1 ? `${empaqueCantidad}× ` : ''}
                      empaque para llevar
                      {incluidoHijo && sel === 0 ? ' · incluido' : ''}
                    </Text>
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

        {dividirCuenta && unidadesTanda === 0 && hayPendientes ? (
          <Text style={styles.seleccionHint}>
            Usa +/− en cada ítem para indicar cuántas unidades paga esta persona.
          </Text>
        ) : null}
      </View>

      {esAdmin ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Reglas de descuento (administrador)</Text>

          <Text style={styles.subsectionTitle}>Sopas</Text>
          <Text style={styles.adminHint}>
            Se aplica automáticamente si hay más de 1 sopa, hay otros ítems en el
            pedido y esos otros suman más de {formatCOP(umbralOtros)}.
          </Text>

          <View style={styles.discRow}>
            <View style={styles.discHead}>
              <Text style={styles.discLabel}>Descuento sopas activo</Text>
              <Switch
                value={descSopaOn}
                onValueChange={(v) => {
                  setDescSopaOn(v);
                  setConfigDirty(true);
                }}
                trackColor={{ false: '#d9d5ca', true: '#9ec4b5' }}
                thumbColor={descSopaOn ? '#2f5e4f' : '#f4f3f4'}
              />
            </View>
            {descSopaOn ? (
              <>
                <Text style={styles.fieldHint}>Monto por unidad de sopa</Text>
                <MoneyTextInput
                  style={[styles.input, moneyField]}
                  placeholderAmount={2000}
                  digits={descSopaDigits}
                  onChangeDigits={(t) => {
                    setDescSopaDigits(t);
                    setConfigDirty(true);
                  }}
                />
              </>
            ) : null}
          </View>

          <Text style={[styles.subsectionTitle, styles.subsectionGap]}>
            Clientes camioneros (muleros)
          </Text>
          <Text style={styles.adminHint}>
            No es un plato: son clientes especiales. Al cobrar, marca el pedido
            como camionero y se rebaja el monto configurado por cada plato
            principal del menú.
          </Text>

          <View style={styles.discRow}>
            <View style={styles.discHead}>
              <Text style={styles.discLabel}>Descuento camioneros activo</Text>
              <Switch
                value={descMulerosOn}
                onValueChange={(v) => {
                  setDescMulerosOn(v);
                  setConfigDirty(true);
                }}
                trackColor={{ false: '#d9d5ca', true: '#9ec4b5' }}
                thumbColor={descMulerosOn ? '#2f5e4f' : '#f4f3f4'}
              />
            </View>
            {descMulerosOn ? (
              <>
                <Text style={styles.fieldHint}>Monto por plato principal</Text>
                <MoneyTextInput
                  style={[styles.input, moneyField]}
                  placeholderAmount={10000}
                  digits={descMulerosDigits}
                  onChangeDigits={(t) => {
                    setDescMulerosDigits(t);
                    setConfigDirty(true);
                  }}
                />
              </>
            ) : null}
          </View>

          <View style={styles.saveConfigRow}>
            <IconTooltipButton
              icon={savingConfig ? 'hourglass-outline' : AccionIcon.guardar}
              label={
                savingConfig ? 'Guardando…' : 'Guardar reglas de descuento'
              }
              variant="primary"
              disabled={!configDirty || savingConfig}
              onPress={guardarConfigDescuentos}
            />
          </View>
        </View>
      ) : null}

      {reglaCamionerosActiva ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Cliente camionero</Text>
          <Text style={styles.adminHint}>
            Activa si este pedido es de un camionero (mulero). El descuento se
            calcula por cada plato principal del pedido.
          </Text>
          <View style={styles.discHead}>
            <Text style={styles.discLabel}>Es cliente camionero</Text>
            <Switch
              value={Boolean(pedido.cliente_mulero)}
              onValueChange={marcarClienteCamionero}
              disabled={marcandoCamionero || busy}
              trackColor={{ false: '#d9d5ca', true: '#9ec4b5' }}
              thumbColor={pedido.cliente_mulero ? '#2f5e4f' : '#f4f3f4'}
            />
          </View>
        </View>
      ) : null}

      <View style={[styles.card, styles.totalCard]}>
        <Text style={styles.sectionTitle}>
          {dividirCuenta ? 'Total de esta tanda' : 'Total a cobrar'}
        </Text>
        {dividirCuenta && idsCobroActuales.length > 0 ? (
          <Text style={styles.tandaHint}>
            {unidadesTanda} unidad(es) en esta tanda
          </Text>
        ) : null}
        <Text style={styles.subtotalLine}>
          Subtotal ítems: {formatCOP(subtotalItems)}
        </Text>
        {montoDescSopa > 0 ? (
          <Text style={styles.descLine}>
            − Descuento sopas: {formatCOP(montoDescSopa)}
          </Text>
        ) : null}
        {montoDescMuleros > 0 ? (
          <Text style={styles.descLine}>
            − Descuento camionero: {formatCOP(montoDescMuleros)}
          </Text>
        ) : null}
        <Text style={styles.total}>{formatCOP(totalCobrar)}</Text>
        {!descuentosValidos ? (
          <Text style={styles.errorHint}>
            Los descuentos superan el subtotal; revisa la configuración.
          </Text>
        ) : null}

        {dividirCuenta && totalCobrar > 0 ? (
          <View style={styles.splitBox}>
            <Text style={styles.splitTitle}>Reparto a partes iguales</Text>
            <Text style={styles.adminHint}>
              Montos en múltiplos de $100 (efectivo). En transferencia cada persona
              paga un monto único; usa esto como guía.
            </Text>
            <TextInput
              style={styles.splitInput}
              keyboardType="number-pad"
              value={personasSplit}
              onChangeText={(t) => setPersonasSplit(t.replace(/\D/g, '').slice(0, 2))}
              placeholder="2"
              placeholderTextColor="#9a988f"
            />
            {repartoIgual?.map((monto, i) => (
              <Text key={i} style={styles.splitLine}>
                Persona {i + 1}: {formatCOP(monto)}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

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
              trackColor={{ false: '#d9d5ca', true: '#9ec4b5' }}
              thumbColor={precuentaConCopia ? '#2f5e4f' : '#f4f3f4'}
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

      <View style={styles.card}>
        <Text style={styles.label}>Método de pago</Text>
        <View style={styles.row}>
          {METODOS.map((m) => (
            <Pressable
              key={m}
              style={[styles.chip, metodo === m && styles.chipOn]}
              onPress={() => setMetodo(m)}
            >
              <Text style={[styles.chipText, metodo === m && styles.chipTextOn]}>
                {METODO_LABEL[m]}
              </Text>
            </Pressable>
          ))}
        </View>

        {metodo === 'efectivo' && (
          <View style={styles.efectivoBox}>
            <Text style={styles.label}>Cliente paga con</Text>
            <MoneyTextInput
              style={[styles.input, moneyField]}
              placeholderAmount={50000}
              digits={recibeDigits}
              onChangeDigits={setRecibeDigits}
            />
            <IconTooltipButton
              icon="wallet-outline"
              label="Pago completo (monto exacto, sin vuelto)"
              variant="secondary"
              onPress={() => setRecibeDigits(digitsFromMonto(totalCobrar))}
              disabled={busy}
              style={styles.walletBtnWrap}
            />
            {recibeDigits !== '' && !faltaEfectivo && vuelto !== null && (
              <Text style={styles.vueltoOk}>
                Vuelto: {formatCOP(vuelto)}
              </Text>
            )}
            {faltaEfectivo && (
              <Text style={styles.vueltoFalta}>
                Falta {formatCOP(totalCobrar - recibidoNum)} para cubrir el total
              </Text>
            )}
          </View>
        )}

        <Text style={[styles.subsectionTitle, styles.subsectionGap]}>
          Factura (al cobrar)
        </Text>
        <Text style={styles.adminHint}>
          Al confirmar el cobro se registra el pago. Por defecto también imprime
          la factura oficial.
        </Text>

        <View style={styles.printRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.printLabel}>Imprimir factura</Text>
            <Text style={styles.printHint}>
              Desactiva solo si quieres cobrar sin usar la impresora POS.
            </Text>
          </View>
          <View style={styles.switchWrap}>
            <Switch
              value={imprimirFactura}
              onValueChange={(v) => {
                setImprimirFactura(v);
                if (v) setFacturaConCopia(true);
              }}
              trackColor={{ false: '#d9d5ca', true: '#9ec4b5' }}
              thumbColor={imprimirFactura ? '#2f5e4f' : '#f4f3f4'}
              disabled={busy}
            />
          </View>
        </View>

        {imprimirFactura ? (
          <View style={styles.printRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.printLabel}>Con copia</Text>
              <Text style={styles.printHint}>
                Copia negocio (restaurante) y copia cliente.
              </Text>
            </View>
            <View style={styles.switchWrap}>
              <Switch
                value={facturaConCopia}
                onValueChange={setFacturaConCopia}
                trackColor={{ false: '#d9d5ca', true: '#9ec4b5' }}
                thumbColor={facturaConCopia ? '#2f5e4f' : '#f4f3f4'}
                disabled={busy}
              />
            </View>
          </View>
        ) : null}

        <ActionIconBar
          style={styles.payActions}
          actions={[
            {
              key: 'cobrar',
              icon: busy
                ? 'hourglass-outline'
                : efectivoCubreTotal
                  ? 'checkmark-done-outline'
                  : 'checkmark-circle-outline',
              label: busy
                ? 'Procesando cobro…'
                : dividirCuenta && unidadesTanda === 0
                  ? 'Selecciona ítems'
                  : !imprimirFactura
                    ? dividirCuenta
                      ? 'Cobrar selección (sin imprimir)'
                      : 'Confirmar cobro (sin imprimir)'
                    : facturaConCopia
                      ? dividirCuenta
                        ? 'Cobrar selección e imprimir (2 copias)'
                        : 'Confirmar cobro e imprimir (2 copias)'
                      : dividirCuenta
                        ? 'Cobrar selección e imprimir'
                        : 'Confirmar cobro e imprimir',
              variant: 'primary',
              disabled: deshabilitarCobro,
              onPress: cobrar,
            },
            {
              key: 'volver',
              icon: 'home-outline',
              label: 'Volver a menú principal',
              disabled: busy,
              onPress: () => router.replace('/(app)/mesas'),
            },
          ]}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f4ee', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e2d8',
    marginBottom: 12,
    ...appShadow('elevated'),
  },
  kicker: { color: '#6f6e67', fontWeight: '700', letterSpacing: 0.3 },
  h1: { fontSize: 22, fontWeight: '800', marginTop: 6, color: '#262622' },
  subtotalLine: {
    fontSize: 15,
    color: '#5c4033',
    marginTop: 10,
    fontWeight: '600',
  },
  descLine: {
    fontSize: 14,
    color: '#b71c1c',
    marginTop: 4,
    fontWeight: '700',
  },
  total: { fontSize: 28, fontWeight: '900', marginTop: 12, color: '#2f5e4f' },
  errorHint: {
    marginTop: 8,
    color: '#b71c1c',
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e2d8',
    marginBottom: 12,
    ...appShadow('soft'),
  },
  totalCard: {
    borderColor: '#c5d9ce',
    backgroundColor: '#f8fbf9',
  },
  sectionTitle: { fontWeight: '800', color: '#262622', marginBottom: 8 },
  subsectionTitle: { fontWeight: '800', color: '#3d3d3a', fontSize: 15 },
  subsectionGap: { marginTop: 8 },
  adminHint: {
    fontSize: 13,
    color: '#6f6e67',
    marginBottom: 12,
    lineHeight: 18,
  },
  fieldHint: {
    fontSize: 12,
    color: '#6f6e67',
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
  discLabel: { fontWeight: '800', color: '#262622', fontSize: 16 },
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
    color: '#2f5e4f',
    fontSize: 14,
  },
  splitBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d5e5dc',
  },
  splitTitle: { fontWeight: '800', color: '#262622', marginBottom: 4 },
  splitInput: {
    borderWidth: 1,
    borderColor: '#d9d5ca',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
    maxWidth: 120,
  },
  splitLine: { fontSize: 14, color: '#3d3d3a', marginTop: 4, fontWeight: '600' },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ece9df',
  },
  lineHijo: { paddingLeft: 28 },
  lineCobrado: { opacity: 0.55 },
  lineBody: { flex: 1, paddingRight: 8 },
  lineName: { color: '#262622', fontWeight: '600' },
  lineNameCobrado: { color: '#8a8880', textDecorationLine: 'line-through' },
  lineNameSeleccionado: { color: '#2f5e4f' },
  check: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#c5c2b8',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkOn: {
    borderColor: '#2f5e4f',
    backgroundColor: '#e8f3ee',
  },
  checkMark: { color: '#2f5e4f', fontWeight: '900', fontSize: 16 },
  checkPlaceholder: { width: 28, marginRight: 10 },
  parcialBanner: {
    backgroundColor: '#fff8e6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0d78c',
  },
  parcialBannerTitle: { fontWeight: '800', color: '#7a5a00', marginBottom: 4 },
  parcialBannerText: { color: '#6f5a20', fontSize: 13, fontWeight: '600' },
  seleccionHint: {
    marginTop: 8,
    fontSize: 13,
    color: '#6f6e67',
    fontStyle: 'italic',
  },
  tandaHint: {
    fontSize: 13,
    color: '#5c7a6d',
    fontWeight: '600',
    marginBottom: 4,
  },
  price: { fontWeight: '800', color: '#262622' },
  label: { fontWeight: '800', marginBottom: 10, color: '#262622' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d9d5ca',
    backgroundColor: '#fff',
  },
  chipOn: { backgroundColor: '#2f5e4f', borderColor: '#2f5e4f' },
  chipText: { textTransform: 'capitalize', color: '#3d3d3a', fontWeight: '700' },
  chipTextOn: { color: '#fff' },
  efectivoBox: { marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#d9d5ca',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    fontWeight: '700',
    backgroundColor: '#faf9f6',
  },
  vueltoOk: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '900',
    color: '#1b5e20',
  },
  vueltoFalta: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#b71c1c',
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
    backgroundColor: '#faf9f6',
    borderWidth: 1,
    borderColor: '#ece9df',
    gap: 12,
  },
  switchWrap: { paddingTop: 2 },
  printLabel: { fontWeight: '800', color: '#262622', fontSize: 15 },
  printHint: { fontSize: 12, color: '#6f6e67', marginTop: 4, lineHeight: 16 },
  payActions: { marginTop: 4, paddingTop: 8 },
  precuentaActions: { marginTop: 4 },
});
