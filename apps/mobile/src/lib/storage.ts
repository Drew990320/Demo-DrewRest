import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

async function secureGet(key: string): Promise<string | null> {
  try {
    if (typeof SecureStore.getItemAsync === 'function') {
      return await SecureStore.getItemAsync(key);
    }
  } catch {
    // fallback below
  }
  return AsyncStorage.getItem(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  try {
    if (typeof SecureStore.setItemAsync === 'function') {
      await SecureStore.setItemAsync(key, value);
      return;
    }
  } catch {
    // fallback below
  }
  await AsyncStorage.setItem(key, value);
}

async function secureDelete(key: string): Promise<void> {
  try {
    if (typeof SecureStore.deleteItemAsync === 'function') {
      await SecureStore.deleteItemAsync(key);
      return;
    }
  } catch {
    // fallback below
  }
  await AsyncStorage.removeItem(key);
}

export const storage = {
  getItem: secureGet,
  setItem: secureSet,
  deleteItem: secureDelete,
};
