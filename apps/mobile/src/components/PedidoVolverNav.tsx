import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ActionIconBar } from './ActionIconBar';
import { AccionIcon, AdminIcon } from '../lib/app-icons';
import { formStyles } from '../lib/form-layout';
import { colors } from '../lib/theme';

type Props = {
  idMesa?: number | null;
  style?: StyleProp<ViewStyle>;
  /** Texto opcional bajo los botones (p. ej. en menú del pedido). */
  hint?: string;
  disabled?: boolean;
};

/** Volver a la mesa del pedido o al listado de mesas (inicio operativo). */
export function PedidoVolverNav({ idMesa, style, hint, disabled }: Props) {
  const router = useRouter();

  return (
    <View style={style}>
      <ActionIconBar
        style={formStyles.screenActions}
        actions={[
          ...(idMesa != null
            ? [
                {
                  key: 'mesa',
                  icon: AccionIcon.confirmarEnMesa,
                  label: 'Volver a mesa',
                  variant: 'primary' as const,
                  disabled,
                  onPress: () => router.replace(`/(app)/mesa/${idMesa}`),
                },
              ]
            : []),
          {
            key: 'mesas',
            icon: AdminIcon.volverMesas,
            label: 'Volver a mesas',
            variant: idMesa != null ? ('secondary' as const) : ('primary' as const),
            disabled,
            onPress: () => router.replace('/(app)/mesas'),
          },
        ]}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    textAlign: 'center',
  },
});
