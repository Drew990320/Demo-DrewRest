import type { ComponentProps } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  CATEGORIA_MENU_ICONOS,
  CATEGORIA_MENU_ICON_CATEGORIAS,
  CATEGORIA_MENU_ICON_IDS,
  esIconoCategoriaMenuValido,
  inferirIconoCategoriaDesdeNombre,
  normalizarIconoMenuGuardado,
  resolverIconoCategoriaMenu,
  type CategoriaMenuIconId,
} from '@la-reserva/shared-domain/categoria-menu-icon';

export {
  CATEGORIA_MENU_ICONOS,
  CATEGORIA_MENU_ICON_CATEGORIAS,
  CATEGORIA_MENU_ICON_IDS,
  esIconoCategoriaMenuValido,
  inferirIconoCategoriaDesdeNombre,
  normalizarIconoMenuGuardado,
  resolverIconoCategoriaMenu,
  type CategoriaMenuIconId,
};
export type CategoriaMenuIconName = ComponentProps<
  typeof MaterialCommunityIcons
>['name'];

export function categoriaMenuIcon(
  nombre: string,
  iconoGuardado?: string | null,
): CategoriaMenuIconName {
  return resolverIconoCategoriaMenu(
    nombre,
    iconoGuardado,
  ) as CategoriaMenuIconName;
}
