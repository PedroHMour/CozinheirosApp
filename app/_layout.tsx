import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

// Tipo auxiliar para 'enganar' o TypeScript enquanto ele não reconhece as rotas novas
type Href = any; 

function InitialLayout() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // CORREÇÃO 1: Forçamos (segments[0] as string) para evitar erro de comparação
    const rootSegment = segments[0] as string;
    const inAuthGroup = rootSegment === '(auth)';
    const inCookGroup = rootSegment === '(cook)';
    const inClientGroup = rootSegment === '(tabs)';

    // 1. Usuário NÃO logado
    if (!user) {
        if (!inAuthGroup) router.replace('/(auth)/login' as Href);
        return;
    }

    // 2. Usuário Logado, mas SEM TIPO (Intercepção)
    if (!user.type) {
        // CORREÇÃO 2: Verificamos segments[1] com segurança
        const secondSegment = segments[1] as string;
        if (secondSegment !== 'complete-profile') {
            router.replace('/(auth)/complete-profile' as Href);
        }
        return;
    }

    // 3. Usuário COZINHEIRO
    if (user.type === 'cook') {
        if (!inCookGroup) router.replace('/(cook)' as Href); 
        return;
    }

    // 4. Usuário CLIENTE
    if (user.type === 'client') {
        if (!inClientGroup) router.replace('/(tabs)' as Href); 
        return;
    }

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