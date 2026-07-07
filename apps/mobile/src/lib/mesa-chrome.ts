import type { ViewStyle } from 'react-native';
import type { MesaFormaId, MesaVistaId } from '@la-reserva/shared-domain/mesa-visual';
import type { VisualLayoutTokens } from '@la-reserva/shared-domain/visual-style';
import type { AppColors } from './theme';
import { estiloTarjetaMesa } from './visual-theme';

export type MesaCardLayout = {
  borderRadius: number;
  minHeight: number;
  padding: number;
  aspectRatio?: number;
  flexDirection: 'column' | 'row';
  alignItems: 'center' | 'flex-start' | 'stretch';
  justifyContent: 'center' | 'space-between' | 'flex-start';
  accentSide: 'left' | 'top' | 'none';
  accentWidth: number;
  numFontScale: number;
  gap: number;
  /** Contenido en fila (número + estado lado a lado). */
  contentRow: boolean;
};

export function mesaGridColumns(
  baseCols: number,
  vista: MesaVistaId,
  forma: MesaFormaId = 'rectangular',
): number {
  if (vista === 'lista') return 1;
  if (forma === 'barra') {
    if (vista === 'compacta') return Math.min(baseCols, 3);
    return Math.min(baseCols, 4);
  }
  if (vista === 'compacta') return Math.min(baseCols + 2, 8);
  return baseCols;
}

export function mesaCardLayout(
  forma: MesaFormaId,
  vista: MesaVistaId,
  layout: VisualLayoutTokens,
  baseMinHeight: number,
  compact: boolean,
): MesaCardLayout {
  const lista = vista === 'lista';
  const compacta = vista === 'compacta';
  const cardRadius = layout.radiusMd;

  switch (forma) {
    case 'redonda':
      return {
        borderRadius: 9999,
        minHeight: compacta ? baseMinHeight * 0.72 : baseMinHeight * 0.88,
        padding: compact ? 8 : 10,
        aspectRatio: lista ? undefined : 1,
        flexDirection: lista ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: lista ? 'space-between' : 'center',
        accentSide: lista ? 'left' : 'none',
        accentWidth: 4,
        numFontScale: compacta ? 0.88 : 1,
        gap: lista ? 10 : 4,
        contentRow: lista,
      };
    case 'cuadrada':
      return {
        borderRadius: Math.max(4, cardRadius * 0.45),
        minHeight: compacta ? baseMinHeight * 0.78 : baseMinHeight,
        padding: compact ? 8 : 12,
        aspectRatio: lista ? undefined : 1,
        flexDirection: lista ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: lista ? 'space-between' : 'center',
        accentSide: 'left',
        accentWidth: 5,
        numFontScale: 1,
        gap: lista ? 12 : 4,
        contentRow: lista,
      };
    case 'barra':
      return {
        borderRadius: Math.max(10, cardRadius),
        minHeight: lista
          ? baseMinHeight * 0.68
          : compacta
            ? baseMinHeight * 0.58
            : baseMinHeight * 0.66,
        padding: lista ? 12 : compact ? 8 : 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: lista ? 'space-between' : 'center',
        accentSide: 'left',
        accentWidth: 5,
        numFontScale: 1,
        gap: lista ? 12 : 8,
        contentRow: true,
      };
    default:
      return {
        borderRadius: cardRadius,
        minHeight: compacta ? baseMinHeight * 0.8 : baseMinHeight,
        padding: compact ? 10 : 12,
        flexDirection: lista ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: lista ? 'space-between' : 'center',
        accentSide: 'left',
        accentWidth: 5,
        numFontScale: 1,
        gap: lista ? 12 : 4,
        contentRow: lista,
      };
  }
}

export function mesaCardBorderStyle(
  colors: AppColors,
  estado: string,
  cardLayout: MesaCardLayout,
): ViewStyle {
  const v = estiloTarjetaMesa(colors, estado);
  const esMesa = estado === 'libre' || estado === 'ocupada';
  const base: ViewStyle = {
    backgroundColor: v.backgroundColor,
    borderColor: v.borderColor,
    borderWidth: esMesa ? 2 : StyleSheetHairline,
  };

  if (cardLayout.accentSide === 'left') {
    return {
      ...base,
      borderLeftWidth: cardLayout.accentWidth,
      borderLeftColor: v.accent,
    };
  }
  if (cardLayout.accentSide === 'top') {
    return {
      ...base,
      borderTopWidth: cardLayout.accentWidth,
      borderTopColor: v.accent,
    };
  }
  return base;
}

const StyleSheetHairline = 0.5;

export function mesaCardContentStyle(
  cardLayout: MesaCardLayout,
  lista: boolean,
): ViewStyle {
  if (cardLayout.contentRow) {
    if (lista) {
      return {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: cardLayout.gap,
        minWidth: 0,
      };
    }
    return {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: cardLayout.gap,
      flex: 1,
      width: '100%',
      flexWrap: 'wrap',
    };
  }
  return {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    flex: 1,
    width: '100%',
  };
}

export function mesaCardTextAlign(lista: boolean): 'left' | 'center' {
  return lista ? 'left' : 'center';
}
