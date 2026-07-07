import { memo } from 'react';
import { Platform, StyleSheet, Text, View, type PressableStateCallbackType, type StyleProp, type ViewStyle } from 'react-native';
import type { MesaFormaId, MesaVistaId } from '@la-reserva/shared-domain/mesa-visual';
import type { VisualLayoutTokens } from '@la-reserva/shared-domain/visual-style';
import { AnimatedPressable } from './AnimatedPressable';
import { appShadow } from '../lib/shadow';
import type { AppColors } from '../lib/theme';
import { estiloTarjetaMesa } from '../lib/visual-theme';
import {
  mesaCardBorderStyle,
  mesaCardContentStyle,
  mesaCardLayout,
  mesaCardTextAlign,
} from '../lib/mesa-chrome';

type Props = {
  numero: string;
  subtitulo: string;
  estado: string;
  colors: AppColors;
  forma: MesaFormaId;
  vista: MesaVistaId;
  layout: VisualLayoutTokens;
  width?: number | `${number}%`;
  minHeight: number;
  compact: boolean;
  numFontSize: number;
  subFontSize: number;
  onPress?: () => void;
  disabled?: boolean;
  /** En listas verticales (web): no bloquear el scroll al arrastrar. */
  scrollFriendly?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const MesaTarjeta = memo(function MesaTarjeta({
  numero,
  subtitulo,
  estado,
  colors,
  forma,
  vista,
  layout,
  width = '100%',
  minHeight,
  compact,
  numFontSize,
  subFontSize,
  onPress,
  disabled,
  scrollFriendly,
  style,
}: Props) {
  const lista = vista === 'lista';
  const cardLayout = mesaCardLayout(forma, vista, layout, minHeight, compact);
  const visual = estiloTarjetaMesa(colors, estado);
  const textAlign = mesaCardTextAlign(lista);
  const contentStyle = mesaCardContentStyle(cardLayout, lista);

  const body = (
    <View
      style={[
        styles.card,
        mesaCardBorderStyle(colors, estado, cardLayout),
        {
          borderRadius: cardLayout.borderRadius,
          minHeight: cardLayout.minHeight,
          padding: cardLayout.padding,
          width,
          flexDirection: cardLayout.flexDirection,
          alignItems: cardLayout.alignItems,
          justifyContent: cardLayout.justifyContent,
          aspectRatio: cardLayout.aspectRatio,
        },
        style,
      ]}
    >
      <View style={contentStyle}>
        <Text
          selectable={false}
          style={[
            styles.num,
            {
              color: colors.text,
              fontSize: numFontSize * cardLayout.numFontScale,
              textAlign,
            },
          ]}
          numberOfLines={cardLayout.contentRow ? 1 : lista ? 1 : 2}
          adjustsFontSizeToFit={!cardLayout.contentRow && !lista}
          minimumFontScale={0.75}
        >
          {numero}
        </Text>
        <Text
          selectable={false}
          style={[
            styles.sub,
            {
              color: visual.text,
              fontSize: subFontSize,
              textAlign,
              marginTop: cardLayout.contentRow ? 0 : 6,
              flexShrink: lista ? 0 : undefined,
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {subtitulo}
        </Text>
      </View>
    </View>
  );

  if (!onPress) {
    return body;
  }

  if (scrollFriendly) {
    return (
      <AnimatedPressable
        disabled={disabled}
        onPress={onPress}
        style={(({ pressed }: PressableStateCallbackType) => [
          { width: '100%' },
          Platform.OS === 'web'
            ? ({ touchAction: 'pan-y', cursor: 'pointer' } as ViewStyle)
            : undefined,
          pressed ? styles.pressed : undefined,
        ]) as StyleProp<ViewStyle>}
      >
        {body}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      style={(({ pressed }: PressableStateCallbackType) => [
        { width: '100%' },
        Platform.OS === 'web' ? ({ userSelect: 'none' } as ViewStyle) : undefined,
        pressed ? styles.pressed : undefined,
      ]) as StyleProp<ViewStyle>}
    >
      {body}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    ...appShadow('elevated'),
  },
  num: {
    fontWeight: '700',
  },
  sub: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
  },
});
