import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppNavLayout } from '../hooks/useAppNavLayout';
import { AppNavBar } from './AppNavBar';
import { AppToolsRailSlot } from '../context/ResumenDiarioToolsRailContext';

type Props = {
  children: ReactNode;
  footer?: ReactNode;
};

/** Marco principal: sidebar (tablet+) o barra inferior (móvil). El contenido usa todo el ancho disponible. */
export function AppNavShell({ children, footer }: Props) {
  const nav = useAppNavLayout();

  return (
    <View style={[styles.root, nav.sidebar && styles.rootWide]}>
      {nav.sidebar ? <AppNavBar variant="sidebar" /> : null}
      <View style={styles.main}>
        <View style={styles.content}>{children}</View>
        {footer}
        {nav.bottomBar ? <AppNavBar variant="bottom" /> : null}
      </View>
      {nav.sidebar ? <AppToolsRailSlot /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%' },
  rootWide: { flexDirection: 'row' },
  main: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    position: 'relative',
  },
  content: { flex: 1, width: '100%' },
});

export function AppNavFabLayer({ children }: { children: ReactNode }) {
  return <View style={fabStyles.layer}>{children}</View>;
}

const fabStyles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },
});
