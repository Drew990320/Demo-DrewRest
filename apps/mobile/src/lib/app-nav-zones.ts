/** Zonas de navegación contextual según ruta. */
export type AppNavZone = 'operacion' | 'pedido' | 'admin' | 'hidden';

const ADMIN_ROUTE =
  /\/(usuarios|menu-admin|categorias-admin|mesas-admin|configuracion|conexion-movil|permisos|meseros-operativos|resumen-diario)(\/|$)/;

const OPERACION_ROUTE =
  /\/(mesas|mostrador|para-llevar|mis-pedidos|ayuda-companeros|mesa\/\d+)(\/|$)/;

export function appNavZoneFromPath(pathname: string): AppNavZone {
  if (pathname.includes('/pedido/')) return 'pedido';
  if (ADMIN_ROUTE.test(pathname)) return 'admin';
  if (OPERACION_ROUTE.test(pathname)) return 'operacion';
  if (pathname.includes('/cocina')) return 'operacion';
  return 'hidden';
}

export function pedidoIdFromPath(pathname: string): string | null {
  const m = pathname.match(/\/pedido\/(\d+)/);
  return m?.[1] ?? null;
}

export function isPedidoMenuPath(pathname: string): boolean {
  return (
    /\/pedido\/\d+\/menu(\/|$)/.test(pathname) ||
    /\/pedido\/\d+\/producto\//.test(pathname) ||
    /\/pedido\/\d+\/?$/.test(pathname)
  );
}

export function isPedidoFacturaPath(pathname: string): boolean {
  return /\/pedido\/\d+\/factura(\/|$)/.test(pathname);
}

export function isMesasHomePath(pathname: string): boolean {
  return /\/mesas(\/|$)/.test(pathname) && !pathname.includes('mesas-admin');
}

export function isMesaDetailPath(pathname: string): boolean {
  return /\/mesa\/\d+(\/|$)/.test(pathname);
}

export function isAdminRoutePath(pathname: string): boolean {
  return ADMIN_ROUTE.test(pathname);
}
