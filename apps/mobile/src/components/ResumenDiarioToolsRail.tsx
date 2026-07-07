import { Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccionIcon } from '../lib/app-icons';
import { formatCOP } from '../lib/format';
import { tituloLugarMesa } from '../lib/mesa-label';
import { RESUMEN_TOOLS_RAIL_WIDTH } from '../lib/layout-constants';
import type { AppColors } from '../lib/theme';
import { useVisualTheme } from '../context/VisualThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { AppNavChrome } from './AppNavChrome';
import { IconTooltipButton } from './IconTooltipButton';
import type { ActionIconItem } from './ActionIconBar';

type PedidoGrupoRail = {
  id_pedido: number;
  mesa_numero: number;
  pedido_estado: string;
  total: number;
};

type Props = {
  cajaActions: ActionIconItem[];
  impresionActions: ActionIconItem[];
  pruebasActions: ActionIconItem[];
  modoPruebasHabilitado: boolean;
  minutosModoPruebas: number;
  onAbrirModoPruebas: () => void;
  onDesactivarModoPruebas: () => void;
  filtroNumPedido: string;
  onFiltroNumPedidoChange: (value: string) => void;
  filtroPedidoDigits: string;
  pedidoGrupoAccion: PedidoGrupoRail | null;
  pedidosCoinciden: number;
  reimprimiendoComandaId: number | null;
  reimprimiendoPedidoId: number | null;
  reabririendoPedidoId: number | null;
  onReimprimirComanda: (idPedido: number) => void;
  onReimprimirPedidoTotal: (idPedido: number) => void;
  onReabrirCobro: (idPedido: number) => void;
};

function RailSection({
  title,
  actions,
  styles,
}: {
  title: string;
  actions: ActionIconItem[];
  styles: ReturnType<typeof createResumenDiarioRailStyles>;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.actionsCol}>
        {actions.map((a) => (
          <IconTooltipButton
            key={a.key}
            icon={a.icon}
            label={a.label}
            onPress={a.onPress}
            disabled={a.disabled}
            variant={a.variant}
            badge={a.badge}
            fixedSize
            size={26}
          />
        ))}
      </View>
    </View>
  );
}

