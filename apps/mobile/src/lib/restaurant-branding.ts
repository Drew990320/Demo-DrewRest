import Constants from 'expo-constants';
import { API_URL } from './config';

const nombreEnv =
  Constants.expoConfig?.extra?.restaurantName?.trim() ||
  process.env.EXPO_PUBLIC_RESTAURANT_NAME?.trim();

export function restaurantDisplayName(): string {
  return nombreEnv || 'Restaurante';
}

export function restaurantLogoUrl(): string {
  return `${API_URL}/sistema/logo`;
}

export function restaurantBrandingUrl(): string {
  return `${API_URL}/sistema/branding`;
}

export type RestaurantBranding = {
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  tiene_logo: boolean;
  logo_url: string | null;
};
