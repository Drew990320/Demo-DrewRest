export const PERMISOS_ADMIN_KEYS = [
  'usuarios',
  'permisos',
  'menu',
  'mesas',
  'configuracion',
  'resumen_diario',
  'creditos',
  'personalizacion',
  'meseros_operativos',
  'conexion_movil',
] as const;

export type PermisoAdminKey = (typeof PERMISOS_ADMIN_KEYS)[number];
export type PermisosAdminConfig = Record<PermisoAdminKey, boolean>;

export const PERMISOS_ADMIN_DEFAULTS: PermisosAdminConfig = {
  usuarios: true,
  permisos: true,
  menu: true,
  mesas: true,
  configuracion: true,
  resumen_diario: true,
  creditos: true,
  personalizacion: true,
  meseros_operativos: true,
  conexion_movil: true,
};

export const PERMISOS_ADMIN_LABELS: Record<PermisoAdminKey, string> = {
  usuarios: 'Usuarios',
  permisos: 'Permisos mesero/cocina',
  menu: 'Menú y categorías',
  mesas: 'Mesas',
  configuracion: 'Configuración',
  resumen_diario: 'Resumen diario / caja',
  creditos: 'Créditos',
  personalizacion: 'Personalización visual',
  meseros_operativos: 'Meseros operativos',
  conexion_movil: 'Conexión móvil',
};

export function permisosAdminTodos(): PermisosAdminConfig {
  return { ...PERMISOS_ADMIN_DEFAULTS };
}

export function normalizarPermisosAdmin(
  parcial?: Partial<PermisosAdminConfig> | null,
): PermisosAdminConfig {
  const out = { ...PERMISOS_ADMIN_DEFAULTS };
  if (!parcial) return out;
  for (const k of PERMISOS_ADMIN_KEYS) {
    if (typeof parcial[k] === 'boolean') out[k] = parcial[k]!;
  }
  return out;
}
