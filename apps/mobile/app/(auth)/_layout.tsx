import { Stack } from 'expo-router';
import { MOTION } from '../../src/lib/motion';
import { useVisualTheme } from '../../src/context/VisualThemeContext';

export default function AuthLayout() {
  const { colors } = useVisualTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: MOTION.normal,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}
