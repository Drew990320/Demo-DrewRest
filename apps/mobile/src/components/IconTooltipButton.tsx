import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useResponsive } from '../hooks/useResponsive';
import { useVisualTheme } from '../context/VisualThemeContext';
import { MOTION, useMotionEnabled } from '../lib/motion';
import {
  iconButtonChromeStyle,
  iconButtonRadius,
} from '../lib/visual-chrome';
import { blurWebFocus } from '../lib/web-a11y';

type IonName = ComponentProps<typeof Ionicons>['name'];
type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type IconTooltipIconSet = 'ionicons' | 'material-community';

export type IconTooltipVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'cocina'
  | 'money'
  | 'danger';

type Props = {
  icon: IonName | MciName;
  iconSet?: IconTooltipIconSet;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: IconTooltipVariant;
  size?: number;
  badge?: number | string;
  style?: StyleProp<ViewStyle>;
  /** Ignora tamaños adaptativos y usa el valor fijo de `size`. */
  fixedSize?: boolean;
};

type AnchorRect = { x: number; y: number; w: number; h: number };

export function WebFloatingTooltip({
  visible,
  label,
  anchorRef,
}: {
  visible: boolean;
  label: string;
  anchorRef: RefObject<View | null>;
}) {
  const { colors } = useVisualTheme();
  const [rect, setRect] = useState<AnchorRect | null>(null);

  const updatePos = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, w, h) => {
      setRect({ x, y, w, h });
    });
  }, [anchorRef]);

  useEffect(() => {
    if (!visible) {
      setRect(null);
      return;
    }
    updatePos();
    if (typeof window === 'undefined') return;
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [visible, updatePos, colors.surface, colors.text]);

  if (
    !visible ||
    !rect ||
    Platform.OS !== 'web' ||
    typeof document === 'undefined'
  ) {
    return null;
  }

  // Portal en body: evita recorte por overflow en tarjetas / ScrollView.
  const gap = 8;
  const preferAbove = rect.y >= 52;
  const top = preferAbove ? rect.y - gap : rect.y + rect.h + gap;
  const transform = preferAbove
    ? 'translate(-50%, -100%)'
    : 'translate(-50%, 0)';
  const left = rect.x + rect.w / 2;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createPortal } = require('react-dom') as typeof import('react-dom');

  return createPortal(
    <div
      role="tooltip"
      style={{
        position: 'fixed',
        top,
        left,
        transform,
        zIndex: 99999,
        maxWidth: 280,
        backgroundColor: colors.text,
        color: colors.surface,
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        textAlign: 'center',
        lineHeight: 1.4,
        boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
        pointerEvents: 'none',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
      }}
    >
      {label}
    </div>,
    document.body,
  );
}

export function IconTooltipButton({
  icon,
  iconSet = 'ionicons',
  label,
  onPress,
  disabled = false,
  variant = 'default',
  size,
  badge,
  style,
  fixedSize = false,
}: Props) {
  const [hover, setHover] = useState(false);
  const wrapRef = useRef<View>(null);
  const showTip = Platform.OS === 'web' && hover && !disabled;
  const r = useResponsive();
  const iconSz = fixedSize ? (size ?? 26) : (size ?? r.iconSize);
  const btnSize = fixedSize ? Math.max(52, iconSz + 28) : r.iconBtnSize;
  const btnPad = fixedSize ? 14 : r.isCompact ? 10 : 12;
  const motion = useMotionEnabled();
  const { colors, chrome, layout } = useVisualTheme();
  const badgeVisible = badge != null && badge !== '' && badge !== 0;

  const iconColors = useMemo(
    (): Record<IconTooltipVariant, string> => ({
      default: colors.text,
      primary: colors.onPrimary,
      secondary: colors.text,
      cocina: colors.onPrimary,
      money: colors.onPrimary,
      danger: colors.onPrimary,
    }),
    [colors],
  );

  const variantStyles = useMemo(
    () => ({
      default: iconButtonChromeStyle(chrome, layout, colors, 'default'),
      primary: iconButtonChromeStyle(chrome, layout, colors, 'primary'),
      secondary: iconButtonChromeStyle(chrome, layout, colors, 'secondary'),
      cocina: iconButtonChromeStyle(chrome, layout, colors, 'cocina'),
      money: iconButtonChromeStyle(chrome, layout, colors, 'money'),
      danger: iconButtonChromeStyle(chrome, layout, colors, 'danger'),
    }),
    [chrome, layout, colors],
  );

  const resolvedBtnRadius = iconButtonRadius(
    chrome,
    layout,
    fixedSize ? Math.max(52, iconSz + 28) : btnSize,
  );

  const visualOpacity = useSharedValue(disabled ? 0.45 : 1);
  const badgeScale = useSharedValue(badgeVisible ? 1 : 0);

  useEffect(() => {
    if (!motion) {
      visualOpacity.value = disabled ? 0.45 : 1;
      return;
    }
    visualOpacity.value = withTiming(disabled ? 0.45 : 1, {
      duration: MOTION.normal,
    });
  }, [disabled, motion, visualOpacity]);

  useEffect(() => {
    if (!motion) {
      badgeScale.value = badgeVisible ? 1 : 0;
      return;
    }
    if (badgeVisible) {
      badgeScale.value = 1.28;
      badgeScale.value = withSpring(1, { damping: 14, stiffness: 260 });
    } else {
      badgeScale.value = withTiming(0, { duration: MOTION.fast });
    }
  }, [badgeVisible, badge, motion, badgeScale]);

  const btnAnimStyle = useAnimatedStyle(() => ({
    opacity: motion ? visualOpacity.value : disabled ? 0.45 : 1,
  }));

  const badgeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
    opacity: badgeScale.value,
  }));

  return (
    <View ref={wrapRef} style={[styles.wrap, style]} collapsable={false}>
      <WebFloatingTooltip
        visible={showTip}
        label={label}
        anchorRef={wrapRef}
      />
      <Animated.View style={btnAnimStyle}>
      <Pressable
        style={({ pressed }) => [
          styles.btn,
          {
            minWidth: btnSize,
            minHeight: btnSize,
            paddingHorizontal: btnPad,
            paddingVertical: btnPad,
            borderRadius: resolvedBtnRadius,
          },
          variantStyles[variant],
          pressed && !disabled && styles.pressed,
        ]}
        onPress={() => {
          blurWebFocus();
          onPress();
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        {...(Platform.OS === 'web'
          ? ({
              onHoverIn: () => setHover(true),
              onHoverOut: () => setHover(false),
            } as object)
          : {})}
      >
        {iconSet === 'material-community' ? (
          <MaterialCommunityIcons
            name={icon as MciName}
            size={iconSz}
            color={iconColors[variant]}
          />
        ) : (
          <Ionicons name={icon as IonName} size={iconSz} color={iconColors[variant]} />
        )}
        {badgeVisible ? (
          <Animated.View
            style={[
              styles.badge,
              badgeAnimStyle,
              {
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.cocinaDark,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: colors.cocinaDark }]}>
              {badge}
            </Text>
          </Animated.View>
        ) : null}
      </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignItems: 'center',
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
});
