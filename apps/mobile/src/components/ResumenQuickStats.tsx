import { StyleSheet, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { formatCOP } from '../lib/format';
import type { AppColors } from '../lib/theme';

type Props = {
  cajaInicial: number;
  efectivoVentas: number;
  transferenciaVentas: number;
  efectivoEnCaja: number;
  totalPagosMeseros?: number;
  totalDevolucionesEfectivo?: number;
  totalEntradasManual?: number;
  totalSalidasManual?: number;
  totalPagosDomicilio?: number;
  totalPagosMeseroExceso?: number;
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 12,
      gap: 8,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    gridWide: {
      flexWrap: 'nowrap',
    },
    card: {
      flexGrow: 1,
      flexBasis: '47%',
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      minWidth: 0,
    },
    cardWide: {
      flexBasis: 0,
      flex: 1,
    },
    cardHighlight: {
      backgroundColor: c.primaryLight,
      borderColor: c.primaryMuted,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    value: {
      marginTop: 4,
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    valueHighlight: {
      color: c.primaryDark,
    },
    hint: {
      fontSize: 12,
      lineHeight: 16,
      color: c.textMuted,
      paddingHorizontal: 4,
    },
  });
}

/** Métricas clave visibles sin abrir secciones del resumen diario. */
export function ResumenQuickStats({
  cajaInicial,
  efectivoVentas,
  transferenciaVentas,
  efectivoEnCaja,
  totalPagosMeseros = 0,
  totalDevolucionesEfectivo = 0,
  totalEntradasManual = 0,
  totalSalidasManual = 0,
  totalPagosDomicilio = 0,
  totalPagosMeseroExceso = 0,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const { navSidebar } = useResponsive();
  const hints: string[] = [];
  if (totalPagosMeseros > 0) {
    hints.push(`−${formatCOP(totalPagosMeseros)} en pagos a meseros`);
  }
  if (totalEntradasManual > 0) {
    hints.push(`+${formatCOP(totalEntradasManual)} en entradas de caja`);
  }
  if (totalSalidasManual > 0) {
    hints.push(`−${formatCOP(totalSalidasManual)} en salidas de caja`);
  }
  if (totalPagosDomicilio > 0) {
    hints.push(`−${formatCOP(totalPagosDomicilio)} en domicilios`);
  }
  if (totalPagosMeseroExceso > 0) {
    hints.push(`−${formatCOP(totalPagosMeseroExceso)} en mesero (exceso)`);
  }
  if (totalDevolucionesEfectivo > 0) {
    hints.push(`−${formatCOP(totalDevolucionesEfectivo)} en devoluciones`);
  }

  const cards = [
    { key: 'caja', label: 'Caja inicial', value: formatCOP(cajaInicial) },
    { key: 'ef', label: 'Ventas efectivo', value: formatCOP(efectivoVentas) },
    {
      key: 'tr',
      label: 'Ventas transferencia',
      value: formatCOP(transferenciaVentas),
    },
    {
      key: 'caja-total',
      label: 'Efectivo en caja',
      value: formatCOP(efectivoEnCaja),
      highlight: true,
    },
  ];

  return (
    <View style={styles.wrap}>
      <View style={[styles.grid, navSidebar && styles.gridWide]}>
        {cards.map((card) => (
          <View
            key={card.key}
            style={[
              styles.card,
              navSidebar && styles.cardWide,
              card.highlight && styles.cardHighlight,
            ]}
          >
            <Text style={styles.label}>{card.label}</Text>
            <Text
              style={[styles.value, card.highlight && styles.valueHighlight]}
              numberOfLines={1}
            >
              {card.value}
            </Text>
          </View>
        ))}
      </View>
      {hints.length > 0 ? (
        <Text style={styles.hint}>{hints.join(' · ')}</Text>
      ) : null}
    </View>
  );
}
