import { StyleSheet, Text, View } from 'react-native';
import { AccionIcon } from '../lib/app-icons';
import { formatCOP } from '../lib/format';
import { tituloLugarMesa } from '../lib/mesa-label';
import { colors } from '../lib/theme';
import { ActionIconBar, type ActionIconItem } from './ActionIconBar';

type PedidoGrupo = {
  id_pedido: number;
  mesa_numero: number;
  pedido_estado: string;
  total: number;
};

type Props = {
  grupo: PedidoGrupo;
  reabririendoPedidoId: number | null;
  reimprimiendoComandaId: number | null;
  reimprimiendoPedidoId: number | null;
  onReabrir: (idPedido: number) => void;
  onReimprimirComanda: (idPedido: number) => void;
  onReimprimirTotal: (idPedido: number) => void;
};

/** Acciones de un pedido seleccionado, fuera del árbol de mesas. */
export function ResumenPedidoAccionesBar({
  grupo,
  reabririendoPedidoId,
  reimprimiendoComandaId,
  reimprimiendoPedidoId,
  onReabrir,
  onReimprimirComanda,
  onReimprimirTotal,
}: Props) {
  const pagado = grupo.pedido_estado === 'facturado';
  const actions: ActionIconItem[] = [
    {
      key: 'reabrir',
      icon:
        reabririendoPedidoId === grupo.id_pedido
          ? 'hourglass-outline'
          : 'arrow-undo-outline',
      label:
        reabririendoPedidoId === grupo.id_pedido ? 'Reabriendo…' : 'Reabrir cobro',
      variant: 'danger',
      disabled: reabririendoPedidoId === grupo.id_pedido,
      onPress: () => onReabrir(grupo.id_pedido),
    },
  ];

  if (pagado) {
    actions.push(
      {
        key: 'comanda',
        icon:
          reimprimiendoComandaId === grupo.id_pedido
            ? 'hourglass-outline'
            : AccionIcon.reimprimirComanda,
        label:
          reimprimiendoComandaId === grupo.id_pedido
            ? 'Imprimiendo…'
            : 'Reimprimir comanda',
        variant: 'secondary',
        disabled: reimprimiendoComandaId === grupo.id_pedido,
        onPress: () => onReimprimirComanda(grupo.id_pedido),
      },
      {
        key: 'total',
        icon:
          reimprimiendoPedidoId === grupo.id_pedido
            ? 'hourglass-outline'
            : AccionIcon.reimprimirTotalPedido,
        label:
          reimprimiendoPedidoId === grupo.id_pedido
            ? 'Imprimiendo…'
            : 'Reimprimir total',
        variant: 'primary',
        disabled: reimprimiendoPedidoId === grupo.id_pedido,
        onPress: () => onReimprimirTotal(grupo.id_pedido),
      },
    );
  }

  return (
    <View style={styles.bar}>
      <Text style={styles.meta} numberOfLines={2}>
        Pedido #{grupo.id_pedido} · {tituloLugarMesa(grupo.mesa_numero)} ·{' '}
        {formatCOP(grupo.total)}
        {pagado ? ' · pagado' : ''}
      </Text>
      <ActionIconBar style={styles.actions} actions={actions} />
      {!pagado ? (
        <Text style={styles.hint}>
          Sin cobro cerrado; solo puedes reabrir si aplica.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  meta: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
  },
  actions: {
    justifyContent: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
});
