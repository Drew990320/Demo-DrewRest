import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { IconTooltipButton, type IconTooltipVariant } from './IconTooltipButton';

type IonName = ComponentProps<typeof Ionicons>['name'];

export type ActionIconItem = {
  key: string;
  icon: IonName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: IconTooltipVariant;
  badge?: number | string;
};

type Props = {
  actions: ActionIconItem[];
  style?: StyleProp<ViewStyle>;
};

/** Fila horizontal de botones solo icono con tooltip al pasar el cursor (web). */
export function ActionIconBar({ actions, style }: Props) {
  const { isCompact, gridGap } = useResponsive();

  return (
    <View
      style={[
        styles.row,
        { gap: isCompact ? 8 : gridGap },
        style,
      ]}
    >
      {actions.map((a) => (
        <IconTooltipButton
          key={a.key}
          icon={a.icon}
          label={a.label}
          onPress={a.onPress}
          disabled={a.disabled}
          variant={a.variant}
          badge={a.badge}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    ...Platform.select({
      web: { overflow: 'visible' } as object,
      default: {},
    }),
  },
});
