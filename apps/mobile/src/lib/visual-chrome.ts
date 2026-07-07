import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import type {
  VisualChromeTokens,
  VisualLayoutTokens,
} from '@la-reserva/shared-domain/visual-style';
import type { AppColors } from './theme';

type IconBtnVariant = 'default' | 'primary' | 'secondary' | 'cocina' | 'money' | 'danger';

function shadowForElevation(
  level: VisualLayoutTokens['chromeElevation'],
  color = '61,54,48',
): ViewStyle {
  if (level === 'flat') return {};
  if (level === 'soft') {
    return Platform.select({
      web: { boxShadow: `0 2px 10px rgba(${color},0.1)` } as ViewStyle,
      default: { elevation: 3 },
    })!;
  }
  return Platform.select({
    web: { boxShadow: `0 6px 20px rgba(${color},0.16)` } as ViewStyle,
    default: { elevation: 8 },
  })!;
}

export function navBarChromeStyle(
  chrome: VisualChromeTokens,
  layout: VisualLayoutTokens,
  colors: AppColors,
  variant: 'bottom' | 'sidebar',
): ViewStyle {
  const base: ViewStyle =
    variant === 'bottom'
      ? {
          borderTopWidth: StyleSheetHairline,
          borderTopColor: colors.border,
        }
      : {
          borderRightWidth: StyleSheetHairline,
          borderRightColor: colors.border,
        };

  switch (chrome.navBar) {
    case 'bordered':
      return {
        ...base,
        backgroundColor: colors.backgroundAlt,
        borderTopWidth: variant === 'bottom' ? 2 : base.borderTopWidth,
        borderRightWidth: variant === 'sidebar' ? 2 : base.borderRightWidth,
        borderTopColor: colors.border,
        borderRightColor: colors.border,
      };
    case 'elevated':
      return {
        ...base,
        backgroundColor: colors.surface,
        ...shadowForElevation('soft'),
      };
    case 'floating':
      if (variant === 'bottom') {
        return {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          marginHorizontal: 10,
          marginBottom: 6,
          borderRadius: layout.radiusLg,
          borderWidth: 1,
          borderColor: colors.border,
          ...shadowForElevation('raised'),
        };
      }
      return {
        ...base,
        backgroundColor: colors.surface,
        ...shadowForElevation('raised'),
      };
    default:
      return {
        ...base,
        backgroundColor: colors.surface,
      };
  }
}

const StyleSheetHairline = Platform.select({ web: 1, default: 0.5 }) ?? 0.5;

export function navItemChromeStyle(
  chrome: VisualChromeTokens,
  layout: VisualLayoutTokens,
  colors: AppColors,
  active: boolean,
  variant: 'bottom' | 'sidebar',
): ViewStyle {
  const radius = layout.radiusMd;

  if (chrome.navActiveFilled && active) {
    return {
      backgroundColor: colors.primary,
      borderRadius: chrome.navItem === 'pill' ? 999 : radius,
      ...(variant === 'sidebar'
        ? { borderLeftWidth: 0 }
        : { borderTopWidth: 0 }),
    };
  }

  switch (chrome.navItem) {
    case 'solid':
      return active
        ? {
            backgroundColor: colors.primary,
            borderRadius: radius,
          }
        : { backgroundColor: 'transparent' };
    case 'pill':
      return {
        backgroundColor: active ? colors.primarySoft : 'transparent',
        borderRadius: 999,
        ...(active
          ? { borderWidth: 1, borderColor: colors.primaryMuted }
          : null),
      };
    case 'underline':
      if (!active) return { backgroundColor: 'transparent' };
      return variant === 'sidebar'
        ? {
            backgroundColor: colors.backgroundAlt,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
            borderRadius: layout.radiusSm,
          }
        : {
            backgroundColor: colors.backgroundAlt,
            borderTopWidth: 3,
            borderTopColor: colors.primary,
            borderRadius: layout.radiusSm,
          };
    default:
      return {
        backgroundColor: active ? colors.primaryLight : 'transparent',
        borderRadius: radius,
      };
  }
}

export function navItemIconColor(
  chrome: VisualChromeTokens,
  colors: AppColors,
  active: boolean,
): string {
  if ((chrome.navActiveFilled || chrome.navItem === 'solid') && active) {
    return colors.onPrimary;
  }
  return active ? colors.primaryDark : colors.textMuted;
}

export function navItemLabelStyle(
  chrome: VisualChromeTokens,
  colors: AppColors,
  active: boolean,
  layout: VisualLayoutTokens,
): TextStyle {
  const solidActive =
    active && (chrome.navActiveFilled || chrome.navItem === 'solid');

  return {
    color: solidActive ? colors.onPrimary : active ? colors.primaryDark : colors.textMuted,
    fontWeight: active ? layout.titleWeight : '600',
  };
}

