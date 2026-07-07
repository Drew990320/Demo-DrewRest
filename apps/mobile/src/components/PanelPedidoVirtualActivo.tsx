import { useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { usePedidoCocinaContadoresSuave } from '../hooks/usePedidoCocinaContadoresSuave';
import { useRefreshPedidoSuave } from '../hooks/useRefreshPedidoSuave';
import { usePermisosMesero } from '../hooks/usePermisosMesero';
import { useResponsive } from '../hooks/useResponsive';
import { usePedidoToolsRail } from '../context/ResumenDiarioToolsRailContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { ActionIconBar, type ActionIconItem } from './ActionIconBar';
import { IconTooltipButton } from './IconTooltipButton';
import { PedidoIcon } from '../lib/app-icons';
import { mergePedidoRailActions } from '../lib/pedido-rail-actions';
import { api } from '../lib/api';
import { confirmAppDialog, showNotice } from '../lib/app-dialog';
import { formatCOP } from '../lib/format';
import { manejarErrorAccion } from '../lib/recurso-disponible';
import {
  agruparLineasPedido,
  etiquetaEstadoLineaPedido,
  type LineaPedidoGrupo,
} from '../lib/pedido-detalle-group';
import { esDetalleMazorcaAcompanamiento } from '../lib/mazorca-pedido';
import {
  nombreLineaPedidoVisible,
  notaCocinaVisibleUsuario,
} from '../lib/nota-cocina-ui';
import type { MesasVirtualesConfig } from '../lib/mesa-label';
import {
  esMesaMostradorNumero,
  esMesaParaLlevarNumero,
} from '../lib/mesa-label';
import type { AppColors } from '../lib/theme';
import {
  empaqueFaltanteEnDetallePadre,
  resumenEmpaqueParaLlevar,
} from '../lib/empaque-para-llevar';
import {
  EmpaqueParaLlevarAjuste,
  reducirEmpaqueDetalle,
  type DetalleEmpaqueUi,
} from './EmpaqueParaLlevarAjuste';

export function esParaLlevarPedido(
  modo: ModoPanelPedidoInline,
  modoServicio?: 'en_mesa' | 'para_llevar',
): boolean {
  return modo === 'para_llevar' || modoServicio === 'para_llevar';
}

export type ModoPanelPedidoInline = 'mostrador' | 'para_llevar' | 'mesa';

export function modoPanelPedidoDesdeMesa(
  numero: number,
  cfg?: MesasVirtualesConfig,
): ModoPanelPedidoInline {
  if (esMesaMostradorNumero(numero, cfg)) return 'mostrador';
  if (esMesaParaLlevarNumero(numero, cfg)) return 'para_llevar';
  return 'mesa';
}

export type PedidoVirtualDetalle = {
  id_pedido: number;
  creado_en: string;
  estado: string;
  modo_servicio?: 'en_mesa' | 'para_llevar';
  detalles: {
    id_detalle: number;
    id_detalle_padre: number | null;
    nombre_producto: string;
    cantidad: number;
    precio_unitario?: number;
    subtotal_linea: number;
    nota_cocina: string | null;
    marcar_cocina?: boolean;
    enviado_cocina?: boolean;
    es_acompanamiento_mazorca?: boolean;
    es_empacable?: boolean;
    es_plato_principal?: boolean;
    categoria_nombre?: string;
    personalizaciones: { descripcion: string }[];
  }[];
  facturas?: { id_factura: number }[];
};

type Props = {
  pedido: PedidoVirtualDetalle;
  modo: ModoPanelPedidoInline;
  token: string | null;
  onRefresh: () => Promise<void>;
  /** Oculta #id cuando la pantalla padre ya lo muestra. */
  mostrarEncabezado?: boolean;
  mostrarCancelar?: boolean;
  mostrarCobrar?: boolean;
  /** Solo consulta: oculta +/- y quitar línea (p. ej. ayuda a compañeros). */
  editarLineas?: boolean;
  accionesExtra?: ActionIconItem[];
  extra?: ReactNode;
  /** Sincronizando detalle completo (p. ej. al cambiar chip en mis pedidos). */
  actualizando?: boolean;
};

function etiquetaEstadoPedido(p: PedidoVirtualDetalle): string {
  const estado = p.estado.replace(/_/g, ' ');
  if (p.modo_servicio === 'para_llevar') {
    return `${estado} · para llevar`;
  }
  return estado;
}

function createPanelStyles(c: AppColors) {
  return StyleSheet.create({
    box: {
      marginTop: 4,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borderLight,
      gap: 4,
      position: 'relative',
    },
    contenido: {
      gap: 4,
    },
    contenidoAtenuado: {
      opacity: 0.72,
    },
    actualizandoOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceMuted,
      opacity: 0.92,
    },
    actualizandoText: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textMuted,
    },
    boxSinBorde: {
      marginTop: 0,
      paddingTop: 0,
      borderTopWidth: 0,
    },
    head: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 8,
    },
    pedidoId: { fontWeight: '900', color: c.primary, fontSize: 18 },
    meta: { fontSize: 13, color: c.textMuted, fontWeight: '600' },
    empty: {
      fontSize: 14,
      color: c.textMuted,
      lineHeight: 20,
      paddingVertical: 8,
    },
    line: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderLight,
      paddingVertical: 10,
    },
    lineMain: { fontSize: 16, color: c.text, fontWeight: '600' },
    linePrice: { fontSize: 14, color: c.textMuted, marginTop: 4 },
    nota: { fontSize: 13, color: c.secondary, marginTop: 4 },
    pers: { fontSize: 13, color: c.textMuted, marginTop: 2 },
    subLine: {
      fontSize: 12,
      color: c.textHint,
      fontStyle: 'italic',
      flex: 1,
    },
    empaqueSubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    subLineFalta: {
      fontSize: 12,
      color: c.warning,
      marginTop: 4,
      fontWeight: '600',
    },
    lineActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
      gap: 10,
    },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    qtyVal: {
      fontWeight: '900',
      fontSize: 16,
      color: c.text,
      minWidth: 24,
      textAlign: 'center',
    },
    total: {
      marginTop: 10,
      fontSize: 15,
      fontWeight: '800',
      color: c.text,
      textAlign: 'right',
    },
    extra: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borderLight,
    },
    actionBar: { marginTop: 12 },
  });
}

