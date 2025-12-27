import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/services/supabase';

export default function CompleteProfileScreen() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSelectType = async (type: 'client' | 'cook') => {
    setLoading(true);
    try {
      if (!user?.id) return;

      // 1. Tenta atualizar no Banco de Dados (Supabase)
      const { error } = await supabase
        .from('users')
        .update({ type: type })
        .eq('id', user.id);

      if (error) {
          console.error("Erro Supabase:", error);
          throw new Error("Falha ao salvar no banco.");
      }

      // 2. Se deu certo no banco, atualiza no App (Isso dispara o redirecionamento)
      await updateUser({ type });

    } catch {
      // CORREÇÃO: Variável 'error' removida do catch para satisfazer o ESLint
      Alert.alert("Erro", "Não foi possível salvar sua escolha. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="person-circle-outline" size={80} color="#FF6F00" />
        <Text style={styles.title}>Falta pouco!</Text>
        <Text style={styles.subtitle}>Para continuar, precisamos saber como você vai usar o Chefe Local.</Text>

        <View style={styles.options}>
            {/* Opção CLIENTE */}
            <TouchableOpacity 
                style={styles.card} 
                onPress={() => handleSelectType('client')}
                disabled={loading}
            >
                <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="restaurant-outline" size={32} color="#2196F3" />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.cardTitle}>Quero Comer</Text>
                    <Text style={styles.cardDesc}>Buscar pratos caseiros na vizinhança.</Text>
                </View>
            </TouchableOpacity>

            {/* Opção COZINHEIRO */}
            <TouchableOpacity 
                style={styles.card} 
                onPress={() => handleSelectType('cook')}
                disabled={loading}
            >
                <View style={[styles.iconBox, { backgroundColor: '#FFEBEE' }]}>
                    <Ionicons name="flame-outline" size={32} color="#D32F2F" />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.cardTitle}>Quero Cozinhar</Text>
                    <Text style={styles.cardDesc}>Vender minha comida e gerenciar pedidos.</Text>
                </View>
            </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator style={{marginTop: 20}} color="#FF6F00" />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', justifyContent: 'center' },
  content: { padding: 30, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 20 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 10, marginBottom: 40 },
  options: { width: '100%', gap: 15 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE' },
  iconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardDesc: { fontSize: 13, color: '#888' },
});