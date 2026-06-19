import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { MOTION, useMotionEnabled } from '../lib/motion';
import { blurWebFocus } from '../lib/web-a11y';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Escala al presionar (default 0.97). */
  pressScale?: number;
};

/** Pressable con feedback de escala ligero (web y nativo). */
export function AnimatedPressable({
  children,
  style,
  pressScale = MOTION.pressScale,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const motion = useMotionEnabled();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!motion) {
    return (
      <Pressable
        {...rest}
        style={style}
        onPress={(e) => {
          onPress?.(e);
          blurWebFocus();
        }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <AnimatedPressableBase
      {...rest}
      style={[style, animatedStyle]}
      onPress={(e) => {
        onPress?.(e);
        blurWebFocus();
      }}
      onPressIn={(e) => {
        scale.value = withSpring(pressScale, { damping: 18, stiffness: 420 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 18, stiffness: 420 });
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressableBase>
  );
}