export function PanelPedidoVirtualActivo({
  pedido,
  modo,
  token,
  onRefresh,
  mostrarEncabezado = true,
  mostrarCancelar = true,
  mostrarCobrar = true,
  editarLineas = true,
  accionesExtra = [],
  extra,
  actualizando = false,
}: Props) {
  const styles = useThemedStyles(createPanelStyles);
  const router = useRouter();
  const isFocused = useIsFocused();
  const { permisos } = usePermisosMesero();
  const [busy, setBusy] = useState(false);
  const [busyPasarCocina, setBusyPasarCocina] = useState(false);

  const esParaLlevar = esParaLlevarPedido(modo, pedido.modo_servicio);

  const {
    platosPendientesCocina,
    platosPendientesServidor,
    platosEnCocina,
    bumpPendientesCocina,
    syncPendientesCocina,
  } = usePedidoCocinaContadoresSuave(pedido.id_pedido, pedido.detalles);

  const refreshSuave = useRefreshPedidoSuave(onRefresh);

  function detallePendienteCocina(idDetalle: number): boolean {
    const d = pedido.detalles.find((x) => x.id_detalle === idDetalle);
    return Boolean(d?.marcar_cocina && !d?.enviado_cocina);
  }

  function pendientesEnGrupo(grupo: LineaPedidoGrupo): number {
    return grupo.ids_detalle.filter((id) => detallePendienteCocina(id)).length;
  }

  const lineasAgrupadas = useMemo(() => {
    const padres = pedido.detalles.filter((d) => d.id_detalle_padre == null);
    return agruparLineasPedido(
      padres.map((d) => ({
        ...d,
        precio_unitario: d.precio_unitario ?? 0,
        personalizaciones: d.personalizaciones.map((p) => ({
          ...p,
          tipo: 'extra',
        })),
      })),
      { soloEstadoVisible: true },
    ).filter(
      (d) => !esDetalleMazorcaAcompanamiento(d),
    );
  }, [pedido.detalles]);

  const total = useMemo(
    () =>
      pedido.detalles
        .filter((d) => d.id_detalle_padre == null)
        .reduce((sum, d) => sum + d.subtotal_linea, 0),
    [pedido.detalles],
  );

  const resumenEmpaque = useMemo(
    () =>
      resumenEmpaqueParaLlevar(
        esParaLlevar ? 'para_llevar' : pedido.modo_servicio,
        pedido.detalles.map((d) => ({
          id_detalle: d.id_detalle,
          id_detalle_padre: d.id_detalle_padre,
          cantidad: d.cantidad,
          es_empacable: d.es_empacable,
          es_plato_principal: d.es_plato_principal,
          categoria_nombre: d.categoria_nombre,
        })),
      ),
    [esParaLlevar, pedido.modo_servicio, pedido.detalles],
  );

  const detallesEmpaqueUi = useMemo(
    (): DetalleEmpaqueUi[] =>
      pedido.detalles.map((d) => ({
        id_detalle: d.id_detalle,
        id_detalle_padre: d.id_detalle_padre,
        cantidad: d.cantidad,
        es_empacable: d.es_empacable,
        es_plato_principal: d.es_plato_principal,
        categoria_nombre: d.categoria_nombre,
      })),
    [pedido.detalles],
  );

  const tieneCobrosParciales = (pedido.facturas?.length ?? 0) > 0;

  function cantidadFilaDetalle(idDetalle: number): number {
    return (
      pedido.detalles.find((d) => d.id_detalle === idDetalle)?.cantidad ?? 0
    );
  }

  async function cambiarCantidadLinea(
    idDetalle: number,
    actual: number,
    delta: number,
  ) {
    const next = actual + delta;
    if (next < 1) return;
    if (detallePendienteCocina(idDetalle)) {
      bumpPendientesCocina(delta);
    }
    setBusy(true);
    try {
      await api(`/pedidos/detalles/${idDetalle}/cantidad`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ cantidad: next }),
      });
      await refreshSuave();
    } catch (e) {
      syncPendientesCocina();
      await manejarErrorAccion(e, 'actualizar la cantidad');
    } finally {
      setBusy(false);
    }
  }

  async function quitarLineaPorId(idDetalle: number) {
    if (detallePendienteCocina(idDetalle)) {
      bumpPendientesCocina(-cantidadFilaDetalle(idDetalle));
    }
    setBusy(true);
    try {
      await api(`/pedidos/detalles/${idDetalle}`, {
        method: 'DELETE',
        token,
      });
      await refreshSuave();
    } catch (e) {
      syncPendientesCocina();
      await manejarErrorAccion(e, 'quitar la línea');
    } finally {
      setBusy(false);
    }
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

  async function quitarGrupoLinea(grupo: LineaPedidoGrupo) {
    const ok = await confirmAppDialog(
      'Quitar ítem',
      `¿Quitar ${grupo.cantidad}× ${grupo.nombre_producto} del pedido?`,
    );
    if (!ok) return;
    const ids = [...grupo.ids_detalle].sort((a, b) => b - a);
    const quitados = pendientesEnGrupo(grupo);
    if (quitados > 0) bumpPendientesCocina(-quitados);
    setBusy(true);
    try {
      for (const id of ids) {
        await api(`/pedidos/detalles/${id}`, { method: 'DELETE', token });
      }
      await refreshSuave();
    } catch (e) {
      syncPendientesCocina();
      await manejarErrorAccion(e, 'quitar la línea');
    } finally {
      setBusy(false);
    }
  }

  async function pasarACocina() {
    setBusyPasarCocina(true);
    try {
      const res = await api<{ es_adicional?: boolean; error_impresion?: string }>(
        `/pedidos/${pedido.id_pedido}/pasar-cocina`,
        { method: 'POST', token },
      );
      syncPendientesCocina();
      await refreshSuave({ inmediato: true });
      if (res.error_impresion) {
        await showNotice(
          res.es_adicional ? 'Adicional en cocina' : 'Enviado a cocina',
          res.error_impresion,
          'warning',
        );
        return;
      }
      await showNotice(
        'Cocina',
        res.es_adicional
          ? 'Platos adicionales enviados a cocina.'
          : 'Platos enviados a cocina.',
        'success',
      );
    } catch (e) {
      await manejarErrorAccion(e, 'enviar a cocina');
    } finally {
      setBusyPasarCocina(false);
    }
  }

  async function reducirEmpaqueEnGrupo(
    empaquesGrupo: PedidoVirtualDetalle['detalles'],
  ) {
    if (busy || empaquesGrupo.length === 0) return;
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
      await refreshSuave();
    } catch (e) {
      await manejarErrorAccion(e, 'quitar empaque');
    } finally {
      setBusy(false);
    }
  }

  async function cancelarPedido() {
    if (busy) return;
    if ((pedido.facturas?.length ?? 0) > 0) {
      await showNotice(
        'Hay cobros registrados',
        'Este pedido tiene pagos parciales. Termina de cobrar desde Factura; no se puede cancelar.',
        'warning',
      );
      return;
    }
    const ok = await confirmAppDialog(
      'Cancelar pedido',
      'Se eliminará este ticket sin cobrar. ¿Continuar?',
    );
    if (!ok) return;
    setBusy(true);
    try {
      await api(`/pedidos/${pedido.id_pedido}/cancelar`, {
        method: 'POST',
        token,
      });
      syncPendientesCocina();
      await refreshSuave({ inmediato: true });
    } catch (e) {
      await manejarErrorAccion(e, 'cancelar el pedido');
    } finally {
      setBusy(false);
    }
  }

  const menuHref =
    modo === 'mostrador'
      ? `/(app)/pedido/${pedido.id_pedido}/menu?bebidas=1`
      : modo === 'para_llevar'
        ? `/(app)/pedido/${pedido.id_pedido}/menu?paraLlevar=1`
        : `/(app)/pedido/${pedido.id_pedido}/menu`;

  const menuLabel =
    modo === 'mostrador'
      ? 'Agregar bebidas'
      : modo === 'para_llevar'
        ? 'Agregar del menú'
        : 'Agregar del menú';

  const menuIcon =
    modo === 'mostrador' ? PedidoIcon.agregarBebidas : PedidoIcon.agregarMenu;

  const emptyText =
    modo === 'mostrador'
      ? 'Sin bebidas aún. Agrega ítems con el botón de abajo.'
      : 'Sin ítems aún. Agrega del menú con el botón de abajo.';

  const accionesCocina = useMemo((): ActionIconItem[] => {
    if (modo === 'mostrador' || !permisos.enviar_cocina) return [];
    return [
      {
        key: 'cocina',
        icon: PedidoIcon.pasarCocina,
        label: busyPasarCocina
          ? 'Enviando…'
          : platosPendientesCocina > 0
            ? `Pasar a cocina (${platosPendientesCocina})`
            : 'Pasar a cocina',
        variant: 'cocina' as const,
        disabled:
          busyPasarCocina ||
          (platosPendientesCocina === 0 && platosPendientesServidor === 0),
        badge: platosPendientesCocina > 0 ? platosPendientesCocina : undefined,
        onPress: pasarACocina,
      },
    ];
  }, [
    modo,
    permisos.enviar_cocina,
    busyPasarCocina,
    platosPendientesCocina,
    platosPendientesServidor,
    pasarACocina,
  ]);

  const accionesExtraSig = accionesExtra
    .map(
      (a) =>
        `${a.key}|${a.label}|${String(a.disabled ?? false)}|${String(a.badge ?? '')}`,
    )
    .join(';');

  const pedidoActions = useMemo((): ActionIconItem[] => {
    return mergePedidoRailActions({
      menu: permisos.agregar_items
        ? {
            key: 'menu',
            icon: menuIcon,
            label: menuLabel,
            variant: 'secondary' as const,
            onPress: () => router.push(menuHref),
          }
        : null,
      cocina: accionesCocina,
      reimprimir: accionesExtra,
      cobrar:
        mostrarCobrar && permisos.cobrar
          ? {
              key: 'cobrar',
              icon: PedidoIcon.cobrar,
              label: 'Cobrar',
              variant: 'money' as const,
              onPress: () =>
                router.push(`/(app)/pedido/${pedido.id_pedido}/factura`),
            }
          : null,
      cancelar:
        mostrarCancelar && permisos.cancelar_pedido
          ? {
              key: 'cancelar',
              icon: 'close-circle-outline' as const,
              label: tieneCobrosParciales
                ? 'Cancelar (hay cobros)'
                : 'Cancelar ticket',
              variant: 'danger' as const,
              disabled: busy || tieneCobrosParciales,
              onPress: cancelarPedido,
            }
          : null,
    });
  }, [
    accionesExtra,
    permisos,
    menuIcon,
    menuLabel,
    menuHref,
    accionesCocina,
    mostrarCobrar,
    mostrarCancelar,
    busy,
    tieneCobrosParciales,
    pedido.id_pedido,
    router,
  ]);

  const r = useResponsive();
  const toolsRail = r.navSidebar && isFocused;

  usePedidoToolsRail(
    toolsRail,
    { pedidoActions },
    [
      pedido.id_pedido,
      busy,
      busyPasarCocina,
      platosPendientesCocina,
      platosPendientesServidor,
      platosEnCocina,
      tieneCobrosParciales,
      mostrarCobrar,
      mostrarCancelar,
      modo,
      permisos.agregar_items,
      permisos.cobrar,
      permisos.cancelar_pedido,
      accionesExtraSig,
    ],
  );

  return (
    <View style={[styles.box, !mostrarEncabezado && styles.boxSinBorde]}>
      <View style={[styles.contenido, actualizando && styles.contenidoAtenuado]}>
      {mostrarEncabezado ? (
        <View style={styles.head}>
          <Text style={styles.pedidoId}>#{pedido.id_pedido}</Text>
          <Text style={styles.meta}>{etiquetaEstadoPedido(pedido)}</Text>
        </View>
      ) : null}

      {esParaLlevar ? (
        <EmpaqueParaLlevarAjuste
          idPedido={pedido.id_pedido}
          detalles={detallesEmpaqueUi}
          esParaLlevar={esParaLlevar}
          token={token}
          onRefresh={() => refreshSuave({ inmediato: true })}
          puedeEditar={permisos.editar_cantidades}
        />
      ) : null}

      {lineasAgrupadas.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        lineasAgrupadas.map((d) => {
          const notaVisible = notaCocinaVisibleUsuario(d.nota_cocina);
          const empaquesGrupo = pedido.detalles.filter(
            (h) =>
              h.id_detalle_padre != null &&
              d.ids_detalle.includes(h.id_detalle_padre),
          );
          const empaqueCantidad = empaquesGrupo.reduce(
            (sum, h) => sum + h.cantidad,
            0,
          );
          const detalleRef = pedido.detalles.find(
            (x) => x.id_detalle === d.id_detalle_incremento,
          );
          const faltanteLinea =
            detalleRef && resumenEmpaque
              ? empaqueFaltanteEnDetallePadre(
                  {
                    id_detalle: detalleRef.id_detalle,
                    id_detalle_padre: detalleRef.id_detalle_padre,
                    cantidad: d.cantidad,
                    es_empacable: detalleRef.es_empacable,
                    es_plato_principal: detalleRef.es_plato_principal,
                    categoria_nombre: detalleRef.categoria_nombre,
                  },
                  pedido.detalles.map((x) => ({
                    id_detalle: x.id_detalle,
                    id_detalle_padre: x.id_detalle_padre,
                    cantidad: x.cantidad,
                    es_empacable: x.es_empacable,
                    es_plato_principal: x.es_plato_principal,
                    categoria_nombre: x.categoria_nombre,
                  })),
                )
              : 0;
          return (
            <View key={d.ids_detalle.join('-')} style={styles.line}>
              <Text style={styles.lineMain}>
                {d.cantidad}×{' '}
                {nombreLineaPedidoVisible(d.nombre_producto, d.nota_cocina)}
                {etiquetaEstadoLineaPedido(d)}
              </Text>
              <Text style={styles.linePrice}>{formatCOP(d.subtotal_linea)}</Text>
              {empaqueCantidad > 0 ? (
                <View style={styles.empaqueSubRow}>
                  <Text style={styles.subLine}>
                    ↳ {empaqueCantidad > 1 ? `${empaqueCantidad}× ` : ''}
                    empaque para llevar
                  </Text>
                  {editarLineas && permisos.editar_cantidades ? (
                    <IconTooltipButton
                      icon="remove-circle-outline"
                      label="Quitar un empaque"
                      size={20}
                      onPress={() => reducirEmpaqueEnGrupo(empaquesGrupo)}
                      disabled={busy}
                    />
                  ) : null}
                </View>
              ) : faltanteLinea > 0 ? (
                <Text style={styles.subLineFalta}>
                  ↳ falta{faltanteLinea > 1 ? `n ${faltanteLinea}` : ''} empaque
                  para llevar
                </Text>
              ) : null}
              {notaVisible ? (
                <Text style={styles.nota}>Nota: {notaVisible}</Text>
              ) : null}
              {d.personalizaciones.length > 0 ? (
                <Text style={styles.pers}>
                  {d.personalizaciones.map((p) => p.descripcion).join(' · ')}
                </Text>
              ) : null}
              {editarLineas && (permisos.editar_cantidades || permisos.quitar_lineas) ? (
              <View style={styles.lineActions}>
                {permisos.editar_cantidades ? (
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
                ) : (
                  <Text style={styles.qtyVal}>{d.cantidad}</Text>
                )}
                {permisos.quitar_lineas ? (
                <IconTooltipButton
                  icon="trash-outline"
                  label="Quitar línea"
                  variant="danger"
                  size={20}
                  onPress={() => quitarGrupoLinea(d)}
                  disabled={busy}
                />
                ) : null}
              </View>
              ) : null}
            </View>
          );
        })
      )}

      {total > 0 ? (
        <Text style={styles.total}>Total pendiente · {formatCOP(total)}</Text>
      ) : null}

      {extra ? <View style={styles.extra}>{extra}</View> : null}

      {!toolsRail ? (
      <ActionIconBar style={styles.actionBar} actions={pedidoActions} />
      ) : null}
      </View>
      {actualizando ? (
        <View style={styles.actualizandoOverlay} pointerEvents="none">
          <Text style={styles.actualizandoText}>Actualizando…</Text>
        </View>
      ) : null}
    </View>
  );
}
