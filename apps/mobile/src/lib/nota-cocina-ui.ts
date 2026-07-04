import { limpiarNotaCocinaTicket } from '@la-reserva/shared-domain/factura-lineas-group';
import {
  nombreProductoCuotaPendienteDisplay,
  parseCuotaPendienteNota,
} from '@la-reserva/shared-domain/cuota-pendiente-reparto';

/** Oculta etiquetas internas (mixto, combinado, cuota_pendiente) en pantalla. */
export function notaCocinaVisibleUsuario(
  nota: string | null | undefined,
): string | null {
  return limpiarNotaCocinaTicket(nota);
}

/** Nombre legible; cuotas pendientes incluyen la persona. */
export function nombreLineaPedidoVisible(
  nombre: string,
  nota: string | null | undefined,
): string {
  if (parseCuotaPendienteNota(nota)) {
    return nombreProductoCuotaPendienteDisplay(nombre, nota);
  }
  return nombre;
}
