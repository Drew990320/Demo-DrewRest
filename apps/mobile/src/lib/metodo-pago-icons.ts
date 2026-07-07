import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { MetodoPagoUi } from './metodo-pago-ui';
import { resolveActionIcon } from './app-icons-runtime';

type IonName = ComponentProps<typeof Ionicons>['name'];

const PAGO_KEYS: Record<
  MetodoPagoUi,
  'pago_efectivo' | 'pago_transferencia' | 'pago_mixto' | 'pago_credito'
> = {
  efectivo: 'pago_efectivo',
  transferencia: 'pago_transferencia',
  mixto: 'pago_mixto',
  credito: 'pago_credito',
};

/** Iconos de método de pago (Ionicons, personalizables). */
export function metodoPagoIcon(metodo: MetodoPagoUi): IonName {
  return resolveActionIcon(PAGO_KEYS[metodo]) as IonName;
}

/** @deprecated Usar metodoPagoIcon() */
export const METODO_PAGO_ICON = new Proxy({} as Record<MetodoPagoUi, IonName>, {
  get(_target, prop: string) {
    if (
      prop === 'efectivo' ||
      prop === 'transferencia' ||
      prop === 'mixto' ||
      prop === 'credito'
    ) {
      return metodoPagoIcon(prop);
    }
    return undefined;
  },
});
