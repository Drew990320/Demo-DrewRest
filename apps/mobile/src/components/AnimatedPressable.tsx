import type { ReactNode } from 'react';
import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { blurWebFocus } from '../lib/web-a11y';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Escala al presionar (default 0.97). */
  pressScale?: number;
};

function WebPressable({
  children,
  style,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
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

function NativeAnimatedPressable({
  children,
  style,
  pressScale = 0.97,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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

/** Pressable con feedback de escala ligero (nativo). En web usa Pressable simple. */
export function AnimatedPressable(props: Props) {
  if (Platform.OS === 'web') {
    return <WebPressable {...props} />;
  }
  return <NativeAnimatedPressable {...props} />;
}
