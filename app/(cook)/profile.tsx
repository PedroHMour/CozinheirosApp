import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

export default function CookProfile() {
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sair", "Encerrar expediente?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: signOut }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarBox}>
            <Image source={{uri: user?.photo || 'https://via.placeholder.com/150'}} style={styles.avatar} />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.badge}>
            <Text style={styles.badgeText}>CHEF PROFISSIONAL</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="wallet-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Relatório de Vendas</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Configurações</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
            <Text style={[styles.menuText, { color: '#D32F2F' }]}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#FFF', alignItems: 'center', padding: 30, marginBottom: 20 },
  avatarBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EEE', overflow: 'hidden', marginBottom: 15 },
  avatar: { width: '100%', height: '100%' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 14, color: '#888', marginBottom: 10 },
  badge: { backgroundColor: '#FFEBEE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 },
  badgeText: { color: '#D32F2F', fontSize: 10, fontWeight: 'bold' },
  menu: { backgroundColor: '#FFF', paddingHorizontal: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  menuText: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '500' }
});