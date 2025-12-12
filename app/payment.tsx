import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors, Shadows, Typography } from '../src/constants/theme';

export default function PaymentScreen() {
  const router = useRouter();
  const [methods, setMethods] = useState([
    { id: '1', type: 'card', last4: '4242', brand: 'Visa' },
    { id: '2', type: 'pix', key: 'minha@chave.com' }
  ]);
  const [modalVisible, setModalVisible] = useState(false);

  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');

  const handleAddCard = () => {
    if(!cardNumber || !cardName) return Alert.alert("Erro", "Preencha os dados");
    
    const newCard = {
      id: Math.random().toString(),
      type: 'card',
      last4: cardNumber.slice(-4),
      brand: 'Mastercard' // Simulado
    };
    
    setMethods([...methods, newCard]);
    setModalVisible(false);
    setCardNumber('');
    setCardName('');
    Alert.alert("Sucesso", "Método adicionado!");
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Ionicons 
          name={item.type === 'card' ? "card" : "qr-code"} 
          size={24} 
          color={Colors.light.primary} 
        />
      </View>
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text style={styles.methodTitle}>
          {item.type === 'card' ? `•••• ${item.last4}` : 'Pix Cadastrado'}
        </Text>
        <Text style={styles.methodSub}>
          {item.type === 'card' ? item.brand : 'Chave Padrão'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => Alert.alert("Remover", "Deseja remover este método?")}>
        <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={Typography.heading2}>Carteira & Pagamento</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Seu Saldo</Text>
          <Text style={styles.balanceValue}>R$ 0,00</Text>
          <Text style={styles.balanceSub}>Adicione saldo para pagar mais rápido</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={Typography.heading3}>Métodos Salvos</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.addText}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={methods}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>

      {/* MODAL ADD CARTÃO */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={Typography.heading3}>Adicionar Cartão</Text>
            
            <TextInput 
              style={styles.input} 
              placeholder="Número do Cartão" 
              keyboardType="numeric"
              value={cardNumber}
              onChangeText={setCardNumber}
              maxLength={16}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Nome no Cartão" 
              value={cardName}
              onChangeText={setCardName}
            />
            <View style={{flexDirection:'row', gap: 10}}>
                <TextInput style={[styles.input, {flex:1}]} placeholder="MM/AA" />
                <TextInput style={[styles.input, {flex:1}]} placeholder="CVV" keyboardType="numeric" maxLength={3}/>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddCard}>
              <Text style={styles.saveText}>Salvar Método</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{marginTop:15, alignItems:'center'}}>
              <Text style={{color: Colors.light.error}}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF' },
  backBtn: { marginRight: 15 },
  content: { flex: 1, padding: 20 },
  
  balanceContainer: {
    backgroundColor: Colors.light.primary,
    borderRadius: 15,
    padding: 25,
    marginBottom: 30,
    alignItems: 'center',
    ...Shadows.medium
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 5 },
  balanceValue: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  balanceSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 5 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  addText: { color: Colors.light.primary, fontWeight: 'bold' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15, borderRadius: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#EEE'
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center', alignItems: 'center'
  },
  methodTitle: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  methodSub: { fontSize: 12, color: Colors.light.textSecondary },

  // Modal
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalContent: { backgroundColor:'#FFF', padding: 25, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  input: { 
    backgroundColor: '#F5F5F5', padding: 15, borderRadius: 10, 
    marginBottom: 10, fontSize: 16, borderWidth:1, borderColor:'#EEE' 
  },
  saveBtn: { 
    backgroundColor: Colors.light.primary, padding: 15, 
    borderRadius: 10, alignItems: 'center', marginTop: 10 
  },
  saveText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});