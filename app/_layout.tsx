import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          {/* Tela de Login (A primeira que carrega) */}
          <Stack.Screen name="index" />
          
          {/* O App Principal (Abas) - Só vai pra cá depois de logar */}
          <Stack.Screen name="(tabs)" />
          
          {/* Telas Modais */}
          <Stack.Screen name="chat" options={{ presentation: 'modal' }} />
          <Stack.Screen name="payment" options={{ presentation: 'modal' }} />
        </Stack>
      </View>
    </AuthProvider>
  );
}