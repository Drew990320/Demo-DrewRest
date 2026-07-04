import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scrollBottomPadding } from '../lib/layout-constants';
import { useAppNavLayout } from './useAppNavLayout';

/** Padding inferior para FlatList / SectionList con FABs y nav globales. */
export function useScreenScrollPadding(extra = 0): number {
  const insets = useSafeAreaInsets();
  const nav = useAppNavLayout();
  return scrollBottomPadding(insets, extra, {
    bottomNav: nav.scrollBottomNav,
    sidebarNav: nav.scrollSidebarNav,
  });
}
