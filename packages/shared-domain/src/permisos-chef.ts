export const PERMISOS_CHEF_KEYS = [
  'ver_cola_cocina',
  'marcar_listo',
  'reimprimir_comanda',
  'anular_linea_cocina',
] as const;

export type PermisoChefKey = (typeof PERMISOS_CHEF_KEYS)[number];

export type PermisosChefConfig = Record<PermisoChefKey, boolean>;

export const PERMISOS_CHEF_DEFAULTS: PermisosChefConfig = {
  ver_cola_cocina: true,
  marcar_listo: true,
  reimprimir_comanda: true,
  anular_linea_cocina: true,
};

export const PERMISOS_CHEF_META: Record<
  PermisoChefKey,
  { titulo: string; detalle: string }
> = {
  ver_cola_cocina: {
    titulo: 'Ver cola de cocina',
    detalle: 'Acceso a la pantalla de cocina',
  },
  marcar_listo: {
    titulo: 'Marcar listo',
    detalle: 'Marcar platos y acompañamientos como listos',
  },
  reimprimir_comanda: {
    titulo: 'Reimprimir comanda',
    detalle: 'Reimprimir comandas desde cocina',
  },
  anular_linea_cocina: {
    titulo: 'Anular en cocina',
    detalle: 'Marcar falta en cocina / anular línea',
  },
};
