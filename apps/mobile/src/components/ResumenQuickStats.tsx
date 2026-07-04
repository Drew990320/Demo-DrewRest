import { StyleSheet, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { formatCOP } from '../lib/format';
import { colors } from '../lib/theme';

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
        {cards.map((c) => (
          <StatCard
            key={c.key}
            label={c.label}
            value={c.value}
            highlight={c.highlight}
            wide={navSidebar}
          />
        ))}
      </View>
      {hints.length > 0 ? (
        <Text style={styles.hint}>Incluye {hints.join(' · ')}.</Text>
      ) : null}
    </View>
  );
}

function StatCard({
  label,
  value,
  highlight,
  wide,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  wide?: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        wide && styles.cardWide,
        highlight && styles.cardHighlight,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlight && styles.valueHighlight]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    minWidth: 0,
  },
  cardWide: {
    flexBasis: 0,
    flex: 1,
  },
  cardHighlight: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryMuted,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  valueHighlight: {
    color: colors.primaryDark,
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    paddingHorizontal: 4,
  },
});
