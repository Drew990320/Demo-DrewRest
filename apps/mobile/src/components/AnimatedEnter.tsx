import type { ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MOTION, staggerDelay } from '../lib/motion';

type Props = {
  children: ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
};

/** Entrada suave con escalonado opcional (listas, tarjetas). */
export function AnimatedEnter({ children, index = 0, style }: Props) {
  if (Platform.OS === 'web') {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(staggerDelay(index))
        .duration(MOTION.normal)
        .springify()
        .damping(22)
        .stiffness(280)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
