export type LineaMazorcaSync = {
  id_detalle: number;
  cantidad: number;
  listo_cocina: boolean;
  listo_para_recoger: boolean;
};

export const MSG_MAZORCA_MIN_COMENSALES = 'Debe haber al menos 1 comensal';
export const MSG_MAZORCA_BLOQUEADA =
  'No puedes bajar comensales por debajo del acompañamiento ya listo o entregado';
export const MSG_MAZORCA_NO_AJUSTE =
  'No se pudo ajustar comensales: hay acompañamiento ya listo o en mesa';

export function cantidadBloqueadaMazorca(lineas: LineaMazorcaSync[]): number {
  return lineas.reduce(
    (s, l) =>
      s + (l.listo_cocina || l.listo_para_recoger ? l.cantidad : 0),
    0,
  );
}

export function cantidadTotalMazorca(lineas: LineaMazorcaSync[]): number {
  return lineas.reduce((s, l) => s + l.cantidad, 0);
}

export function lineaMazorcaEditable(
  lineas: LineaMazorcaSync[],
): LineaMazorcaSync | undefined {
  return lineas.find((l) => !l.listo_cocina && !l.listo_para_recoger);
}

export type PlanSyncMazorca =
  | { tipo: 'limpiar' }
  | { tipo: 'sin_cambios' }
  | { tipo: 'error'; mensaje: string }
  | {
      tipo: 'subir';
      modo: 'editar';
      id_detalle: number;
      nueva_cantidad: number;
    }
  | { tipo: 'subir'; modo: 'crear'; cantidad: number }
  | {
      tipo: 'bajar';
      actualizar: { id_detalle: number; nueva_cantidad: number }[];
      eliminar: number[];
    };

export function planificarSyncMazorca(input: {
  usa_linea_mazorca: boolean;
  num_comensales: number;
  lineas: LineaMazorcaSync[];
}): PlanSyncMazorca {
  if (!input.usa_linea_mazorca) {
    return { tipo: 'limpiar' };
  }
  if (input.num_comensales < 1) {
    return { tipo: 'error', mensaje: MSG_MAZORCA_MIN_COMENSALES };
  }

  const total = cantidadTotalMazorca(input.lineas);
  const bloqueada = cantidadBloqueadaMazorca(input.lineas);

  if (input.num_comensales < bloqueada) {
    return { tipo: 'error', mensaje: MSG_MAZORCA_BLOQUEADA };
  }
  if (total === input.num_comensales) {
    return { tipo: 'sin_cambios' };
  }

  if (total < input.num_comensales) {
    const agregar = input.num_comensales - total;
    const editable = lineaMazorcaEditable(input.lineas);
    if (editable) {
      return {
        tipo: 'subir',
        modo: 'editar',
        id_detalle: editable.id_detalle,
        nueva_cantidad: editable.cantidad + agregar,
      };
    }
    return { tipo: 'subir', modo: 'crear', cantidad: agregar };
  }

  let quitar = total - input.num_comensales;
  const editables = input.lineas
    .filter((l) => !l.listo_cocina && !l.listo_para_recoger)
    .sort((a, b) => b.id_detalle - a.id_detalle);

  const actualizar: { id_detalle: number; nueva_cantidad: number }[] = [];
  const eliminar: number[] = [];

  for (const l of editables) {
    if (quitar <= 0) break;
    const resta = Math.min(quitar, l.cantidad);
    quitar -= resta;
    const nueva = l.cantidad - resta;
    if (nueva <= 0) {
      eliminar.push(l.id_detalle);
    } else {
      actualizar.push({ id_detalle: l.id_detalle, nueva_cantidad: nueva });
    }
  }

  if (quitar > 0) {
    return { tipo: 'error', mensaje: MSG_MAZORCA_NO_AJUSTE };
  }
  return { tipo: 'bajar', actualizar, eliminar };
}

export function cantidadLineaMazorcaInicial(input: {
  usa_linea_mazorca: boolean;
  ya_tiene_linea: boolean;
  num_comensales: number;
}): number | null {
  if (!input.usa_linea_mazorca || input.ya_tiene_linea) {
    return null;
  }
  return input.num_comensales;
}
