import type { ComponentProps } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export type CategoriaMenuIconName = ComponentProps<
  typeof MaterialCommunityIcons
>['name'];

/**
 * Iconos de comida (Material Community) para la barra de categorías del menú.
 * Cada categoría usa un símbolo que describe el plato, no metáforas abstractas.
 */
export function categoriaMenuIcon(nombre: string): CategoriaMenuIconName {
  const n = nombre.toLowerCase();

  // Orden importa: "sin alcohol" también contiene la palabra "alcohol".
  if (n.includes('sin alcohol')) return 'bottle-soda-outline';
  if (n.includes('con alcohol')) return 'beer-outline';
  if (n.includes('bebida')) return 'cup-water';

  if (n.includes('empaque')) return 'food-takeout-box-outline';
  if (n.includes('infantil')) return 'human-child';
  if (n.includes('compartir') || n.includes('picada')) return 'share-variant';
  if (n.includes('sopa')) return 'pot-steam-outline';
  if (n.includes('entrada') || n.includes('adicional')) {
    return 'silverware-fork-knife';
  }

  if (n.includes('cerdo') || n.includes('costilla') || n.includes('bondiola')) {
    return 'pig';
  }
  if (n.includes('pollo') || n.includes('pechuga') || n.includes('nugget')) {
    return 'food-drumstick-outline';
  }
  if (n.includes('res') || n.includes('mixto') || n.includes('parrillada')) {
    return 'food-steak';
  }
  if (n.includes('plato')) return 'grill-outline';

  return 'food-outline';
}
