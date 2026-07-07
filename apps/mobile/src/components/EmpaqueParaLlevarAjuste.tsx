import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusAlertBanner } from './StatusAlertBanner';
import { api } from '../lib/api';
import { showNotice } from '../lib/app-dialog';
import { manejarErrorAccion } from '../lib/recurso-disponible';
import { colors } from '../lib/theme';
import {
  empaqueCompartidoEnPedido,
  resumenEmpaqueParaLlevar,
  type DetalleEmpaqueResumen,
} from '../lib/empaque-para-llevar';

export type DetalleEmpaqueUi = DetalleEmpaqueResumen & {
  id_detalle: number;
};

type Props = {
  idPedido: number;
  detalles: DetalleEmpaqueUi[];
  esParaLlevar: boolean;
  token: string | null;
  onRefresh: () => Promise<void>;
  puedeEditar?: boolean;
};

export function useResumenEmpaqueParaLlevar(
  esParaLlevar: boolean,
  detalles: DetalleEmpaqueResumen[],
) {
  return useMemo(() => {
    if (!esParaLlevar) return null;
    return resumenEmpaqueParaLlevar('para_llevar', detalles);
  }, [esParaLlevar, detalles]);
}

export function EmpaqueParaLlevarBanner({
  resumen,
  puedeEditar,
  busy,
  onAgregarFaltantes,
}: {
  resumen: NonNullable<ReturnType<typeof resumenEmpaqueParaLlevar>>;
  puedeEditar?: boolean;
  busy?: boolean;
  onAgregarFaltantes: () => void;
}) {
  const compartido = empaqueCompartidoEnPedido(resumen);
  const faltantes = resumen.unidades_faltantes;

  if (faltantes <= 0 && resumen.unidades_empaque <= 0) return null;

  return (
    <View style={styles.aviso}>
      {faltantes > 0 ? (
        <>
          <StatusAlertBanner
            variant={compartido ? 'ayuda' : 'cocina'}
            title={compartido ? 'Empaque compartido' : 'Faltan empaques'}
            message={
              compartido
                ? `${resumen.unidades_plato} plato${resumen.unidades_plato === 1 ? '' : 's'} · ${resumen.unidades_empaque} empaque${resumen.unidades_empaque === 1 ? '' : 's'}. Si compartes caja, quita empaques con − antes de cobrar.`
                : `Hay ${resumen.unidades_plato} plato${resumen.unidades_plato === 1 ? '' : 's'} sin empaque (regla habitual: 1 por plato).`
            }
          />
          {puedeEditar ? (
            <Pressable
              style={[styles.btn, busy && styles.btnDisabled]}
              onPress={onAgregarFaltantes}
              disabled={busy}
            >
              <Text style={styles.btnText}>
                {busy ? 'Agregando…' : 'Agregar empaques faltantes'}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <StatusAlertBanner
          variant="ayuda"
          title="Empaque para llevar"
          message={`${resumen.unidades_plato} plato${resumen.unidades_plato === 1 ? '' : 's'} · ${resumen.unidades_empaque} empaque${resumen.unidades_empaque === 1 ? '' : 's'}. Si compartes caja, usa − en la línea de empaque.`}
        />
      )}
    </View>
  );
}

export function EmpaqueParaLlevarAjuste({
  idPedido,
  detalles,
  esParaLlevar,
  token,
  onRefresh,
  puedeEditar = true,
}: Props) {
  const [busy, setBusy] = useState(false);
  const resumen = useResumenEmpaqueParaLlevar(esParaLlevar, detalles);

  async function agregarFaltantes() {
    if (busy || !resumen || resumen.unidades_faltantes <= 0) return;
    setBusy(true);
    try {
      const res = await api<{
        unidades_agregadas?: number;
        empaques_creados?: number;
      }>(`/pedidos/${idPedido}/sincronizar-empaques`, {
        method: 'POST',
        token,
      });
      await onRefresh();
      const n = res.unidades_agregadas ?? res.empaques_creados ?? 0;
      await showNotice(
        'Empaques',
        n > 0
          ? `Se agregaron ${n} empaque${n === 1 ? '' : 's'}.`
          : 'Los empaques ya están al día.',
        n > 0 ? 'success' : 'info',
      );
    } catch (e) {
      await manejarErrorAccion(e, 'ajustar empaques');
    } finally {
      setBusy(false);
    }
  }

  if (!resumen) return null;

  return (
    <EmpaqueParaLlevarBanner
      resumen={resumen}
      puedeEditar={puedeEditar}
      busy={busy}
      onAgregarFaltantes={agregarFaltantes}
    />
  );
}

export async function reducirEmpaqueDetalle(
  empaques: DetalleEmpaqueUi[],
  token: string | null,
): Promise<void> {
  if (empaques.length === 0) return;
  const target = [...empaques].sort(
    (a, b) => b.cantidad - a.cantidad || b.id_detalle - a.id_detalle,
  )[0]!;
  if (target.cantidad <= 1) {
    await api(`/pedidos/detalles/${target.id_detalle}`, {
      method: 'DELETE',
      token,
    });
  } else {
    await api(`/pedidos/detalles/${target.id_detalle}/cantidad`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ cantidad: target.cantidad - 1 }),
    });
  }
}

const styles = StyleSheet.create({
  aviso: { marginBottom: 8, gap: 8 },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
