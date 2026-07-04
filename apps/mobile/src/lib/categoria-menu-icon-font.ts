import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Font from 'expo-font';

let loaded = false;
let loading: Promise<void> | null = null;

/** Precarga la fuente de iconos del menú (evita retraso al abrir categorías). */
export function preloadCategoriaMenuIcons(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (loading) return loading;
  loading = Font.loadAsync(MaterialCommunityIcons.font)
    .then(() => {
      loaded = true;
    })
    .catch(() => {
      loading = null;
    });
  return loading;
}
