import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import {
  esMesaMostradorNumero,
  esMesaParaLlevarNumero,
  type MesasVirtualesConfig,
} from '@la-reserva/shared-domain/mesa-label';
import { NavIcon } from '../lib/app-icons';
import { colors } from '../lib/theme';

const ICON_BOX = 28;

type Props = {
  mesaNumero: number;
  config?: MesasVirtualesConfig | null;
  color?: string;
  size?: number;
};

/**
 * Icono de lugar del pedido: mesa (número dentro), mostrador o para llevar.
 * Tamaño fijo para alinear chips y pills.
 */
export function LugarPedidoIcon({
  mesaNumero,
  config,
  color = colors.text,
  size = ICON_BOX,
}: Props) {
  if (esMesaMostradorNumero(mesaNumero, config)) {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <Ionicons name={NavIcon.mostrador} size={size * 0.78} color={color} />
      </View>
    );
  }

  if (esMesaParaLlevarNumero(mesaNumero, config)) {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <Ionicons name={NavIcon.paraLlevar} size={size * 0.78} color={color} />
      </View>
    );
  }

  const fontSize = mesaNumero >= 100 ? size * 0.38 : size * 0.46;

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={[
          styles.mesaTop,
          {
            width: size * 0.92,
            height: size * 0.72,
            borderColor: color,
          },
        ]}
      >
        <Text
          style={[styles.mesaNum, { color, fontSize, lineHeight: fontSize + 2 }]}
          numberOfLines={1}
        >
          {mesaNumero}
        </Text>
      </View>
      <View style={styles.mesaLegs}>
        <View style={[styles.mesaLeg, { backgroundColor: color }]} />
        <View style={[styles.mesaLeg, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mesaTop: {
    borderWidth: 2,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  mesaNum: {
    fontWeight: '800',
    textAlign: 'center',
  },
  mesaLegs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '58%',
    marginTop: 1,
  },
  mesaLeg: {
    width: 2,
    height: 4,
    borderRadius: 1,
  },
});
