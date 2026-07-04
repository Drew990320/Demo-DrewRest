import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const METODOS_PAGO = ['efectivo', 'transferencia', 'mixto'] as const;
export type MetodoPagoUi = (typeof METODOS_PAGO)[number];

export const METODO_PAGO_LABEL: Record<MetodoPagoUi, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mixto: 'Mixto',
};

/**
 * Distintos del billete de «Cobrar» (cash-outline):
 * efectivo = billetera, transferencia = salida bancaria, mixto = intercambio.
 */
export const METODO_PAGO_ICON: Record<MetodoPagoUi, MciName> = {
  efectivo: 'wallet-outline',
  transferencia: 'bank-transfer-out',
  mixto: 'swap-horizontal',
};
