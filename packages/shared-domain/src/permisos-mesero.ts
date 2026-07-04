/** Claves de permisos configurables para el rol mesero. */
export const PERMISOS_MESERO_KEYS = [
  'agregar_items',
  'editar_cantidades',
  'quitar_lineas',
  'enviar_cocina',
  'reimprimir_comanda',
  'cobrar',
  'precuenta',
  'reimprimir_factura',
  'cancelar_pedido',
  'transferir_mesa',
  'ayuda_companeros',
] as const;

export type PermisoMeseroKey = (typeof PERMISOS_MESERO_KEYS)[number];

export type PermisosMeseroConfig = Record<PermisoMeseroKey, boolean>;

export const PERMISOS_MESERO_DEFAULTS: PermisosMeseroConfig = {
  agregar_items: true,
  editar_cantidades: true,
  quitar_lineas: true,
  enviar_cocina: true,
  reimprimir_comanda: true,
  cobrar: true,
  precuenta: true,
  reimprimir_factura: true,
  cancelar_pedido: true,
  transferir_mesa: true,
  ayuda_companeros: true,
};

export type PermisoMeseroMeta = {
  titulo: string;
  detalle: string;
};

export const PERMISOS_MESERO_META: Record<PermisoMeseroKey, PermisoMeseroMeta> =
  {
    agregar_items: {
      titulo: 'Agregar ítems',
      detalle: 'Menú, bebidas y personalizaciones',
    },
    editar_cantidades: {
      titulo: 'Editar cantidades',
      detalle: 'Botones +/− en las líneas del pedido',
    },
    quitar_lineas: {
      titulo: 'Quitar líneas',
      detalle: 'Eliminar ítems del pedido',
    },
    enviar_cocina: {
      titulo: 'Enviar a cocina',
      detalle: 'Pasar platos pendientes a cocina',
    },
    reimprimir_comanda: {
      titulo: 'Reimprimir comanda',
      detalle: 'Volver a imprimir la comanda de cocina',
    },
    cobrar: {
      titulo: 'Cobrar / facturar',
      detalle: 'Cobro estándar, mixto y reparto por personas',
    },
    precuenta: {
      titulo: 'Pre-cuenta',
      detalle: 'Imprimir pre-cuenta antes del cobro',
    },
    reimprimir_factura: {
      titulo: 'Reimprimir factura',
      detalle: 'Reimprimir un cobro ya registrado',
    },
    cancelar_pedido: {
      titulo: 'Cancelar pedido',
      detalle: 'Anular el ticket sin cobros',
    },
    transferir_mesa: {
      titulo: 'Transferir mesa',
      detalle: 'Mover el pedido a otra mesa libre',
    },
    ayuda_companeros: {
      titulo: 'Ayuda a compañeros',
      detalle: 'Ver pedidos ajenos, recoger platos y avisar falta',
    },
  };

export type PermisosMeseroEfectivos = PermisosMeseroConfig & {
  puede_cerrar_anulando: boolean;
  es_admin: boolean;
};

export function permisosMeseroTodos(): PermisosMeseroEfectivos {
  return {
    ...PERMISOS_MESERO_DEFAULTS,
    puede_cerrar_anulando: true,
    es_admin: true,
  };
}
