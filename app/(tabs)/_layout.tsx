import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
// 1. Importamos esta ferramenta que mede a área segura do telemóvel
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  // 2. Pegamos as medidas exatas do topo e fundo do ecrã
  const insets = useSafeAreaInsets();

  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      tabBarActiveTintColor: '#FF6F00',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        
        // 3. A MÁGICA: Altura base (60) + o tamanho da barra do sistema (insets.bottom)
        height: 60 + insets.bottom, 
        
        // 4. Adicionamos o espaçamento em baixo igual à barra do sistema + um respiro
        paddingBottom: insets.bottom + 5, 
        
        paddingTop: 10, // Um pouco de espaço em cima dos ícones
        elevation: 5, // Sombra para Android
        shadowColor: '#000', // Sombra para iOS
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 0, // Remove margens extras que empurram o texto
      }
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
          tabBarIcon: ({ color }) => <Ionicons name="receipt" size={24} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="account" 
        options={{
          title: 'Conta',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }} 
      />
      
      {/* Esconde outras rotas */}
      <Tabs.Screen name="options" options={{ href: null }} /> 
    </Tabs>
  );
}