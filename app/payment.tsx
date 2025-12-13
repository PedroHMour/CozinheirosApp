import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { api } from '../src/services/api'; // <--- IMPORTANTE: Importamos a API
import { MercadoPagoService } from '../src/services/mercadopago';

export default function PaymentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false); // Novo estado para o loading do pagamento
  
  // Lista de métodos
  const [methods, setMethods] = useState<any[]>([
    // ID 'pix' é especial, tratamos diferente
    { id: 'pix', type: 'pix', key: 'Pagamento Instantâneo', title: 'Pix' } 
  ]);

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  
  const [modalVisible, setModalVisible] = useState(false);

  // Estados do Formulário de Cartão
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cpf, setCpf] = useState('');

  // --- FUNÇÃO 1: Adicionar Cartão (Gera Token) ---
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
        // Gera o token no Mercado Pago (Frontend)
        const token = await MercadoPagoService.createCardToken({
            cardNumber,
            cardholderName: cardName,
            cardExpirationMonth: month,
            cardExpirationYear: fullYear,
            securityCode: cvv,
            docType: "CPF",
            docNumber: cpf
        });

        // Adiciona à lista local para o usuário selecionar
        const newCard = {
            id: token, // O ID é o token
            type: 'card',
            last4: cardNumber.slice(-4),
            brand: 'visa', // Simplificação: num app real, detectamos a bandeira pelo bin
            token: token,
            cpf_titular: cpf, // Precisamos enviar o CPF para o backend depois
            nome_titular: cardName,
            email_titular: "email@teste.com" // Idealmente vem do AuthContext
        };
        
        setMethods([...methods, newCard]);
        setSelectedMethod(token); // Já seleciona o novo cartão
        setModalVisible(false);
        
        // Limpa campos
        setCardNumber(''); setCardName(''); setExpiry(''); setCvv(''); setCpf('');
        Alert.alert("Sucesso", "Cartão adicionado! Selecione-o para pagar.");

    } catch (error: any) {
        Alert.alert("Erro ao validar cartão", error.message);
    } finally {
        setLoading(false);
    }
  };

  // --- FUNÇÃO 2: Realizar Pagamento (Chama Backend) ---
  const handlePay = async () => {
      if (!selectedMethod) return;

      const method = methods.find(m => m.id === selectedMethod);
      if (!method) return;

      setPaying(true);

      try {
          if (method.type === 'pix') {
             // Lógica de Pix (Chama /payments/pix)
             const response = await api.post('/payments/pix', {
                 transaction_amount: 150.00, // Valor hardcoded para teste
                 description: "Pedido Teste App",
                 payer_email: "cliente@teste.com",
                 payer_first_name: "Cliente",
                 external_reference: `PEDIDO_${Math.floor(Math.random() * 1000)}`
             });
             // Aqui você abriria uma tela com o QR Code retornado: response.qr_code
             Alert.alert("Pix Gerado!", "Copie o código: " + response.qr_code);

          } else {
             // Lógica de Cartão (Chama /payments/card)
             // Enviamos o TOKEN e os dados para o Backend processar
             await api.post('/payments/card', {
                 token: method.token, 
                 transaction_amount: 100.50, // Valor teste
                 description: "Jantar Chef Local",
                 installments: 1,
                 payment_method_id: method.brand, // 'visa' ou 'master'
                 issuer_id: "203", // Opcional ou detectado
                 payer_email: method.email_titular,
                 payer_first_name: method.nome_titular.split(' ')[0],
                 payer_cpf: method.cpf_titular,
                 external_reference: `ORDER_${Date.now()}`
             });
             
             Alert.alert("Pagamento Aprovado!", "O seu pedido foi enviado para o cozinheiro.");
             // router.push('/success');
          }
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

        {/* BOTÃO FLUTUANTE DE PAGAR */}
        {selectedMethod && (
            <View style={styles.footer}>
                <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:10}}>
                    <Text style={Typography.body}>Total a pagar:</Text>
                    <Text style={[Typography.subHeader, {color: Colors.light.primary}]}>R$ 100,50</Text>
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

      {/* MODAL ADICIONAR CARTÃO (IGUAL AO ANTERIOR) */}
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
      backgroundColor: Colors.light.primary, // Laranja quando selecionado
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

  // Modal Styles
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