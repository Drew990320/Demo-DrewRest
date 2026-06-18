import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

const GRID_GAP = 10;

export type ResponsiveLayout = {
  width: number;
  height: number;
  isWeb: boolean;
  isCompact: boolean;
  isTablet: boolean;
  isWide: boolean;
  contentPadding: number;
  contentMaxWidth: number | undefined;
  /** Ancho útil para grillas (descontando padding y tope en pantallas anchas). */
  contentWidth: number;
  gridColumns: number;
  gridGap: number;
  iconSize: number;
  iconBtnSize: number;
  mesaCardMinHeight: number;
  fontSize: {
    h1: number;
    body: number;
    small: number;
    cardNum: number;
  };
};

function contentMaxWidthFor(width: number): number | undefined {
  if (width >= 1280) return 1120;
  if (width >= 1024) return 960;
  if (width >= 768) return 720;
  return undefined;
}

function gridColumnsFor(innerWidth: number): number {
  if (innerWidth < 320) return 2;
  if (innerWidth < 440) return 3;
  if (innerWidth < 580) return 4;
  if (innerWidth < 760) return 5;
  return 6;
}

export function useResponsive(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isWeb = Platform.OS === 'web';
    const contentPadding = width < 400 ? 12 : width < 768 ? 16 : 20;
    const contentMaxWidth = contentMaxWidthFor(width);
    const contentWidth =
      (contentMaxWidth ? Math.min(width, contentMaxWidth) : width) -
      contentPadding * 2;

    const isCompact = width < 480;
    const isTablet = width >= 768 && width < 1024;
    const isWide = width >= 1024;

    const iconSize = isCompact ? 20 : isWide ? 24 : 22;
    const iconBtnSize = isCompact ? 40 : isWide ? 48 : 44;
    const mesaCardMinHeight = isCompact ? 76 : isWide ? 92 : 84;

    return {
      width,
      height,
      isWeb,
      isCompact,
      isTablet,
      isWide,
      contentPadding,
      contentMaxWidth,
      contentWidth,
      gridColumns: gridColumnsFor(contentWidth),
      gridGap: GRID_GAP,
      iconSize,
      iconBtnSize,
      mesaCardMinHeight,
      fontSize: {
        h1: isCompact ? 20 : isWide ? 28 : 24,
        body: isCompact ? 13 : 14,
        small: isCompact ? 11 : 12,
        cardNum: isCompact ? 20 : isWide ? 26 : 22,
      },
    };
  }, [width, height]);
}

/** Ancho de celda para grillas con N columnas y separación fija. */
export function gridItemWidth(
  contentWidth: number,
  columns: number,
  gap: number,
): number {
  if (columns <= 0) return contentWidth;
  return (contentWidth - gap * (columns - 1)) / columns;
}
