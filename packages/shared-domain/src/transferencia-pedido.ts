import {
  MESA_MOSTRADOR_NUMERO,
  MESA_PARA_LLEVAR_NUMERO,
  esMesaVirtualNumero,
  tituloLugarMesa,
} from './mesa-label';
import { pedidoUsaLineaMazorca } from './mazorca-pedido';
import { categoriaEsBebida, debeMarcarCocina } from './cocina-producto';
import { esDetalleMazorcaAcompanamiento } from './mazorca-pedido';

export type DetalleTransferenciaLike = {
  es_bebida?: boolean;
  es_acompanamiento_mazorca?: boolean;
  esAcompanamientoMazorca?: boolean;
  es_empacable?: boolean;
  esEmpacable?: boolean;
  categoria_nombre?: string;
  id_detalle_padre?: number | null;
  idDetallePadre?: number | null;
};

function esRaiz(d: DetalleTransferenciaLike): boolean {
  const padre = d.id_detalle_padre ?? d.idDetallePadre;
  return padre == null;
}

function esMazorca(d: DetalleTransferenciaLike): boolean {
  return esDetalleMazorcaAcompanamiento(d);
}

export function pedidoDebeTenerLineaMazorca(
  mesaNumero: number,
  detalles: DetalleTransferenciaLike[],
): boolean {
  if (!pedidoUsaLineaMazorca(mesaNumero)) return false;
  return detalles.some((d) => {
    if (!esRaiz(d)) return false;
    if (esMazorca(d) || (d.es_empacable ?? d.esEmpacable)) return false;
    if (d.es_bebida != null) return !d.es_bebida;
    return debeMarcarCocina(d.categoria_nombre ?? '', false);
  });
}

export type ResultadoValidacionTransferencia =
  | { accion: 'mover'; mensaje_confirmacion: string }
  | { accion: 'rechazar'; mensaje: string };

const MSG_DESTINO_VIRTUAL =
  'No se puede transferir a Para llevar ni al Mostrador. Cancela este pedido y abre uno nuevo allí.';

const MSG_ORIGEN_VIRTUAL =
  'Los pedidos de Para llevar o Mostrador no se transfieren. Usa «Cancelar pedido» si ya no aplica.';

/** Transferencia entre mesas libres; no hacia/desde 98 (para llevar) ni 99 (mostrador). */
export function validarTransferenciaPedido(input: {
  origen_mesa_numero: number;
  destino_mesa_numero: number;
  destino_libre: boolean;
}): ResultadoValidacionTransferencia {
  const { origen_mesa_numero: origen, destino_mesa_numero: destino, destino_libre: libre } =
    input;

  if (esMesaVirtualNumero(origen)) {
    return { accion: 'rechazar', mensaje: MSG_ORIGEN_VIRTUAL };
  }

  if (
    destino === MESA_PARA_LLEVAR_NUMERO ||
    destino === MESA_MOSTRADOR_NUMERO ||
    esMesaVirtualNumero(destino)
  ) {
    return { accion: 'rechazar', mensaje: MSG_DESTINO_VIRTUAL };
  }

  if (!libre) {
    return {
      accion: 'rechazar',
      mensaje: 'La mesa destino no está libre. Solo puedes transferir a una mesa sin pedido abierto.',
    };
  }

  return {
    accion: 'mover',
    mensaje_confirmacion: `¿Mover el pedido a ${tituloLugarMesa(destino)}? La mesa actual quedará libre si no hay más pedidos abiertos.`,
  };
}

export const AYUDA_TRANSFERENCIA_PEDIDO =
  'Elige una mesa libre. Para llevar y mostrador: cancela y abre pedido nuevo.';