/** Herramientas fijas del resumen diario (caja, impresión, búsqueda de pedido). */
export function ResumenDiarioToolsRail({
  cajaActions,
  impresionActions,
  pruebasActions,
  modoPruebasHabilitado,
  minutosModoPruebas,
  onAbrirModoPruebas,
  onDesactivarModoPruebas,
  filtroNumPedido,
  onFiltroNumPedidoChange,
  filtroPedidoDigits,
  pedidoGrupoAccion,
  pedidosCoinciden,
  reimprimiendoComandaId,
  reimprimiendoPedidoId,
  reabririendoPedidoId,
  onReimprimirComanda,
  onReimprimirPedidoTotal,
  onReabrirCobro,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useVisualTheme();
  const styles = useThemedStyles(createResumenDiarioRailStyles);
  const pedidoPagado = pedidoGrupoAccion?.pedido_estado === 'facturado';

  return (
    <AppNavChrome
      style={[
        styles.rail,
        {
          paddingTop: Math.max(insets.top, 8),
          paddingBottom: Math.max(insets.bottom, 12),
          borderLeftColor: colors.border,
        },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <RailSection title="Caja" actions={cajaActions} styles={styles} />
        <View style={styles.divider} />
        <RailSection title="Impresión" actions={impresionActions} styles={styles} />
        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pruebas</Text>
          <View style={styles.actionsCol}>
            <IconTooltipButton
              icon={modoPruebasHabilitado ? 'settings' : 'lock-closed-outline'}
              label={
                modoPruebasHabilitado
                  ? `Modo pruebas (${minutosModoPruebas} min)`
                  : 'Habilitar modo pruebas'
              }
              variant={modoPruebasHabilitado ? 'primary' : 'secondary'}
              onPress={
                modoPruebasHabilitado ? onDesactivarModoPruebas : onAbrirModoPruebas
              }
              fixedSize
              size={26}
            />
          </View>
          {modoPruebasHabilitado ? (
            <View style={styles.actionsCol}>
              {pruebasActions.map((a) => (
                <IconTooltipButton
                  key={a.key}
                  icon={a.icon}
                  label={a.label}
                  onPress={a.onPress}
                  disabled={a.disabled}
                  variant={a.variant}
                  badge={a.badge}
                  fixedSize
                  size={26}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.pedidoHint}>
              Contraseña admin para vaciar día o cancelar reabiertos
            </Text>
          )}
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pedido</Text>
          <TextInput
            style={styles.pedidoInput}
            placeholder="#"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={filtroNumPedido}
            onChangeText={onFiltroNumPedidoChange}
            accessibilityLabel="Buscar por número de pedido"
          />
          {filtroPedidoDigits ? (
            pedidoGrupoAccion ? (
              <>
                <Text style={styles.pedidoHint} numberOfLines={4}>
                  #{pedidoGrupoAccion.id_pedido} ·{' '}
                  {tituloLugarMesa(pedidoGrupoAccion.mesa_numero)}
                  {'\n'}
                  {formatCOP(pedidoGrupoAccion.total)}
                  {pedidoPagado ? ' · pagado' : ''}
                </Text>
                <View style={styles.actionsCol}>
                  <IconTooltipButton
                    icon={
                      reabririendoPedidoId === pedidoGrupoAccion.id_pedido
                        ? 'hourglass-outline'
                        : 'arrow-undo-outline'
                    }
                    label={
                      reabririendoPedidoId === pedidoGrupoAccion.id_pedido
                        ? 'Reabriendo…'
                        : 'Reabrir cobro'
                    }
                    variant="danger"
                    disabled={reabririendoPedidoId === pedidoGrupoAccion.id_pedido}
                    onPress={() => onReabrirCobro(pedidoGrupoAccion.id_pedido)}
                    fixedSize
                    size={26}
                  />
                  {pedidoPagado ? (
                    <>
                      <IconTooltipButton
                        icon={
                          reimprimiendoComandaId === pedidoGrupoAccion.id_pedido
                            ? 'hourglass-outline'
                            : AccionIcon.reimprimirComanda
                        }
                        label={
                          reimprimiendoComandaId === pedidoGrupoAccion.id_pedido
                            ? 'Imprimiendo…'
                            : 'Reimprimir comanda'
                        }
                        variant="secondary"
                        disabled={
                          reimprimiendoComandaId === pedidoGrupoAccion.id_pedido
                        }
                        onPress={() =>
                          onReimprimirComanda(pedidoGrupoAccion.id_pedido)
                        }
                        fixedSize
                        size={26}
                      />
                      <IconTooltipButton
                        icon={
                          reimprimiendoPedidoId === pedidoGrupoAccion.id_pedido
                            ? 'hourglass-outline'
                            : AccionIcon.reimprimirTotalPedido
                        }
                        label={
                          reimprimiendoPedidoId === pedidoGrupoAccion.id_pedido
                            ? 'Imprimiendo…'
                            : 'Reimprimir total'
                        }
                        variant="primary"
                        disabled={
                          reimprimiendoPedidoId === pedidoGrupoAccion.id_pedido
                        }
                        onPress={() =>
                          onReimprimirPedidoTotal(pedidoGrupoAccion.id_pedido)
                        }
                        fixedSize
                        size={26}
                      />
                    </>
                  ) : (
                    <Text style={styles.pedidoHint}>Sin cobro cerrado</Text>
                  )}
                </View>
              </>
            ) : (
              <Text style={styles.pedidoHint} numberOfLines={3}>
                {pedidosCoinciden === 0
                  ? 'Sin coincidencias'
                  : `${pedidosCoinciden} coinciden — completa el #`}
              </Text>
            )
          ) : (
            <Text style={styles.pedidoHint}>Busca por # de pedido</Text>
          )}
        </View>
      </ScrollView>
    </AppNavChrome>
  );
}

function createResumenDiarioRailStyles(c: AppColors) {
  return StyleSheet.create({
    rail: {
      width: RESUMEN_TOOLS_RAIL_WIDTH,
      flexShrink: 0,
      alignSelf: 'stretch',
      borderLeftWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        web: { boxShadow: '-2px 0 12px rgba(61,54,48,0.06)' } as object,
        default: {},
      }),
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 10,
      paddingBottom: 16,
      gap: 6,
    },
    section: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 6,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      textAlign: 'center',
    },
    actionsCol: {
      alignItems: 'center',
      gap: 10,
      width: '100%',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      marginVertical: 6,
      alignSelf: 'stretch',
    },
    pedidoInput: {
      width: '100%',
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
      backgroundColor: c.surfaceMuted,
    },
    pedidoHint: {
      fontSize: 10,
      lineHeight: 14,
      color: c.textMuted,
      textAlign: 'center',
      width: '100%',
    },
  });
}
