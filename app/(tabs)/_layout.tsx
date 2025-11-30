import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
// Importação nova para calcular a área segura
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  // Pega as medidas exatas da tela do usuário
  const insets = useSafeAreaInsets();

  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      tabBarActiveTintColor: '#FF6F00',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: { 
        // A altura será: 60px padrão + a altura dos botões do Android (insets.bottom)
        height: 60 + insets.bottom, 
        // O espaçamento interno empurra os ícones para cima dos botões
        paddingBottom: insets.bottom + 5, 
        paddingTop: 10,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderColor: '#EEE',
        elevation: 10
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 5
      }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="options"
        options={{
          title: 'Opções',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Atividade',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Conta',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}