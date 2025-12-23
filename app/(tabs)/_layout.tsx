// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Colors } from '../../src/constants/theme'; // Verifique se o caminho está certo

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      tabBarActiveTintColor: Colors.light.primary,
      tabBarInactiveTintColor: '#999',
    }}>
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="activity" 
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="options" // Ou "account" se você renomeou
        options={{
          title: 'Conta',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }} 
      />
      {/* Oculta telas que não devem aparecer na barra de baixo */}
      <Tabs.Screen name="account" options={{ href: null }} /> 
    </Tabs>
  );
}