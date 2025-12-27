import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/services/api';

export default function MenuScreen() {
  // CORREÇÃO 1: Removido 'updateUser' que não estava sendo usado
  const { user } = useAuth();
  
  const [isActive, setIsActive] = useState(true);
  const [dish, setDish] = useState('Marmita Tradicional');
  const [price, setPrice] = useState('25.00');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
        await api.post('/users/update-dish', {
            id: user?.id,
            dish,
            price,
            is_active: isActive
        });
        
        Alert.alert("Sucesso", "Seu cardápio foi atualizado!");
    } catch {
        Alert.alert("Erro", "Falha ao atualizar cardápio.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1}}>
        <ScrollView contentContainerStyle={{padding: 20}}>
            
            <Text style={styles.title}>O que vamos servir?</Text>

            <View style={styles.statusCard}>
                <View>
                    <Text style={styles.statusTitle}>Cozinha {isActive ? 'Aberta 🟢' : 'Fechada 🔴'}</Text>
                    <Text style={styles.statusDesc}>Ative para aparecer no mapa.</Text>
                </View>
                <Switch 
                    value={isActive} 
                    onValueChange={setIsActive} 
                    trackColor={{false: '#DDD', true: '#FFCDD2'}}
                    thumbColor={isActive ? '#D32F2F' : '#f4f3f4'}
                />
            </View>

            <Text style={styles.label}>Prato do Dia</Text>
            <TextInput 
                style={styles.input} 
                value={dish} 
                onChangeText={setDish}
                placeholder="Ex: Strogonoff de Frango" 
            />

            <Text style={styles.label}>Preço (R$)</Text>
            <TextInput 
                style={styles.input} 
                value={price} 
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="0.00" 
            />

            <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={loading}>
                <Text style={styles.btnText}>{loading ? 'Salvando...' : 'ATUALIZAR CARDÁPIO'}</Text>
            </TouchableOpacity>

            <View style={styles.tipBox}>
                <Ionicons name="information-circle" size={20} color="#666" />
                {/* CORREÇÃO 2: Substituídas as aspas " por &quot; para evitar erro do ESLint */}
                <Text style={styles.tipText}>Mantenha seu cardápio simples. A maioria dos clientes prefere saber apenas o &quot;Prato Principal&quot;.</Text>
            </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20, marginTop: 10 },
  statusCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9F9F9', padding: 20, borderRadius: 12, marginBottom: 30, borderWidth: 1, borderColor: '#EEE' },
  statusTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statusDesc: { fontSize: 12, color: '#888', marginTop: 4 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#F5F5F5', padding: 15, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#EEE' },
  btnSave: { backgroundColor: '#D32F2F', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 40 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  tipBox: { marginTop: 30, flexDirection: 'row', padding: 15, backgroundColor: '#E3F2FD', borderRadius: 8, gap: 10 },
  tipText: { flex: 1, color: '#555', fontSize: 12 }
});