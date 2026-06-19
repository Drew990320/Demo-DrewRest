import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type AppIconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Iconos de la barra principal (pantalla Mesas).
 * No reutilizar estos nombres en categorías del menú ni en acciones de pedido.
 */
export const NavIcon = {
  usuarios: 'person-circle-outline',
  editarMenu: 'book-outline',
  diasMenu: 'calendar-outline',
  gestionarMesas: 'grid-outline',
  resumenDiario: 'stats-chart-outline',
  mostrador: 'storefront-outline',
  paraLlevar: 'bag-check-outline',
  cocina: 'bonfire-outline',
  misPedidos: 'list-outline',
  ayudaCompaneros: 'people-outline',
  cerrarSesion: 'log-out-outline',
} as const satisfies Record<string, AppIconName>;

/** Acciones frecuentes dentro de un pedido / mesa. */
export const PedidoIcon = {
  agregarMenu: 'fast-food-outline',
  agregarBebidas: 'wine-outline',
  abrirMesa: 'restaurant-outline',
  abrirPedido: 'play-circle-outline',
  pasarCocina: 'send-outline',
  reimprimirComanda: 'print-outline',
  cobrar: 'cash-outline',
  verPedido: 'document-text-outline',
  nuevoParaLlevar: 'cart-outline',
  nuevaVentaBebidas: 'wine-outline',
} as const satisfies Record<string, AppIconName>;

/** Acciones secundarias (reimprimir, guardar, llamar, etc.). */
export const AccionIcon = {
  reimprimir: 'print-outline',
  reimprimirTotalPedido: 'layers-outline',
  reimprimirCobro: 'receipt-outline',
  guardar: 'save-outline',
  consultar: 'search-outline',
  llamarMesero: 'notifications-outline',
  irMesa: 'arrow-forward-circle-outline',
  irCocina: 'flame-outline',
  confirmarEnMesa: 'checkmark-circle-outline',
  faltaEnCocina: 'alert-circle-outline',
} as const satisfies Record<string, AppIconName>;

/** Formularios y pantallas de administración. */
export const AdminIcon = {
  crear: 'add-circle-outline',
  crearMesero: 'person-add-outline',
  cancelar: 'close-outline',
  confirmar: 'checkmark-outline',
  volverMesas: 'home-outline',
  activar: 'checkmark-circle-outline',
  desactivar: 'ban-outline',
  verHoy: 'today-outline',
  entrar: 'log-in-outline',
  probarApi: 'pulse-outline',
  irMenu: 'book-outline',
  eliminar: 'trash-outline',
  editar: 'pencil-outline',
} as const satisfies Record<string, AppIconName>;
