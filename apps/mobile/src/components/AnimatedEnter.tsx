import type { ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MOTION, staggerDelay, useMotionEnabled } from '../lib/motion';

type Props = {
  children: ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
};

/** Entrada suave con escalonado opcional (listas, tarjetas, banners). */
export function AnimatedEnter({ children, index = 0, style }: Props) {
  const motion = useMotionEnabled();

  if (!motion) {
    return <View style={style}>{children}</View>;
  }

  const delay = staggerDelay(index);
  const entering =
    Platform.OS === 'web'
      ? FadeIn.delay(delay).duration(MOTION.fast)
      : FadeInDown.delay(delay)
          .duration(MOTION.normal)
          .springify()
          .damping(22)
          .stiffness(280);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
