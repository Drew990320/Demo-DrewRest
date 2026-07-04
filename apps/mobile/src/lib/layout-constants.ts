/** Espacio inferior para no tapar contenido con FABs puntuales (p. ej. llamar mesero en cocina). */
export const FAB_BOTTOM_CLEARANCE = 64;

/** Altura aproximada de la barra de acción fija (p. ej. «Confirmar cobro»). */
export const STICKY_ACTION_BAR_HEIGHT = 80;

/** Barra inferior de navegación (icono + etiqueta). */
export const BOTTOM_NAV_BAR_HEIGHT = 56;

/** Ancho de la barra lateral en pantallas tablet+ / PC. */
export const SIDEBAR_NAV_WIDTH = 132;

/** Barra de herramientas (pedido / resumen) en el lado derecho, tablet+ / PC. */
export const RESUMEN_TOOLS_RAIL_WIDTH = 140;

type InsetsLike = { bottom: number };

type ScrollPadOpts = {
  /** Barra inferior de navegación visible (móvil / tablet). */
  bottomNav?: boolean;
  /** Barra lateral (escritorio); no suma padding inferior extra. */
  sidebarNav?: boolean;
};

/** Padding inferior estándar para scroll y listas con FABs y nav visibles. */
export function scrollBottomPadding(
  insets: InsetsLike,
  extra = 0,
  opts: ScrollPadOpts = {},
): number {
  const navPad =
    opts.bottomNav && !opts.sidebarNav
      ? BOTTOM_NAV_BAR_HEIGHT + Math.max(insets.bottom, 4)
      : Math.max(insets.bottom, 8);
  return 16 + navPad + FAB_BOTTOM_CLEARANCE + extra;
}

/** Offset inferior para FABs cuando hay barra de navegación abajo. */
export function fabBottomOffset(
  insets: InsetsLike,
  bottomNavVisible: boolean,
): number {
  const base = Math.max(insets.bottom, 12) + 8;
  return bottomNavVisible ? base + BOTTOM_NAV_BAR_HEIGHT : base;
}

/** Altura reservada en la parte inferior (nav + safe area), sin FABs. */
export function bottomChromeHeight(
  insets: InsetsLike,
  bottomNavVisible: boolean,
): number {
  if (!bottomNavVisible) return Math.max(insets.bottom, 8);
  return BOTTOM_NAV_BAR_HEIGHT + Math.max(insets.bottom, 4);
}
