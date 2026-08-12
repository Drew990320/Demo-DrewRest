/**
 * Iconos Material Community Icons para categorías del menú.
 * Catálogo en categoria-menu-icon-catalog.ts (regenerable con scripts/generate-categoria-menu-icon-catalog.js).
 */
import { CATEGORIA_MENU_ICON_CATEGORIAS } from './categoria-menu-icon-catalog';
export { CATEGORIA_MENU_ICON_CATEGORIAS } from './categoria-menu-icon-catalog';
export type CategoriaMenuIconId = (typeof CATEGORIA_MENU_ICON_CATEGORIAS)[number]['iconos'][number]['id'];
/** Lista plana de iconos permitidos (derivada del catálogo categorizado). */
export declare const CATEGORIA_MENU_ICONOS: ReadonlyArray<{
    id: CategoriaMenuIconId;
    label: string;
}>;
export declare const CATEGORIA_MENU_ICON_IDS: CategoriaMenuIconId[];
export declare function esIconoCategoriaMenuValido(icono: string | null | undefined): icono is CategoriaMenuIconId;
/** Sugiere icono según el nombre (cuando el admin no eligió uno). */
export declare function inferirIconoCategoriaDesdeNombre(nombre: string): CategoriaMenuIconId;
/** Normaliza un valor persistido (incluye iconos legacy como `salad`). */
export declare function normalizarIconoMenuGuardado(raw: string | null | undefined, nombreFallback?: string): CategoriaMenuIconId | null;
export declare function resolverIconoCategoriaMenu(nombre: string, iconoGuardado?: string | null): CategoriaMenuIconId;
