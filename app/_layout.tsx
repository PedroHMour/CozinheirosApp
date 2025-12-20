import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      tabBarActiveTintColor: '#FF6F00',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: { 
        height: 60 + insets.bottom, 
        paddingBottom: insets.bottom + 5, 
        paddingTop: 10,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderColor: '#EEE',
      },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginBottom: 5 }
    }}>
      {/* IMPORTANTE: O name agora é "index" porque renomeamos o arquivo.
         Isso conecta a aba com app/(tabs)/index.tsx
      */}
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
          title: 'Atividade',
          tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="options"
        options={{
          title: 'Opções',
          tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Conta',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}