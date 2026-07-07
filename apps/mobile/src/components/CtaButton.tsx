import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from './AnimatedPressable';
import { useResponsive } from '../hooks/useResponsive';
import { useVisualTheme } from '../context/VisualThemeContext';
import { ctaChromeStyle } from '../lib/visual-chrome';

type IonName = ComponentProps<typeof Ionicons>['name'];

export type CtaVariant = 'primary' | 'success' | 'secondary';

type Props = {
  icon: IonName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: CtaVariant;
  style?: StyleProp<ViewStyle>;
};

const VARIANT_BG: Record<CtaVariant, (c: ReturnType<typeof useVisualTheme>['colors']) => string> = {
  primary: (c) => c.primary,
  success: (c) => c.success,
  secondary: (c) => c.secondary,
};

export function CtaButton({
  icon,
  title,
  subtitle,
  onPress,
  disabled,
  busy,
  variant = 'primary',
  style,
}: Props) {
  const inactive = disabled || busy;
  const { isCompact } = useResponsive();
  const { colors, chrome, layout } = useVisualTheme();
  const iconBox = isCompact ? 36 : 44;
  const iconSize = isCompact ? 20 : 22;
  const bg = useMemo(() => VARIANT_BG[variant](colors), [variant, colors]);
  const chromeStyles = useMemo(
    () => ctaChromeStyle(chrome, layout, bg, isCompact),
    [chrome, layout, bg, isCompact],
  );

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={inactive}
      style={[
        styles.cta,
        isCompact && styles.ctaCompact,
        chromeStyles.container,
        inactive && styles.ctaBusy,
        style,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { width: iconBox, height: iconBox },
          chromeStyles.iconWrap,
          isCompact && styles.iconWrapCompact,
        ]}
      >
        {busy ? (
          <ActivityIndicator color={colors.onPrimary} size="small" />
        ) : (
          <Ionicons name={icon} size={iconSize} color={colors.onPrimary} />
        )}
      </View>
      <View style={styles.textCol}>
        <Text
          style={[
            styles.title,
            { color: colors.onPrimary },
            chromeStyles.title,
            isCompact && styles.titleCompact,
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.sub, isCompact && styles.subCompact]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {chromeStyles.showChevron ? (
        <Ionicons
          name="chevron-forward"
          size={isCompact ? 18 : 20}
          color={colors.onPrimary}
          style={styles.chevron}
        />
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  ctaCompact: {
    gap: 8,
  },
  ctaBusy: {
    opacity: 0.85,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapCompact: {},
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 16,
  },
  titleCompact: {
    fontSize: 15,
  },
  sub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  subCompact: {
    fontSize: 12,
  },
  chevron: {
    opacity: 0.9,
    flexShrink: 0,
  },
});
