import type { DiasSemanaSnake } from './dias-semana';
import {
  esMesaVirtualNumero,
  resolverMesasVirtuales,
  type MesasVirtualesConfig,
} from './mesa-label';

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

function msgNumerosReservados(mesasVirtuales?: MesasVirtualesConfig): string {
  const r = resolverMesasVirtuales(mesasVirtuales);
  return `Los números ${r.numero_mesa_para_llevar} (para llevar) y ${r.numero_mesa_mostrador} (mostrador) están reservados.`;
}

function msgMesasSistema(mesasVirtuales?: MesasVirtualesConfig): string {
  const r = resolverMesasVirtuales(mesasVirtuales);
  return `Las mesas ${r.numero_mesa_para_llevar} (para llevar) y ${r.numero_mesa_mostrador} (mostrador) son del sistema y no se pueden modificar.`;
}

export function validarPatchMesaAdmin(opts: {
  numeroMesa: number;
  flagsActuales: DiasSemanaSnake;
  patch: PatchDisponibilidadMesa;
  pedidosActivos: number;
  weekdayHoy: number;
  mesasVirtuales?: MesasVirtualesConfig;
}): ValidacionAdminResult {
  const {
    numeroMesa,
    flagsActuales,
    patch,
    pedidosActivos,
    weekdayHoy,
    mesasVirtuales,
  } = opts;

  const algunaDesactivacion = CAMPOS_DISPONIBILIDAD_MESA.some(
    (k) => patch[k] === false,
  );
  if (
    algunaDesactivacion &&
    esMesaVirtualNumero(numeroMesa, mesasVirtuales)
  ) {
    return { ok: false, mensaje: msgMesasSistema(mesasVirtuales) };
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

export function validarNumeroMesaReservado(
  numero: number,
  mesasVirtuales?: MesasVirtualesConfig,
): ValidacionAdminResult {
  if (esMesaVirtualNumero(numero, mesasVirtuales)) {
    return { ok: false, mensaje: msgNumerosReservados(mesasVirtuales) };
  }
  return { ok: true };
}

export function validarCambioNumeroMesaAdmin(opts: {
  numeroActual: number;
  numeroNuevo: number;
  pedidosActivos: number;
  mesasVirtuales?: MesasVirtualesConfig;
}): ValidacionAdminResult {
  const { numeroActual, numeroNuevo, pedidosActivos, mesasVirtuales } = opts;
  if (numeroNuevo === numeroActual) {
    return { ok: true };
  }
  if (esMesaVirtualNumero(numeroActual, mesasVirtuales)) {
    return { ok: false, mensaje: msgMesasSistema(mesasVirtuales) };
  }
  const reservado = validarNumeroMesaReservado(numeroNuevo, mesasVirtuales);
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
  mesasVirtuales?: MesasVirtualesConfig;
}): ValidacionAdminResult {
  const { numeroMesa, pedidosActivos, totalPedidos, mesasVirtuales } = opts;
  if (esMesaVirtualNumero(numeroMesa, mesasVirtuales)) {
    return { ok: false, mensaje: msgMesasSistema(mesasVirtuales) };
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
