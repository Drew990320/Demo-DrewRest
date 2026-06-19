import type { DiasSemanaSnake } from './dias-semana';
import { esMesaVirtualNumero } from './mesa-label';

export const CAMPOS_DISPONIBILIDAD_MESA = [
  'disponible_lunes',
  'disponible_martes',
  'disponible_miercoles',
  'disponible_jueves',
  'disponible_viernes',
  'disponible_sabado',
  'disponible_domingo',
] as const;

export type CampoDisponibilidadMesa = (typeof CAMPOS_DISPONIBILIDAD_MESA)[number];

export type PatchDisponibilidadMesa = Partial<
  Record<CampoDisponibilidadMesa, boolean>
>;

export type ValidacionAdminResult =
  | { ok: true }
  | { ok: false; mensaje: string };

export function weekdayDesdeCampoMesa(campo: CampoDisponibilidadMesa): number {
  return CAMPOS_DISPONIBILIDAD_MESA.indexOf(campo) + 1;
}

export function campoMesaDesdeWeekday(
  weekday: number,
): CampoDisponibilidadMesa | null {
  if (weekday < 1 || weekday > 7) return null;
  return CAMPOS_DISPONIBILIDAD_MESA[weekday - 1] ?? null;
}

export function aplicarPatchDisponibilidadMesa(
  actual: DiasSemanaSnake,
  patch: PatchDisponibilidadMesa,
): DiasSemanaSnake {
  return { ...actual, ...patch };
}

export function validarPatchMesaAdmin(opts: {
  numeroMesa: number;
  flagsActuales: DiasSemanaSnake;
  patch: PatchDisponibilidadMesa;
  pedidosActivos: number;
  weekdayHoy: number;
}): ValidacionAdminResult {
  const { numeroMesa, flagsActuales, patch, pedidosActivos, weekdayHoy } =
    opts;

  const algunaDesactivacion = CAMPOS_DISPONIBILIDAD_MESA.some(
    (k) => patch[k] === false,
  );
  if (algunaDesactivacion && esMesaVirtualNumero(numeroMesa)) {
    return {
      ok: false,
      mensaje:
        'Las mesas 98 (para llevar) y 99 (mostrador) son del sistema y no se pueden desactivar.',
    };
  }

  if (pedidosActivos <= 0) {
    return { ok: true };
  }

  const despues = aplicarPatchDisponibilidadMesa(flagsActuales, patch);
  const campoHoy = campoMesaDesdeWeekday(weekdayHoy);
  if (!campoHoy) {
    return { ok: true };
  }

  const desactivaHoy = patch[campoHoy] === false;
  const quedaSinHoy = !despues[campoHoy];
  const desactivaTodos = CAMPOS_DISPONIBILIDAD_MESA.every(
    (k) => patch[k] === false,
  );

  if (desactivaTodos || desactivaHoy || quedaSinHoy) {
    return {
      ok: false,
      mensaje:
        pedidosActivos === 1
          ? 'Hay 1 pedido activo en esta mesa. Ciérralo antes de desactivarla hoy.'
          : `Hay ${pedidosActivos} pedidos activos en esta mesa. Ciérralos antes de desactivarla hoy.`,
    };
  }

  return { ok: true };
}

export function validarDesactivarUsuario(opts: {
  pedidosActivos: number;
}): ValidacionAdminResult {
  if (opts.pedidosActivos <= 0) {
    return { ok: true };
  }
  const n = opts.pedidosActivos;
  return {
    ok: false,
    mensaje:
      n === 1
        ? 'El usuario tiene 1 pedido activo. Ciérralo antes de desactivar la cuenta.'
        : `El usuario tiene ${n} pedidos activos. Ciérralos antes de desactivar la cuenta.`,
  };
}

const MSG_NUMEROS_RESERVADOS =
  'Los números 98 (para llevar) y 99 (mostrador) están reservados.';

export function validarNumeroMesaReservado(numero: number): ValidacionAdminResult {
  if (esMesaVirtualNumero(numero)) {
    return { ok: false, mensaje: MSG_NUMEROS_RESERVADOS };
  }
  return { ok: true };
}

export function validarCambioNumeroMesaAdmin(opts: {
  numeroActual: number;
  numeroNuevo: number;
  pedidosActivos: number;
}): ValidacionAdminResult {
  const { numeroActual, numeroNuevo, pedidosActivos } = opts;
  if (numeroNuevo === numeroActual) {
    return { ok: true };
  }
  if (esMesaVirtualNumero(numeroActual)) {
    return {
      ok: false,
      mensaje:
        'Las mesas 98 y 99 son del sistema; no se puede cambiar su número.',
    };
  }
  const reservado = validarNumeroMesaReservado(numeroNuevo);
  if (!reservado.ok) {
    return reservado;
  }
  if (pedidosActivos > 0) {
    return {
      ok: false,
      mensaje:
        pedidosActivos === 1
          ? 'Hay 1 pedido activo en esta mesa. Ciérralo antes de cambiar el número.'
          : `Hay ${pedidosActivos} pedidos activos en esta mesa. Ciérralos antes de cambiar el número.`,
    };
  }
  return { ok: true };
}

export function validarEliminarMesaAdmin(opts: {
  numeroMesa: number;
  pedidosActivos: number;
  totalPedidos: number;
}): ValidacionAdminResult {
  const { numeroMesa, pedidosActivos, totalPedidos } = opts;
  if (esMesaVirtualNumero(numeroMesa)) {
    return {
      ok: false,
      mensaje:
        'Las mesas 98 (para llevar) y 99 (mostrador) son del sistema y no se pueden eliminar.',
    };
  }
  if (pedidosActivos > 0) {
    return {
      ok: false,
      mensaje:
        pedidosActivos === 1
          ? 'Hay 1 pedido activo en esta mesa. Ciérralo antes de eliminarla.'
          : `Hay ${pedidosActivos} pedidos activos en esta mesa. Ciérralos antes de eliminarla.`,
    };
  }
  if (totalPedidos > 0) {
    return {
      ok: false,
      mensaje:
        'Esta mesa tiene pedidos en el historial. No se puede eliminar.',
    };
  }
  return { ok: true };
}
