import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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
import { calculateEarnings, PACKAGES } from '../../src/constants/packages';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/services/supabase';

export default function MenuScreen() {
  const { user, updateUser } = useAuth();
  
  const [isActive, setIsActive] = useState(true);
  const [dish, setDish] = useState('');
  const [loading, setLoading] = useState(false);

  const myLevel = user?.cook_level || 'basic';
  const myPackage = PACKAGES.find(p => p.id === myLevel) || PACKAGES[0];
  const earnings = calculateEarnings(myPackage.id);

  useEffect(() => {
    const fetchMyMenu = async () => {
        if (!user?.id) return;
        
        const { data } = await supabase
          .from('users')
          .select('dish_description, is_active')
          .eq('id', user.id)
          .single();

        if (data) {
            setDish(data.dish_description || '');
            setIsActive(data.is_active || false);
        }
    };

    fetchMyMenu();
  }, [user?.id]);

  const handleSave = async () => {
    setLoading(true);
    try {
        const { error } = await supabase
            .from('users')
            .update({
                dish_description: dish,
                is_active: isActive
            })
            .eq('id', user?.id);

        if (error) throw error;

        updateUser({ dish_description: dish, is_active: isActive } as any);
        
        Alert.alert("Sucesso", "Cardápio atualizado! " + (isActive ? "Você está visível." : "Você está oculto."));
    } catch {
        // CORREÇÃO: Removido (error) pois não estava sendo usado
        Alert.alert("Erro", "Falha ao atualizar cardápio.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1}}>
        <ScrollView contentContainerStyle={{padding: 20}}>
            
            <Text style={styles.headerTitle}>Meu Cardápio</Text>

            <View style={[styles.card, {borderColor: isActive ? Colors.light.primary : '#DDD'}]}>
                <View style={{flex: 1}}>
                    <Text style={styles.cardTitle}>Status da Cozinha</Text>
                    <Text style={styles.cardDesc}>
                        {isActive ? '🟢 Aberta (Recebendo pedidos)' : '🔴 Fechada (Invisível no mapa)'}
                    </Text>
                </View>
                <Switch 
                    value={isActive} 
                    onValueChange={setIsActive} 
                    trackColor={{false: '#DDD', true: Colors.light.primaryLight}}
                    thumbColor={isActive ? Colors.light.primary : '#f4f3f4'}
                />
            </View>

            <View style={styles.infoBox}>
                <Ionicons name="star" size={24} color="#FFD700" />
                <View style={{marginLeft: 15, flex: 1}}>
                    <Text style={styles.infoTitle}>Seu Nível: {myPackage.label}</Text>
                    <Text style={styles.infoDesc}>
                        Preço fixo para o cliente: <Text style={{fontWeight:'bold'}}>R$ {myPackage.price.toFixed(2)}</Text>
                    </Text>
                    <Text style={styles.infoHighlight}>
                        Você recebe: R$ {earnings.profit.toFixed(2)} por pedido
                    </Text>
                </View>
            </View>

            <Text style={styles.label}>Prato do Dia</Text>
            <TextInput 
                style={styles.input} 
                value={dish} 
                onChangeText={setDish}
                placeholder="Ex: Strogonoff de Frango, Feijoada..." 
                placeholderTextColor="#999"
            />
            <Text style={styles.helperText}>Descreva apenas o prato principal que está servindo hoje.</Text>

            <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={loading}>
                {loading ? <View /> : <Text style={styles.btnText}>SALVAR ALTERAÇÕES</Text>}
            </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.light.text, marginBottom: 20 },
  card: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
      padding: 20, borderRadius: 16, marginBottom: 20,
      borderWidth: 2, elevation: 2
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: Colors.light.text },
  cardDesc: { fontSize: 13, color: '#666', marginTop: 4 },
  infoBox: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9C4', 
      padding: 15, borderRadius: 12, marginBottom: 30
  },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#F57F17' },
  infoDesc: { fontSize: 14, color: '#555', marginTop: 2 },
  infoHighlight: { fontSize: 14, color: '#333', fontWeight: 'bold', marginTop: 5 },
  label: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text, marginBottom: 8 },
  input: { 
      backgroundColor: '#F5F5F5', padding: 16, borderRadius: 12, fontSize: 16, 
      borderWidth: 1, borderColor: '#EEE', color: '#333'
  },
  helperText: { fontSize: 12, color: '#888', marginTop: 5, marginBottom: 30 },
  btnSave: { 
      backgroundColor: Colors.light.primary, padding: 18, borderRadius: 14, 
      alignItems: 'center', shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity: 0.2, shadowRadius: 4
  },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});