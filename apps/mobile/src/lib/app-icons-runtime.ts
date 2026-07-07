import {
  ACTION_ICON_DEFAULTS,
  resolverIconoAccion,
  type ActionIconKey,
} from '@la-reserva/shared-domain/action-app-icon';
import type { NavAppIconId } from '@la-reserva/shared-domain/nav-app-icon';

let overrides: Partial<Record<ActionIconKey, NavAppIconId>> = {};

export function setActionIconOverrides(
  map: Partial<Record<ActionIconKey, string>>,
): void {
  const next: Partial<Record<ActionIconKey, NavAppIconId>> = {};
  for (const [key, val] of Object.entries(map)) {
    if (key in ACTION_ICON_DEFAULTS && typeof val === 'string') {
      next[key as ActionIconKey] = val as NavAppIconId;
    }
  }
  overrides = next;
}

export function resolveActionIcon(key: ActionIconKey): NavAppIconId {
  return resolverIconoAccion(key, overrides[key]);
}

export function clearActionIconOverrides(): void {
  overrides = {};
}
