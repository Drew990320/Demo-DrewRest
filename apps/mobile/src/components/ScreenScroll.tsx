import type { ReactNode } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavLayout } from '../hooks/useAppNavLayout';
import { useResponsive } from '../hooks/useResponsive';
import { useVisualTheme } from '../context/VisualThemeContext';
import { scrollBottomPadding } from '../lib/layout-constants';
import { useFormStyles } from '../lib/form-layout';

type Props = {
  children: ReactNode;
  /** Fondo de la pantalla (p. ej. vista previa en personalización). */
  backgroundColor?: string;
  /** Espacio extra bajo el scroll (p. ej. barra fija de acción). */
  extraBottomPad?: number;
  /** Override del padding horizontal/superior (p. ej. responsive). */
  contentPadding?: number;
  /** Barra fija inferior fuera del scroll (p. ej. CTA de cobro). */
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
} & Omit<ScrollViewProps, 'style' | 'contentContainerStyle' | 'children'>;

/** Scroll de pantalla con padding inferior para FABs y safe area. */
export function ScreenScroll({
  children,
  backgroundColor,
  extraBottomPad = 0,
  contentPadding,
  footer,
  style,
  contentContainerStyle,
  ...scrollProps
}: Props) {
  const insets = useSafeAreaInsets();
  const nav = useAppNavLayout();
  const { colors } = useVisualTheme();
  const formStyles = useFormStyles();
  const { contentPadding: responsivePad } = useResponsive();
  const pad = contentPadding ?? responsivePad;
  const screenBg = backgroundColor ?? colors.background;
  const bottomPad = scrollBottomPadding(insets, extraBottomPad, {
    bottomNav: nav.scrollBottomNav,
    sidebarNav: nav.scrollSidebarNav,
  });

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: screenBg },
        style,
      ]}
    >
      <ScrollView
        {...scrollProps}
        style={[styles.scroll, { paddingHorizontal: pad, paddingTop: pad }]}
        contentContainerStyle={[
          formStyles.pageScrollContent,
          { paddingBottom: bottomPad },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps={
          scrollProps.keyboardShouldPersistTaps ?? 'handled'
        }
      >
        {children}
      </ScrollView>
      {footer ? (
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: pad,
              paddingBottom: Math.max(insets.bottom, 10),
              backgroundColor: screenBg,
              borderTopColor: colors.border,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...(Platform.OS === 'web'
      ? { minHeight: 0, overflow: 'hidden' as const }
      : null),
  },
  scroll: {
    flex: 1,
    ...(Platform.OS === 'web' ? { minHeight: 0 } : null),
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
