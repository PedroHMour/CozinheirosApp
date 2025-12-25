import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

function InitialLayout() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Verifica se estamos na pasta (auth)
    const inAuthGroup = segments[0] === '(auth)';

    if (user && inAuthGroup) {
      // Se tem usuário e está na tela de login -> Manda para as abas
      router.replace('/(tabs)');
    } else if (!user && !inAuthGroup) {
      // Se NÃO tem usuário e NÃO está na área de auth -> Manda para login
      router.replace('/(auth)/login');
    }
    // CORREÇÃO ESLINT: 'router' adicionado nas dependências abaixo
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6F00" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}