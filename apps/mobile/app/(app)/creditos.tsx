import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MoneyTextInput } from '../../src/components/MoneyTextInput';
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { useAuth } from '../../src/context/AuthContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import { useScreenScrollPadding } from '../../src/hooks/useScreenScrollPadding';
import { api } from '../../src/lib/api';
import { parseCOPDigits } from '../../src/lib/cop-input';
import { formatCOP } from '../../src/lib/format';
import { useFormStyles } from '../../src/lib/form-layout';
import { showNotice } from '../../src/lib/app-dialog';
import { manejarErrorAccion } from '../../src/lib/recurso-disponible';
import type { AppColors } from '../../src/lib/theme';

type CuentaCredito = {
  id_credito: number;
  id_pedido: number;
  mesa_numero: number | null;
  nombre_cliente: string;
  telefono: string | null;
  monto_total: number;
  saldo_pendiente: number;
  notas: string | null;
  estado: 'abierto' | 'pagado';
  creado_en: string;
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    pad: { padding: 16, gap: 12 },
    intro: { color: c.textMuted, fontSize: 13, lineHeight: 18 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      gap: 6,
    },
    nombre: { fontSize: 16, fontWeight: '800', color: c.text },
    meta: { fontSize: 13, color: c.textMuted },
    saldo: { fontSize: 15, fontWeight: '700', color: c.primary },
    empty: { color: c.textMuted, textAlign: 'center', marginTop: 24 },
    abonoRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
    abonoBtn: {
      backgroundColor: c.primary,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
    },
    abonoBtnText: { color: c.onPrimary, fontWeight: '700', fontSize: 13 },
  });
}

export default function CreditosScreen() {
  const { token } = useAuth();
  const styles = useThemedStyles(createStyles);
  const formStyles = useFormStyles();
  const listBottomPad = useScreenScrollPadding();
  const [loading, setLoading] = useState(true);
  const [cuentas, setCuentas] = useState<CuentaCredito[]>([]);
  const [abonoDigits, setAbonoDigits] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const rows = await api<CuentaCredito[]>('/creditos', { token });
    setCuentas(rows);
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        await manejarErrorAccion(e, 'cargar créditos');
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  async function registrarAbono(c: CuentaCredito) {
    const monto = parseCOPDigits(abonoDigits[c.id_credito] ?? '');
    if (monto <= 0) {
      await showNotice('Abono', 'Indica un monto válido.', 'warning');
      return;
    }
    setBusyId(c.id_credito);
    try {
      await api<CuentaCredito>(`/creditos/${c.id_credito}/abono`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ monto }),
      });
      setAbonoDigits((prev) => ({ ...prev, [c.id_credito]: '' }));
      await load();
      await showNotice('Abono registrado', 'Saldo actualizado.', 'success');
    } catch (e) {
      await manejarErrorAccion(e, 'registrar abono');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <ScreenLoading />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.pad, { paddingBottom: listBottomPad }]}
    >
      <Text style={styles.intro}>
        Cuentas por cobrar de clientes. Al cobrar una factura con método Crédito se
        crea automáticamente una cuenta aquí. Registra abonos cuando paguen.
      </Text>

      {cuentas.length === 0 ? (
        <Text style={styles.empty}>No hay créditos pendientes.</Text>
      ) : (
        cuentas.map((c) => (
          <View key={c.id_credito} style={styles.card}>
            <Text style={styles.nombre}>{c.nombre_cliente}</Text>
            <Text style={styles.meta}>
              Pedido #{c.id_pedido}
              {c.mesa_numero != null ? ` · Mesa ${c.mesa_numero}` : ''}
            </Text>
            {c.telefono ? <Text style={styles.meta}>{c.telefono}</Text> : null}
            <Text style={styles.saldo}>
              Saldo: {formatCOP(c.saldo_pendiente)} de {formatCOP(c.monto_total)}
            </Text>
            {c.notas ? <Text style={styles.meta}>{c.notas}</Text> : null}
            <View style={styles.abonoRow}>
              <MoneyTextInput
                style={[formStyles.input, { flex: 1 }]}
                placeholderAmount={c.saldo_pendiente}
                digits={abonoDigits[c.id_credito] ?? ''}
                onChangeDigits={(d) =>
                  setAbonoDigits((prev) => ({ ...prev, [c.id_credito]: d }))
                }
              />
              <Pressable
                style={styles.abonoBtn}
                disabled={busyId === c.id_credito}
                onPress={() => void registrarAbono(c)}
              >
                <Text style={styles.abonoBtnText}>
                  {busyId === c.id_credito ? '…' : 'Abonar'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
