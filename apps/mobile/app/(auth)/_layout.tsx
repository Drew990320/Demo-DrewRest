import { Stack } from 'expo-router';
import { MOTION } from '../../src/lib/motion';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: MOTION.normal,
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}
