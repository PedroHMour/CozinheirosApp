import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AccountScreen() {
  const { user, signOut } = useAuth();

  // Função chamada pelo botão "Sair da Conta"
  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Sair Agora", 
        style: 'destructive',
        onPress: async () => {
            // 1. Chamamos o signOut. O contexto limpa os dados.
            // 2. O _layout.tsx percebe que user é null.
            // 3. O _layout.tsx desmonta a pasta (tabs) e monta (auth).
            // 4. Resultado: Você vai para o login sem chance de "loop".
            await signOut();
        } 
      }
    ]);
  };

  // Proteção visual simples. 
  // O redirecionamento real é feito pelo _layout, mas isso evita erros de renderização
  if (!user) {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6F00" />
        </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minha Conta</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* CABEÇALHO DO PERFIL */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
             {user.photo ? (
                <Image source={{ uri: user.photo }} style={styles.avatar} />
             ) : (
                <Text style={styles.avatarText}>{user.name ? user.name.charAt(0) : 'U'}</Text>
             )}
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.tag}>
             <Text style={styles.tagText}>{user.type === 'cook' ? '👨‍🍳 Cozinheiro' : '👤 Cliente VIP'}</Text>
          </View>
        </View>

        {/* OPÇÕES */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Configurações</Text>
           
           {/* BOTÃO DE LOGOUT */}
           <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={[styles.iconBox, {backgroundColor:'#FFEBEE'}]}>
                <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
              </View>
              <Text style={[styles.menuText, {color:'#D32F2F'}]}>Sair da Conta</Text>
           </TouchableOpacity>
        </View>

        <Text style={styles.version}>Versão 1.0.0 • Chefe Local</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', alignItems: 'center', marginTop: 30 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  scrollContent: { paddingBottom: 40 },
  profileHeader: { alignItems: 'center', paddingVertical: 30 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FF6F00', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarText: { fontSize: 40, color: '#FFF', fontWeight: 'bold' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 14, color: '#888', marginBottom: 10 },
  tag: { backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 15 },
  tagText: { color: '#FF6F00', fontSize: 12, fontWeight: 'bold' },
  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, color: '#333', fontWeight: '500' },
  version: { textAlign: 'center', color: '#CCC', fontSize: 12, marginTop: 10 }
});