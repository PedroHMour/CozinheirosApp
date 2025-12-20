// app/payment.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors, Shadows, Typography } from '../src/constants/theme';
import { api } from '../src/services/api';
import { MercadoPagoService } from '../src/services/mercadopago';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // Recebe dish, price, latitude, longitude, client_id

  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  const [methods, setMethods] = useState<any[]>([
    { id: 'pix', type: 'pix', key: 'Pagamento Instantâneo', title: 'Pix' } 
  ]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Estados do Cartão
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cpf, setCpf] = useState('');

  const handleAddCard = async () => {
    if(!cardNumber || !cardName || !expiry || !cvv || !cpf) {
        return Alert.alert("Atenção", "Preencha todos os campos.");
    }
    const [month, year] = expiry.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 2) {
        return Alert.alert("Validade Inválida", "Use o formato MM/AA (ex: 12/28)");
    }
    const fullYear = `20${year}`;
    setLoading(true);
    try {
        const token = await MercadoPagoService.createCardToken({
            cardNumber,
            cardholderName: cardName,
            cardExpirationMonth: month,
            cardExpirationYear: fullYear,
            securityCode: cvv,
            docType: "CPF",
            docNumber: cpf
        });

        const newCard = {
            id: token,
            type: 'card',
            last4: cardNumber.slice(-4),
            brand: 'visa',
            token: token,
            cpf_titular: cpf,
            nome_titular: cardName,
            email_titular: "email@teste.com"
        };
        setMethods([...methods, newCard]);
        setSelectedMethod(token);
        setModalVisible(false);
        setCardNumber(''); setCardName(''); setExpiry(''); setCvv(''); setCpf('');
        Alert.alert("Sucesso", "Cartão adicionado! Selecione-o para pagar.");
    } catch (error: any) {
        Alert.alert("Erro ao validar cartão", error.message);
    } finally {
        setLoading(false);
    }
  };

  // --- AQUI ESTÁ A MÁGICA: PAGA E DEPOIS CRIA O PEDIDO ---
  const handlePay = async () => {
      if (!selectedMethod) return;
      const method = methods.find(m => m.id === selectedMethod);
      if (!method) return;

      setPaying(true);
      try {
          // 1. PROCESSA O PAGAMENTO
          if (method.type === 'pix') {
             const response = await api.post('/payments/pix', {
                 transaction_amount: Number(params.price), // Usa o preço real
                 description: `Pedido: ${params.dish}`,
                 payer_email: "cliente@teste.com",
                 payer_first_name: "Cliente",
                 external_reference: `PEDIDO_${Math.floor(Math.random() * 1000)}`
             });
             Alert.alert("Pix Gerado!", "Copie o código: " + response.qr_code);
             // Pix é assíncrono, então paramos aqui ou criamos o pedido como 'aguardando_pagamento'
             return; 
          } else {
             // Cartão
             await api.post('/payments/card', {
                 token: method.token, 
                 transaction_amount: Number(params.price),
                 description: `Pedido: ${params.dish}`,
                 installments: 1,
                 payment_method_id: method.brand,
                 issuer_id: "203",
                 payer_email: method.email_titular,
                 payer_first_name: method.nome_titular.split(' ')[0],
                 payer_cpf: method.cpf_titular,
                 external_reference: `ORDER_${Date.now()}`
             });
          }

          // 2. SE O PAGAMENTO PASSOU, CRIA O PEDIDO NO BANCO
          // Isso garante que o Chef receba o pedido com os dados corretos
          await api.post('/requests', {
            client_id: params.client_id,
            dish_description: params.dish,
            offer_price: params.price,
            latitude: params.latitude,
            longitude: params.longitude,
            payment_method: method.type
          });

          Alert.alert("Sucesso! 🎉", "Pagamento confirmado e Chef solicitado!");

          // 3. VOLTA PARA O DASHBOARD
          router.replace('/(tabs)/dashboard');

      } catch (error: any) {
      
          console.error(error);
          Alert.alert("Falha no Pagamento", "Ocorreu um erro ao processar. Tente novamente.");
      } finally {
          setPaying(false);
      }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSelected = selectedMethod === item.id;
    return (
      <TouchableOpacity 
        style={[styles.card, isSelected && styles.cardSelected]} 
        onPress={() => setSelectedMethod(item.id)}
      >
        <View style={styles.cardIcon}>
          <Ionicons 
            name={item.type === 'card' ? "card" : "qr-code"} 
            size={24} 
            color={isSelected ? '#FFF' : Colors.light.primary} 
          />
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={[styles.methodTitle, isSelected && {color:'#FFF'}]}>
            {item.type === 'card' ? `Cartão final ${item.last4}` : 'Pix'}
          </Text>
          <Text style={[styles.methodSub, isSelected && {color:'rgba(255,255,255,0.8)'}]}>
            {item.type === 'card' ? 'Crédito' : 'Aprovação Imediata'}
          </Text>
        </View>
        {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#FFF" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={Typography.header}>Carteira</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
            <Text style={Typography.subHeader}>Métodos de Pagamento</Text>
        </View>

        <FlatList
          data={methods}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListFooterComponent={
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={20} color={Colors.light.primary} />
                <Text style={styles.addText}>Adicionar novo cartão</Text>
            </TouchableOpacity>
          }
        />

        {selectedMethod && (
            <View style={styles.footer}>
                <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:10}}>
                    <Text style={Typography.body}>Total a pagar:</Text>
                    <Text style={[Typography.subHeader, {color: Colors.light.primary}]}>
                        R$ {Number(params.price).toFixed(2)}
                    </Text>
                </View>
                <TouchableOpacity 
                    style={styles.payBtn} 
                    onPress={handlePay}
                    disabled={paying}
                >
                    {paying ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={Typography.button}>Pagar Agora</Text>
                    )}
                </TouchableOpacity>
            </View>
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={Typography.subHeader}>Novo Cartão</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
                </TouchableOpacity>
            </View>

            <TextInput 
              style={styles.input} placeholder="Número do Cartão" keyboardType="numeric"
              value={cardNumber} onChangeText={setCardNumber} maxLength={16} placeholderTextColor="#999"
            />
            <TextInput 
              style={styles.input} placeholder="Nome impresso no cartão" 
              value={cardName} onChangeText={setCardName} autoCapitalize="characters" placeholderTextColor="#999"
            />
            <TextInput 
              style={styles.input} placeholder="CPF do Titular" keyboardType="numeric"
              value={cpf} onChangeText={setCpf} maxLength={11} placeholderTextColor="#999"
            />
            <View style={{flexDirection:'row', gap: 10}}>
                <TextInput 
                    style={[styles.input, {flex:1}]} placeholder="Validade (MM/AA)" 
                    value={expiry} onChangeText={setExpiry} maxLength={5} keyboardType="numeric" placeholderTextColor="#999"
                />
                <TextInput 
                    style={[styles.input, {flex:1}]} placeholder="CVV" 
                    value={cvv} onChangeText={setCvv} keyboardType="numeric" maxLength={4} placeholderTextColor="#999"
                />
            </View>

            <TouchableOpacity 
                style={[styles.saveBtn, loading && {opacity: 0.7}]} 
                onPress={handleAddCard} disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={Typography.button}>Salvar Cartão</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerContainer: { 
      flexDirection: 'row', alignItems: 'center', padding: 20, 
      backgroundColor: Colors.light.card, ...Shadows.soft 
  },
  backBtn: { marginRight: 15 },
  content: { flex: 1, padding: 20 },
  sectionHeader: { marginBottom: 15, marginTop: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 20, borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: 'transparent',
    ...Shadows.soft
  },
  cardSelected: {
      backgroundColor: Colors.light.primary, 
      borderColor: Colors.light.primary,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center', alignItems: 'center'
  },
  methodTitle: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  methodSub: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  addBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent:'center',
      padding: 15, borderWidth: 1, borderColor: Colors.light.primary,
      borderRadius: 12, borderStyle: 'dashed', marginTop: 10,
      backgroundColor: 'rgba(255, 111, 0, 0.05)'
  },
  addText: { color: Colors.light.primary, fontWeight: 'bold', marginLeft: 8 },
  footer: {
      position: 'absolute', bottom: 20, left: 20, right: 20,
      backgroundColor: Colors.light.card, padding: 20, borderRadius: 16,
      ...Shadows.float
  },
  payBtn: {
      backgroundColor: Colors.light.primary, padding: 16, 
      borderRadius: 12, alignItems: 'center'
  },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalContent: { 
      backgroundColor: Colors.light.card, padding: 25, 
      borderTopLeftRadius: 25, borderTopRightRadius: 25, ...Shadows.float
  },
  modalHeader: { flexDirection:'row', justifyContent:'space-between', alignItems: 'center', marginBottom:20 },
  input: { 
    backgroundColor: Colors.light.background, padding: 16, borderRadius: 12, 
    marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: Colors.light.border, color: Colors.light.text
  },
  saveBtn: { 
    backgroundColor: Colors.light.primary, padding: 16, 
    borderRadius: 12, alignItems: 'center', marginTop: 10 
  },
});
