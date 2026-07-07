import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { MetodoPagoUi } from './metodo-pago-ui';
import { resolveActionIcon } from './app-icons-runtime';

type IonName = ComponentProps<typeof Ionicons>['name'];

const PAGO_KEYS: Record<MetodoPagoUi, 'pago_efectivo' | 'pago_transferencia' | 'pago_mixto'> = {
  efectivo: 'pago_efectivo',
  transferencia: 'pago_transferencia',
  mixto: 'pago_mixto',
};

/** Iconos de método de pago (Ionicons, personalizables). */
export function metodoPagoIcon(metodo: MetodoPagoUi): IonName {
  return resolveActionIcon(PAGO_KEYS[metodo]) as IonName;
}

/** @deprecated Usar metodoPagoIcon() */
export const METODO_PAGO_ICON = new Proxy({} as Record<MetodoPagoUi, IonName>, {
  get(_target, prop: string) {
    if (prop === 'efectivo' || prop === 'transferencia' || prop === 'mixto') {
      return metodoPagoIcon(prop);
    }
    return undefined;
  },
});
