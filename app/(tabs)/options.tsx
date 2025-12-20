// app/(tabs)/options.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Shadows, Typography } from '../../src/constants/theme';

export default function OptionsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* Usa o estilo correto do teu tema */}
        <Text style={Typography.header}>Opções</Text>
      </View>

      <View style={styles.content}>
        <Text style={[Typography.subHeader, { marginBottom: 15 }]}>Financeiro</Text>

        {/* --- BOTÃO QUE CORRIGE O PROBLEMA --- */}
        {/* Ao clicar, ele empilha a tela de pagamento em vez de tentar renderizar na aba */}
        <TouchableOpacity 
          style={styles.optionButton} 
          onPress={() => router.push('/payment')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="card-outline" size={24} color={Colors.light.primary} />
          </View>
          <Text style={styles.optionText}>Carteira & Pagamento</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
        </TouchableOpacity>

        <Text style={[Typography.subHeader, { marginBottom: 15, marginTop: 20 }]}>Geral</Text>

        {/* Botão para ir para a Conta (onde vamos colocar o botão de excluir) */}
        <TouchableOpacity 
          style={styles.optionButton} 
          onPress={() => router.push('/(tabs)/account')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="person-circle-outline" size={24} color={Colors.light.text} />
          </View>
          <Text style={styles.optionText}>Dados da Conta</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
        </TouchableOpacity>
      </View>
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
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...Shadows.soft
  },
  iconContainer: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12
  },
  optionText: { 
    flex: 1, 
    fontSize: 16, 
    fontWeight: '600', 
    color: Colors.light.text 
  }
});