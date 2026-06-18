import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Si true, centra y limita ancho en tablet/desktop (recomendado en web). */
  constrain?: boolean;
};

/** Contenedor con padding y ancho máximo adaptativo. */
export function ScreenShell({ children, style, constrain = true }: Props) {
  const { contentPadding, contentMaxWidth } = useResponsive();

  return (
    <View
      style={[
        styles.root,
        {
          paddingHorizontal: contentPadding,
          paddingVertical: contentPadding,
        },
        constrain &&
          contentMaxWidth != null && {
            maxWidth: contentMaxWidth,
            width: '100%',
            alignSelf: 'center',
          },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
  },
});
