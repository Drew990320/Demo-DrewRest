import { StyleSheet, Text, View } from 'react-native';
import { PedidoIcon } from '../lib/app-icons';
import type { MesasVirtualesConfig } from '../lib/mesa-label';
import {
  esMesaMostradorNumero,
  esMesaParaLlevarNumero,
} from '../lib/mesa-label';
import { useMesasVirtuales } from '../hooks/useMesasVirtuales';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { appShadow } from '../lib/shadow';
import type { AppColors } from '../lib/theme';
import { CtaButton } from './CtaButton';

type Props = {
  mesaNumero: number;
  modo: 'inicial' | 'otro';
  busy: boolean;
  onAbrir: () => void;
};

function copyPanel(
  mesaNumero: number,
  modo: Props['modo'],
  cfg: MesasVirtualesConfig,
) {
  if (esMesaParaLlevarNumero(mesaNumero, cfg)) {
    return modo === 'otro'
      ? {
          titulo: 'Nuevo cliente',
          subtitulo: 'Otro ticket en la cola',
          icon: PedidoIcon.nuevoParaLlevar,
        }
      : {
          titulo: 'Abrir pedido',
          subtitulo: 'Para llevar',
          icon: PedidoIcon.nuevoParaLlevar,
        };
  }
  if (esMesaMostradorNumero(mesaNumero, cfg)) {
    return modo === 'otro'
      ? {
          titulo: 'Nuevo cliente',
          subtitulo: 'Otro ticket de bebidas',
          icon: PedidoIcon.nuevaVentaBebidas,
        }
      : {
          titulo: 'Nueva venta',
          subtitulo: 'Mostrador · solo bebidas',
          icon: PedidoIcon.nuevaVentaBebidas,
        };
  }
  return modo === 'otro'
    ? {
        titulo: 'Nuevo pedido',
        subtitulo: 'Otro ticket en esta mesa',
        icon: PedidoIcon.abrirMesa,
      }
    : {
        titulo: 'Abrir mesa',
        subtitulo: 'Nuevo pedido en el salón',
        icon: PedidoIcon.abrirMesa,
      };
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      gap: 12,
    },
    wrapOtro: {
      marginTop: 4,
      padding: 14,
      borderRadius: 14,
      backgroundColor: c.backgroundAlt,
      borderWidth: 1,
      borderColor: c.border,
      ...appShadow('soft'),
    },
    kickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    kickerDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.secondary,
    },
    kicker: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: c.textMuted,
    },
  });
}

export function PanelNuevoTicketVirtual({
  mesaNumero,
  modo,
  busy,
  onAbrir,
}: Props) {
  const { config } = useMesasVirtuales();
  const styles = useThemedStyles(createStyles);
  const { titulo, subtitulo, icon } = copyPanel(mesaNumero, modo, config);

  return (
    <View style={[styles.wrap, modo === 'otro' && styles.wrapOtro]}>
      {modo === 'otro' ? (
        <View style={styles.kickerRow}>
          <View style={styles.kickerDot} />
          <Text style={styles.kicker}>Agregar a la cola</Text>
        </View>
      ) : null}

      <CtaButton
        icon={icon}
        title={titulo}
        subtitle={subtitulo}
        onPress={onAbrir}
        busy={busy}
      />
    </View>
  );
}
