import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

function InitialLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === '(tabs)';

    // Se o usuário está logado e NÃO está nas abas
    if (user && !inTabsGroup) {
      // CORREÇÃO: Usamos o caminho simplificado
      router.replace('/(tabs)' as any);
    } 
    // Se NÃO está logado e tenta acessar as abas
    else if (!user && inTabsGroup) {
      router.replace('/');
    }
    
  }, [user, segments, isLoading, router]);

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
      <AuthProvider>
        <StatusBar style="dark" />
        <InitialLayout />
      </AuthProvider>
    </SafeAreaProvider>
  );
}