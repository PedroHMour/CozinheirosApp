import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CookLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      tabBarActiveTintColor: '#D32F2F', // Vermelho para destacar que é área do Chefe
      tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        height: 60 + insets.bottom,
        paddingBottom: insets.bottom + 5,
        paddingTop: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
      }
    }}>
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color }) => <Ionicons name="receipt" size={24} color={color} />,
        }} 
      />
      
      <Tabs.Screen 
        name="menu" 
        options={{
          title: 'Meu Prato',
          tabBarIcon: ({ color }) => <Ionicons name="restaurant" size={24} color={color} />,
        }} 
      />

      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons name="person-circle" size={24} color={color} />,
        }} 
      />
    </Tabs>
  );
}