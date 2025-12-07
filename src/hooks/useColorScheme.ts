import { useColorScheme as _useColorScheme } from 'react-native';

// Este hook serve para forçar o tema 'light' ou 'dark' se você quiser no futuro
export function useColorScheme() {
  return _useColorScheme() ?? 'light';
}