export function iconButtonRadius(
  chrome: VisualChromeTokens,
  layout: VisualLayoutTokens,
  btnSize: number,
): number {
  if (chrome.iconButton === 'bold') return btnSize / 2;
  if (chrome.iconButton === 'outline') return layout.radiusSm;
  if (chrome.cta === 'rounded' || chrome.navItem === 'pill') return layout.radiusLg;
  return layout.radiusMd;
}

export function iconButtonChromeStyle(
  chrome: VisualChromeTokens,
  layout: VisualLayoutTokens,
  colors: AppColors,
  variant: IconBtnVariant,
): ViewStyle {
  const bw = chrome.iconButtonBorderWidth;
  const elevated = chrome.iconButton === 'bold' || chrome.iconButton === 'filled';

  const baseVariant = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primaryDark,
        };
      case 'cocina':
        return {
          backgroundColor: colors.cocina,
          borderColor: colors.cocinaDark,
        };
      case 'money':
        return {
          backgroundColor: colors.success,
          borderColor: colors.successDark,
        };
      case 'danger':
        return {
          backgroundColor: colors.danger,
          borderColor: colors.dangerDark,
        };
      case 'secondary':
        return {
          backgroundColor: colors.backgroundAlt,
          borderColor: colors.border,
        };
      default:
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        };
    }
  };

  const style = baseVariant();

  if (chrome.iconButton === 'outline') {
    return {
      ...style,
      borderWidth: bw,
      backgroundColor: variant === 'default' || variant === 'secondary'
        ? colors.surface
        : style.backgroundColor,
    };
  }

  if (chrome.iconButton === 'soft') {
    return {
      ...style,
      borderWidth: bw,
      ...(variant === 'default'
        ? { backgroundColor: colors.surface }
        : null),
    };
  }

  if (chrome.iconButton === 'bold' || chrome.iconButton === 'filled') {
    return {
      ...style,
      borderWidth: bw,
      ...(elevated && variant !== 'default' && variant !== 'secondary'
        ? shadowForElevation(layout.chromeElevation)
        : null),
    };
  }

  return { ...style, borderWidth: bw };
}

export function ctaChromeStyle(
  chrome: VisualChromeTokens,
  layout: VisualLayoutTokens,
  bg: string,
  isCompact: boolean,
): { container: ViewStyle; iconWrap: ViewStyle; title: TextStyle; showChevron: boolean } {
  switch (chrome.cta) {
    case 'corporate':
      return {
        container: {
          backgroundColor: bg,
          borderRadius: layout.radiusSm,
          paddingVertical: isCompact ? 10 : 12,
          paddingHorizontal: isCompact ? 12 : 14,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.08)',
        },
        iconWrap: {
          borderRadius: layout.radiusSm,
          backgroundColor: 'rgba(255,255,255,0.12)',
        },
        title: { fontWeight: layout.titleWeight },
        showChevron: true,
      };
    case 'rounded':
      return {
        container: {
          backgroundColor: bg,
          borderRadius: 999,
          paddingVertical: isCompact ? 12 : 16,
          paddingHorizontal: isCompact ? 16 : 20,
          ...shadowForElevation('soft'),
        },
        iconWrap: {
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.2)',
        },
        title: { fontWeight: '600' },
        showChevron: false,
      };
    case 'chunky':
      return {
        container: {
          backgroundColor: bg,
          borderRadius: layout.radiusLg,
          paddingVertical: isCompact ? 16 : 18,
          paddingHorizontal: isCompact ? 14 : 18,
          borderWidth: 2,
          borderColor: 'rgba(0,0,0,0.12)',
          ...shadowForElevation('raised'),
        },
        iconWrap: {
          borderRadius: layout.radiusMd,
          backgroundColor: 'rgba(255,255,255,0.22)',
        },
        title: { fontWeight: '800', fontSize: isCompact ? 16 : 17 },
        showChevron: true,
      };
    default:
      return {
        container: {
          backgroundColor: bg,
          borderRadius: layout.radiusMd,
          paddingVertical: isCompact ? 12 : 14,
          paddingHorizontal: isCompact ? 12 : 16,
        },
        iconWrap: {
          borderRadius: layout.radiusMd,
          backgroundColor: 'rgba(255,255,255,0.18)',
        },
        title: { fontWeight: layout.titleWeight },
        showChevron: true,
      };
  }
}

export function actionBarChromeStyle(
  chrome: VisualChromeTokens,
  layout: VisualLayoutTokens,
  colors: AppColors,
  backgroundColor?: string,
): ViewStyle {
  const bg = backgroundColor ?? colors.backgroundAlt;
  if (chrome.navBar === 'floating' || chrome.navBar === 'elevated') {
    return {
      backgroundColor: bg,
      borderBottomWidth: 0,
      ...shadowForElevation(layout.chromeElevation === 'flat' ? 'soft' : layout.chromeElevation),
    };
  }
  if (chrome.navBar === 'bordered') {
    return {
      backgroundColor: bg,
      borderBottomWidth: 2,
      borderBottomColor: colors.border,
    };
  }
  return {
    backgroundColor: bg,
    borderBottomWidth: StyleSheetHairline,
    borderBottomColor: colors.border,
  };
}
