import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'vi-sinh-vien-session';
export const sessionStore = {
  get: async () =>
    Platform.OS === 'web'
      ? typeof window === 'undefined'
        ? null
        : window.localStorage.getItem(KEY)
      : SecureStore.getItemAsync(KEY),
  set: async (token: string) => {
    if (Platform.OS === 'web') window.localStorage.setItem(KEY, token);
    else await SecureStore.setItemAsync(KEY, token);
  },
  clear: async () => {
    if (Platform.OS === 'web') window.localStorage.removeItem(KEY);
    else await SecureStore.deleteItemAsync(KEY);
  },
};
