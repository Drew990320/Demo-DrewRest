import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { ActionIconKey } from '@la-reserva/shared-domain/action-app-icon';
import { resolveActionIcon } from './app-icons-runtime';

export type AppIconName = ComponentProps<typeof Ionicons>['name'];

function proxyIconMap<T extends Record<string, ActionIconKey>>(
  keyMap: T,
): { readonly [K in keyof T]: AppIconName } {
  return new Proxy({} as { readonly [K in keyof T]: AppIconName }, {
    get(_target, prop: string) {
      const key = keyMap[prop as keyof T];
      return key ? (resolveActionIcon(key) as AppIconName) : undefined;
    },
  });
}

const PEDIDO_KEYS = {
  agregarMenu: 'pedido_agregar_menu',
  agregarBebidas: 'pedido_agregar_bebidas',
  abrirMesa: 'pedido_abrir_mesa',
  abrirPedido: 'pedido_abrir_pedido',
  pasarCocina: 'pedido_pasar_cocina',
  reimprimirComanda: 'pedido_reimprimir_comanda',
  cobrar: 'pedido_cobrar',
  verPedido: 'pedido_ver_pedido',
  nuevoParaLlevar: 'pedido_nuevo_para_llevar',
  nuevaVentaBebidas: 'pedido_nueva_venta_bebidas',
} as const;

const ACCION_KEYS = {
  reimprimir: 'accion_reimprimir',
  reimprimirComanda: 'accion_reimprimir_comanda',
  reimprimirTotalPedido: 'accion_reimprimir_total_pedido',
  reimprimirCobro: 'accion_reimprimir_cobro',
  guardar: 'accion_guardar',
  cancelar: 'accion_cancelar',
  consultar: 'accion_consultar',
  llamarMesero: 'accion_llamar_mesero',
  irMesa: 'accion_ir_mesa',
  irCocina: 'accion_ir_cocina',
  confirmarEnMesa: 'accion_confirmar_en_mesa',
  faltaEnCocina: 'accion_falta_en_cocina',
} as const;

const RESUMEN_KEYS = {
  elegirImpresion: 'resumen_elegir_impresion',
  imprimirTodas: 'resumen_imprimir_todas',
  totalesCaja: 'resumen_totales_caja',
} as const;

const ADMIN_KEYS = {
  crear: 'admin_crear',
  crearMesero: 'admin_crear_mesero',
  cancelar: 'admin_cancelar',
  confirmar: 'admin_confirmar',
  volverMesas: 'admin_volver_mesas',
  activar: 'admin_activar',
  desactivar: 'admin_desactivar',
  verHoy: 'admin_ver_hoy',
  entrar: 'admin_entrar',
  probarApi: 'admin_probar_api',
  irMenu: 'admin_ir_menu',
  eliminar: 'admin_eliminar',
  editar: 'admin_editar',
  guardar: 'admin_guardar',
  restablecer: 'admin_restablecer',
} as const;

/** @deprecated Usar barra con navIcon(); se mantiene por compatibilidad. */
export const NavIcon = {
  usuarios: 'person-circle-outline',
  editarMenu: 'book-outline',
  diasMenu: 'calendar-outline',
  gestionarMesas: 'grid-outline',
  resumenDiario: 'stats-chart-outline',
  conexionMovil: 'phone-portrait-outline',
  configuracion: 'settings-outline',
  meserosOperativos: 'wallet-outline',
  permisos: 'shield-checkmark-outline',
  personalizacion: 'color-palette-outline',
  mostrador: 'storefront-outline',
  paraLlevar: 'bag-check-outline',
  cocina: 'bonfire-outline',
  misPedidos: 'list-outline',
  ayudaCompaneros: 'people-outline',
  cerrarSesion: 'log-out-outline',
} as const satisfies Record<string, AppIconName>;

/** Acciones frecuentes dentro de un pedido / mesa (personalizables). */
export const PedidoIcon = proxyIconMap(PEDIDO_KEYS);

/** Acciones secundarias (reimprimir, guardar, llamar, etc.). */
export const AccionIcon = proxyIconMap(ACCION_KEYS);

/** Impresión del resumen diario. */
export const ResumenIcon = proxyIconMap(RESUMEN_KEYS);

/** Formularios y pantallas de administración. */
export const AdminIcon = proxyIconMap(ADMIN_KEYS);
