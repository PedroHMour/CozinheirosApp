import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// CORREÇÃO: Importando do lugar certo com os nomes novos
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

function InitialLayout() {
  // CORREÇÃO: Usando useAuth em vez de useSession
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === '(tabs)';

    if (user && !inTabsGroup) {
      // Entrar nas abas
      router.replace('/(tabs)');
    } else if (!user && inTabsGroup) {
      // Sair das abas
      router.replace('/');
    }
  }, [user, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#FF6F00" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* CORREÇÃO: Usando AuthProvider */}
      <AuthProvider>
        <StatusBar style="dark" />
        <InitialLayout />
      </AuthProvider>
    </SafeAreaProvider>
  );
}