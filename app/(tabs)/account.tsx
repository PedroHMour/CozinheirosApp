// app/(tabs)/account.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Shadows, Typography } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/services/api';

export default function AccountScreen() {
  const { user, signOut } = useAuth();

  const handleDeleteAccount = () => {
    Alert.alert(
      "Excluir Conta",
      "Tem certeza absoluta? Essa ação apagará seu histórico e não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Excluir", 
          style: "destructive", 
          onPress: async () => {
            try {
              if (!user) return;
              
              // Chama a rota de delete do backend
              await api.delete(`/users/${user.id}`);
              
              Alert.alert("Conta Excluída", "Seus dados foram removidos com sucesso.");
              signOut(); // Desloga do app
            } catch (error: any) {
              console.error(error);
              Alert.alert("Erro", "Não foi possível excluir a conta. Tente novamente.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={Typography.header}>Minha Conta</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Card de Perfil */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.name || "Usuário"}</Text>
            <Text style={styles.userEmail}>{user?.email || "email@teste.com"}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {user?.type === 'cook' ? 'Cozinheiro' : 'Cliente'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[Typography.subHeader, { marginTop: 20, marginBottom: 10 }]}>Ações</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={20} color={Colors.light.text} />
          <Text style={styles.logoutText}>Sair do App</Text>
        </TouchableOpacity>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Zona de Perigo</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={20} color="#FFF" />
            <Text style={styles.deleteText}>Excluir Minha Conta</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { 
    padding: 20, 
    backgroundColor: Colors.light.card, 
    ...Shadows.soft 
  },
  content: { padding: 20 },
  
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 20, borderRadius: 16,
    ...Shadows.soft
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 15
  },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: Colors.light.primary },
  userName: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  userEmail: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 4 },
  badge: { 
    backgroundColor: '#E0E0E0', paddingHorizontal: 8, 
    paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' 
  },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#555', textTransform: 'uppercase' },

  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.light.card,
    padding: 15, borderRadius: 12, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.light.border
  },
  logoutText: { marginLeft: 8, fontWeight: '600', color: Colors.light.text },

  dangerZone: {
    marginTop: 10, padding: 20,
    backgroundColor: '#FFEBEE', borderRadius: 16,
    borderWidth: 1, borderColor: '#FFCDD2'
  },
  dangerTitle: { 
    color: '#D32F2F', fontWeight: 'bold', marginBottom: 10, fontSize: 12, textTransform: 'uppercase' 
  },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#D32F2F',
    padding: 15, borderRadius: 12
  },
  deleteText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 }
});