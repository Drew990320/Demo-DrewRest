import { Platform } from 'react-native';

type ScrollTarget = {
  scrollToOffset?: (opts: { offset: number; animated?: boolean }) => void;
  getScrollResponder?: () => {
    scrollTo?: (opts: { x?: number; y: number; animated?: boolean }) => void;
  } | null;
  getScrollableNode?: () => HTMLElement | null;
  _listRef?: {
    _scrollRef?: {
      scrollToOffset?: (opts: { offset: number; animated?: boolean }) => void;
      getScrollableNode?: () => HTMLElement | null;
      scrollTo?: (opts: { y: number; animated?: boolean }) => void;
    };
  };
};

/** Scroll vertical en SectionList (native + react-native-web). */
export function scrollSectionListToY(
  list: ScrollTarget | null | undefined,
  offset: number,
  animated = true,
): boolean {
  if (!list) return false;

  if (typeof list.scrollToOffset === 'function') {
    list.scrollToOffset({ offset, animated });
    return true;
  }

  const responder = list.getScrollResponder?.();
  if (responder && typeof responder.scrollTo === 'function') {
    responder.scrollTo({ y: offset, animated });
    return true;
  }

  const innerScroll = list._listRef?._scrollRef;
  if (innerScroll && typeof innerScroll.scrollToOffset === 'function') {
    innerScroll.scrollToOffset({ offset, animated });
    return true;
  }
  if (innerScroll && typeof innerScroll.scrollTo === 'function') {
    innerScroll.scrollTo({ y: offset, animated });
    return true;
  }

  const node =
    list.getScrollableNode?.() ?? innerScroll?.getScrollableNode?.() ?? null;

  if (node) {
    if (typeof node.scrollTo === 'function') {
      node.scrollTo({
        top: offset,
        behavior: animated ? 'smooth' : 'auto',
      });
      return true;
    }
    if ('scrollTop' in node) {
      node.scrollTop = offset;
      return true;
    }
  }

  return false;
}

/** Si el encabezado ya está montado (web), scroll directo al nodo. */
export function scrollHeaderIntoView(
  header: unknown,
  animated = true,
): boolean {
  if (Platform.OS !== 'web' || !header) return false;
  const el = header as HTMLElement;
  if (typeof el.scrollIntoView !== 'function') return false;
  el.scrollIntoView({
    behavior: animated ? 'smooth' : 'auto',
    block: 'start',
  });
  return true;
}
