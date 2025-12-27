import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/services/api';

// --- COMPONENTE DE PAGAMENTO ---
const PaymentModal = ({ visible, onClose, paymentData, orderId, onSuccess }: any) => {
    const [checking, setChecking] = useState(false);

    const copyToClipboard = async () => {
        if(paymentData?.qr_code) {
            await Clipboard.setStringAsync(paymentData.qr_code);
            Alert.alert("Copiado!", "Cole no app do seu banco (Pix Copia e Cola).");
        }
    };

    const handleCheckPayment = async () => {
        setChecking(true);
        try {
            // Tenta pegar o ID correto (pode vir do banco ou direto do MP)
            const idToCheck = paymentData.id || paymentData.mp_payment_id;
            
            const response = await api.post('/payments/check', {
                payment_id: idToCheck,
                order_id: orderId
            });
            
            if (response.approved) {
                Alert.alert("Confirmado!", "Pagamento recebido com sucesso.");
                onSuccess();
            } else {
                Alert.alert("Pendente", `O banco ainda não confirmou o recebimento.\nStatus: ${response.status}.\nSe já pagou, aguarde 10 segundos e tente novamente.`);
            }
        } catch {
            Alert.alert("Erro", "Erro ao verificar status.");
        } finally {
            setChecking(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.paymentCard}>
                    <View style={styles.payHeader}>
                        <Text style={styles.payTitle}>Pagamento via Pix</Text>
                        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#999" /></TouchableOpacity>
                    </View>
                    <Text style={styles.paySub}>Escaneie ou copie o código abaixo.</Text>

                    <View style={styles.qrContainer}>
                        {paymentData?.qr_code_base64 ? (
                            <Image 
                                source={{ uri: `data:image/png;base64,${paymentData.qr_code_base64}` }} 
                                style={{ width: 200, height: 200 }} 
                            />
                        ) : (
                            <ActivityIndicator size="large" color="#2196F3" />
                        )}
                    </View>

                    <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard}>
                        <Ionicons name="copy-outline" size={20} color="#2196F3" />
                        <Text style={styles.copyText}>Copiar Código Pix</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.payConfirmBtn} onPress={handleCheckPayment} disabled={checking}>
                        {checking ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payConfirmText}>JÁ FIZ O PAGAMENTO</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// --- COMPONENTE DE CHAT ---
const ChatModal = ({ visible, onClose, orderId, partnerName }: any) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const fetchMessages = useCallback(async () => {
        if(!orderId) return;
        const msgs = await api.get(`/chat/${orderId}`);
        setMessages(msgs);
    }, [orderId]);

    useEffect(() => {
        if(visible) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [visible, fetchMessages]);

    const handleSend = async () => {
        if(!inputText.trim()) return;
        try {
            await api.post('/chat/send', {
                order_id: orderId,
                sender_id: user?.id,
                content: inputText,
                type: 'text'
            });
            setInputText('');
            fetchMessages();
        } catch {}
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={{flex:1, backgroundColor:'#F5F5F5'}} edges={['top', 'bottom']}>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={styles.chatHeader}>
                        <TouchableOpacity onPress={onClose}><Ionicons name="chevron-down" size={30} color="#333" /></TouchableOpacity>
                        <Text style={{fontWeight:'bold', fontSize:16, marginLeft:10}}>{partnerName}</Text>
                    </View>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={{padding: 15}}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                        renderItem={({item}) => {
                            const isMe = item.sender_id === user?.id;
                            return (
                                <View style={[styles.msgBubble, isMe ? styles.msgMe : styles.msgOther]}>
                                    <Text style={[styles.msgText, isMe && {color:'#FFF'}]}>{item.content}</Text>
                                </View>
                            );
                        }}
                    />
                    <View style={styles.inputArea}>
                        <TextInput style={styles.chatInput} value={inputText} onChangeText={setInputText} placeholder="Mensagem..." />
                        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}><Ionicons name="send" size={20} color="#FFF" /></TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

// --- TELA PRINCIPAL ---
export default function ActivityScreen() {
  const { user } = useAuth();
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false); // Loading específico do botão de pagar
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if(!user?.id) return;
    try {
        const myRequests = await api.get(`/my-requests/${user.id}`);
        
        if (myRequests && myRequests.length > 0) {
            const latest = myRequests[0];
            setActiveOrder(latest);

            if (latest.status === 'pending') {
                const candidates = await api.get(`/requests/offers/${latest.id}`);
                setOffers(candidates);
            }

            // Tenta pré-carregar pagamento se existir
            if (latest.status === 'accepted') {
                const existingPayment = await api.get(`/payments/order/${latest.id}`);
                if (existingPayment && existingPayment.mp_status === 'pending') {
                    setCurrentPayment({
                        id: existingPayment.mp_payment_id || existingPayment.id,
                        qr_code: existingPayment.qr_code_base64 || existingPayment.qr_code, 
                        qr_code_base64: existingPayment.qr_code_base64
                    });
                }
            }
        } else {
            setActiveOrder(null);
        }
    } catch (e) {
        console.log(e);
    } finally {
        setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // --- FUNÇÃO CORRIGIDA: LÓGICA DO BOTÃO "PAGAR AGORA" ---
  const handlePayNow = async () => {
      // 1. Se já temos os dados na memória, só abre o modal
      if (currentPayment) {
          setPaymentModalVisible(true);
          return;
      }

      setPaying(true);
      try {
          // 2. Tenta buscar no banco de dados primeiro
          let payment = await api.get(`/payments/order/${activeOrder.id}`);
          
          // 3. Se não achar no banco, CRIA um novo pagamento na hora
          if (!payment) {
              const response = await api.post('/payments/create', {
                  order_id: activeOrder.id,
                  client_id: user?.id,
                  client_email: user?.email,
                  client_name: user?.name,
                  amount: parseFloat(activeOrder.offer_price)
              });
              
              if (response.ok) {
                  payment = response.payment;
              }
          }

          // 4. Se conseguiu o pagamento (recuperado ou criado), abre o modal
          if (payment) {
              const formattedPayment = {
                  id: payment.mp_payment_id || payment.id,
                  qr_code: payment.qr_code || payment.qr_code_base64,
                  qr_code_base64: payment.qr_code_base64
              };
              
              setCurrentPayment(formattedPayment);
              setPaymentModalVisible(true);
          } else {
              Alert.alert("Erro", "Não foi possível gerar o código Pix. Tente novamente.");
          }
      } catch (e) {
          Alert.alert("Erro", "Falha de conexão ao gerar pagamento.");
      } finally {
          setPaying(false);
      }
  };

  const handleAcceptAndPay = async (offer: any) => {
      Alert.alert("Confirmar e Pagar", `Valor: R$ ${offer.price}. Gerar Pix?`, [
          { text: "Cancelar" },
          { text: "Sim", onPress: async () => {
              setLoading(true);
              try {
                  // Aceita a oferta
                  await api.post('/requests/confirm-offer', {
                      order_id: activeOrder.id,
                      cook_id: offer.cook_id,
                      final_price: offer.price
                  });
                  
                  // Atualiza estado local para refletir "accepted" imediatamente
                  const updatedOrder = {...activeOrder, status: 'accepted', offer_price: offer.price, cook: offer.cook};
                  setActiveOrder(updatedOrder);
                  
                  // Inicia o fluxo de pagamento imediatamente
                  handlePayNow();
                  
              } catch {
                  Alert.alert("Erro", "Falha ao aceitar oferta.");
              } finally {
                  setLoading(false);
              }
          }}
      ]);
  };

  const handlePaymentSuccess = () => {
      setPaymentModalVisible(false);
      fetchData();
  };

  const renderContent = () => {
      if (!activeOrder) {
          return (
             <View style={styles.empty}>
                <Ionicons name="restaurant-outline" size={60} color="#DDD" />
                <Text style={{color:'#999', marginTop: 10, textAlign:'center'}}>
                    Você não tem pedidos ativos.{'\n'}Vá para o Início e solicite um chef!
                </Text>
                <TouchableOpacity onPress={fetchData} style={{marginTop:20, padding:10}}>
                    <Text style={{color:'#2196F3'}}>Atualizar Lista</Text>
                </TouchableOpacity>
             </View>
          );
      }

      // ESTADO: PENDENTE (Leilão)
      if (activeOrder.status === 'pending') {
          return (
            <View>
                <View style={styles.statusBanner}>
                    <ActivityIndicator color="#FFF" />
                    <Text style={styles.statusText}>Aguardando propostas dos chefs...</Text>
                </View>
                <Text style={styles.sectionTitle}>Candidatos ({offers.length})</Text>
                {offers.length === 0 ? (
                    <View style={styles.waitingBox}><Text style={{color:'#888'}}>Nenhum chef ofertou ainda.</Text></View>
                ) : (
                    offers.map((offer) => (
                        <View key={offer.id} style={styles.offerCard}>
                            <View style={styles.row}>
                                <View style={styles.avatarContainer}><Ionicons name="person" size={24} color="#FFF" /></View>
                                <View style={{flex:1}}>
                                    <Text style={styles.chefName}>{offer.cook?.name}</Text>
                                    <Text style={styles.ratingText}>R$ {offer.price}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptAndPay(offer)}>
                                <Text style={styles.acceptText}>ACEITAR E PAGAR</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>
          );
      }

      // ESTADO: ACEITO (Pagar) ou AGENDADO (Pago)
      const needsPayment = activeOrder.status === 'accepted';
      
      return (
        <View style={{flex: 1}}>
            <View style={[styles.statusBanner, {backgroundColor: needsPayment ? '#FFC107' : '#4CAF50'}]}>
                <Ionicons name={needsPayment ? "time" : "checkmark-circle"} size={24} color="#FFF" />
                <Text style={styles.statusText}>
                    {needsPayment ? 'Aguardando Pagamento' : 'Chef Confirmado'}
                </Text>
            </View>

            <View style={styles.activeCard}>
                <Image source={{uri: 'https://via.placeholder.com/150'}} style={styles.bigAvatar} />
                <Text style={styles.bigName}>{activeOrder.cook?.name}</Text>
                
                {needsPayment ? (
                    <View style={{width:'100%', alignItems:'center', marginTop:10}}>
                        <Text style={{color:'#D32F2F', fontWeight:'bold', marginBottom:15}}>Pagamento Pendente</Text>
                        
                        {/* BOTÃO ATUALIZADO */}
                        <TouchableOpacity 
                            style={styles.payNowBtn} 
                            onPress={handlePayNow} 
                            disabled={paying}
                        >
                            {paying ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.payNowText}>PAGAR AGORA (PIX)</Text>
                            )}
                        </TouchableOpacity>

                    </View>
                ) : (
                    <>
                        <Text style={styles.role}>Chef Profissional</Text>
                        <View style={styles.priceTag}><Text style={styles.priceTagText}>Pago: R$ {activeOrder.offer_price}</Text></View>
                        <TouchableOpacity style={styles.chatBtn} onPress={() => setIsChatOpen(true)}>
                            <Ionicons name="chatbubbles" size={24} color="#FFF" />
                            <Text style={styles.chatBtnText}>ABRIR CHAT</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <ChatModal visible={isChatOpen} onClose={() => setIsChatOpen(false)} orderId={activeOrder.id} partnerName={activeOrder.cook?.name} />
            
            {/* Modal de Pagamento */}
            {currentPayment && (
                <PaymentModal visible={paymentModalVisible} onClose={() => setPaymentModalVisible(false)} paymentData={currentPayment} orderId={activeOrder.id} onSuccess={handlePaymentSuccess} />
            )}
        </View>
      );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text style={styles.headerTitle}>Atividade</Text></View>
      <ScrollView 
        contentContainerStyle={{padding: 20, flexGrow: 1}}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  empty: { alignItems: 'center', marginTop: 80 },
  statusBanner: { flexDirection: 'row', backgroundColor: '#FF9800', padding: 15, borderRadius: 8, alignItems: 'center', gap: 10, marginBottom: 20 },
  statusText: { color: '#FFF', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  waitingBox: { padding: 20, alignItems: 'center', backgroundColor: '#EEE', borderRadius: 8 },
  offerCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#CCC', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  chefName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  ratingText: { fontSize: 14, color: '#4CAF50', fontWeight:'bold' },
  acceptBtn: { marginTop: 15, backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, alignItems: 'center' },
  acceptText: { color: '#FFF', fontWeight: 'bold' },
  activeCard: { backgroundColor: '#FFF', padding: 30, borderRadius: 20, alignItems: 'center', elevation: 4 },
  bigAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor:'#EEE', marginBottom: 15 },
  bigName: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  role: { color: '#666', marginBottom: 20 },
  priceTag: { backgroundColor: '#E8F5E9', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginBottom: 30 },
  priceTagText: { color: '#2E7D32', fontWeight: 'bold' },
  chatBtn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, width:'100%', justifyContent:'center' },
  chatBtnText: { color: '#FFF', fontWeight: 'bold' },
  payNowBtn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 12, width: '100%', alignItems: 'center' },
  payNowText: { color: '#FFF', fontWeight: 'bold' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth:1, borderColor:'#EEE' },
  msgBubble: { padding: 12, borderRadius: 16, marginBottom: 10, maxWidth: '80%' },
  msgMe: { backgroundColor: '#2196F3', alignSelf: 'flex-end' },
  msgOther: { backgroundColor: '#FFF', alignSelf: 'flex-start' },
  msgText: { fontSize: 16 },
  inputArea: { flexDirection: 'row', padding: 10, backgroundColor: '#F0F0F0', alignItems: 'center', borderTopWidth: 1, borderColor: '#DDD' },
  chatInput: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 10, marginRight: 10, borderWidth:1, borderColor:'#EEE' },
  sendBtn: { backgroundColor: '#2196F3', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  paymentCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, alignItems: 'center' },
  payHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  payTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  paySub: { textAlign: 'center', color: '#666', marginBottom: 20 },
  qrContainer: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE', borderRadius: 10, marginBottom: 20 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: '#E3F2FD', borderRadius: 8, marginBottom: 20 },
  copyText: { color: '#2196F3', fontWeight: 'bold' },
  payConfirmBtn: { backgroundColor: '#4CAF50', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 25, width: '100%', alignItems: 'center' },
  payConfirmText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});