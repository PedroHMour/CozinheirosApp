import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Shadows, Typography } from '../../src/constants/theme';

export default function OptionsScreen() {
  const router = useRouter();

  const OptionItem = ({ icon, label, dest, color = Colors.light.text }: any) => (
    <TouchableOpacity 
      style={styles.item} 
      onPress={() => dest ? router.push(dest) : alert("Em breve")}
    >
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.itemText}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={Typography.heading1}>Ajustes</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.sectionTitle}>Financeiro</Text>
        <View style={styles.card}>
          {/* LINK PARA A NOVA TELA DE PAGAMENTO */}
          <OptionItem icon="wallet" label="Pagamento & Carteira" dest="/payment" color={Colors.light.primary} />
          <OptionItem icon="pricetag" label="Cupons de Desconto" color={Colors.light.success} />
        </View>

        <Text style={styles.sectionTitle}>Aplicativo</Text>
        <View style={styles.card}>
          <OptionItem icon="notifications" label="Notificações" color="#FF9800" />
          <OptionItem icon="language" label="Idioma" color="#2196F3" />
          <OptionItem icon="moon" label="Modo Escuro" color="#673AB7" />
        </View>

        <Text style={styles.sectionTitle}>Suporte</Text>
        <View style={styles.card}>
          <OptionItem icon="help-buoy" label="Central de Ajuda" />
          <OptionItem icon="document-text" label="Termos de Uso" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE' },
  sectionTitle: { ...Typography.heading3, marginTop: 20, marginBottom: 10, marginLeft: 5 },
  card: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', ...Shadows.small },
  item: { 
    flexDirection: 'row', alignItems: 'center', padding: 15, 
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5' 
  },
  iconBox: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemText: { flex: 1, fontSize: 16, color: Colors.light.text, fontWeight: '500' }
});