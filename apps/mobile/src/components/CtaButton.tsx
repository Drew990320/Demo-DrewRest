import type { ComponentProps } from 'react';
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
import { colors } from '../lib/theme';

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

const VARIANT_BG: Record<CtaVariant, string> = {
  primary: colors.primary,
  success: colors.success,
  secondary: colors.secondary,
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
  const iconBox = isCompact ? 36 : 44;
  const iconSize = isCompact ? 20 : 22;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={inactive}
      style={[
        styles.cta,
        isCompact && styles.ctaCompact,
        { backgroundColor: VARIANT_BG[variant] },
        inactive && styles.ctaBusy,
        style,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { width: iconBox, height: iconBox },
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
        <Text style={[styles.title, isCompact && styles.titleCompact]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.sub, isCompact && styles.subCompact]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons
        name="chevron-forward"
        size={isCompact ? 18 : 20}
        color={colors.onPrimary}
        style={styles.chevron}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  ctaCompact: {
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  ctaBusy: {
    opacity: 0.85,
  },
  iconWrap: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapCompact: {
    borderRadius: 10,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
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
