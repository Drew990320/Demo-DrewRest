import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { formShellStyle } from '../lib/form-layout';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

/** Contenedor de formulario con ancho máximo centrado en pantallas anchas. */
export function FormCard({ children, style }: Props) {
  const r = useResponsive();
  return (
    <View style={[formShellStyle(r.width, r.contentMaxWidth, 'page'), style]}>
      {children}
    </View>
  );
}
