import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/services/api';

const ChatInterface = ({ orderId, partnerName, onClose }: any) => {
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
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

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
        } catch {
            Alert.alert("Erro", "Erro ao enviar.");
        }
    };

    return (
        <SafeAreaView style={{flex:1, backgroundColor:'#F5F5F5'}} edges={['top', 'bottom']}>
            <KeyboardAvoidingView 
                style={{flex: 1}} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.chatHeader}>
                    <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                        <Ionicons name="chevron-down" size={30} color="#333" />
                    </TouchableOpacity>
                    <View style={{flex:1, alignItems:'center', marginRight: 30}}>
                        <Text style={styles.chatTitle}>{partnerName}</Text>
                        <Text style={styles.chatSub}>Chat com Cliente</Text>
                    </View>
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
                                <Text style={[styles.msgTime, isMe && {color:'#EEE'}]}>
                                    {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </Text>
                            </View>
                        );
                    }}
                />

                {/* CORREÇÃO: Input de Alto Contraste */}
                <View style={styles.inputArea}>
                    <TextInput 
                        style={styles.chatInput} 
                        placeholder="Escreva para o cliente..."
                        placeholderTextColor="#666"
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleSend}
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                        <Ionicons name="send" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    if (!lat1 || !lat2) return 0;
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*(Math.PI/180)) * Math.cos(lat2*(Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return parseFloat((R * c).toFixed(1));
}

export default function ChefRadarScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'radar' | 'missions'>('radar');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<any>(null);

  const [openRequests, setOpenRequests] = useState<any[]>([]);
  const [myMissions, setMyMissions] = useState<any[]>([]);

  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [missionModalVisible, setMissionModalVisible] = useState(false);
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [bidPrice, setBidPrice] = useState('');

  useEffect(() => {
    (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc.coords);
        }
    })();
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const open = await api.get('/requests/open');
      setOpenRequests(open);

      if (user?.id) {
         const allMyRequests = await api.get(`/my-requests/${user.id}`);
         const mine = allMyRequests.filter((o: any) => o.cook_id === user.id);
         setMyMissions(mine);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const openBidModal = (request: any) => {
      setSelectedRequest(request);
      setBidPrice(request.offer_price.toString());
      setBidModalVisible(true);
  };

  const openMissionDetails = (mission: any) => {
      setSelectedRequest(mission);
      setMissionModalVisible(true);
  };

  const handleSendBid = async () => {
      if (!selectedRequest || !bidPrice) return;
      setLoading(true);
      try {
          await api.post('/requests/make-offer', {
              order_id: selectedRequest.id,
              cook_id: user?.id,
              price: parseFloat(bidPrice.replace(',', '.'))
          });
          setBidModalVisible(false);
          Alert.alert("Proposta Enviada!", "Aguarde a resposta do cliente.");
          fetchOrders();
      } catch {
          Alert.alert("Erro", "Não foi possível enviar.");
      } finally {
          setLoading(false);
      }
  };

  const renderRadarCard = ({ item }: { item: any }) => {
      const dist = location ? calculateDistance(location.latitude, location.longitude, item.latitude, item.longitude) : 0;
      return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.badge}><Text style={styles.badgeText}>NOVA OPORTUNIDADE</Text></View>
                <Text style={styles.distance}>{dist} km daqui</Text>
            </View>
            <View style={styles.row}>
                <View style={styles.avatarContainer}><Ionicons name="person" size={20} color="#FFF" /></View>
                <View style={{flex:1}}>
                    <Text style={styles.clientName}>{item.client?.name || 'Cliente'}</Text>
                    <Text style={styles.requestDesc}>{item.dish_description}</Text>
                    <Text style={styles.peopleCount}>Para {item.people_count || 4} pessoas</Text>
                </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.footer}>
                <View><Text style={styles.offerLabel}>Oferta</Text><Text style={styles.offerValue}>R$ {item.offer_price}</Text></View>
                <TouchableOpacity style={styles.btnBid} onPress={() => openBidModal(item)}>
                    <Text style={styles.btnBidText}>NEGOCIAR</Text>
                </TouchableOpacity>
            </View>
        </View>
      );
  };

  const renderMissionCard = ({ item }: { item: any }) => (
    <View style={[styles.card, { borderLeftWidth: 5, borderLeftColor: '#4CAF50' }]}>
        <View style={styles.cardHeader}>
            <Text style={[styles.badgeText, {color: '#4CAF50', fontWeight:'bold'}]}>AGENDADO</Text>
            <Text style={styles.offerValue}>R$ {item.offer_price}</Text>
        </View>
        <Text style={styles.requestDesc}>{item.dish_description}</Text>
        <Text style={styles.clientName}>Cliente: {item.client?.name}</Text>
        
        <TouchableOpacity style={styles.btnAction} onPress={() => openMissionDetails(item)}>
            <Text style={styles.btnActionText}>ABRIR DETALHES & CHAT</Text>
        </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
          <Text style={styles.headerTitle}>Central de Missões</Text>
          <View style={styles.toggleContainer}>
              <TouchableOpacity style={[styles.toggleBtn, activeTab==='radar' && styles.toggleActive]} onPress={() => setActiveTab('radar')}>
                  <Text style={[styles.toggleText, activeTab==='radar' && styles.toggleTextActive]}>Radar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, activeTab==='missions' && styles.toggleActive]} onPress={() => setActiveTab('missions')}>
                  <Text style={[styles.toggleText, activeTab==='missions' && styles.toggleTextActive]}>Minhas Missões</Text>
              </TouchableOpacity>
          </View>
      </View>

      <FlatList
        contentContainerStyle={{padding: 20, paddingBottom: 100}}
        data={activeTab === 'radar' ? openRequests : myMissions}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchOrders();}} />}
        renderItem={activeTab === 'radar' ? renderRadarCard : renderMissionCard}
        ListEmptyComponent={<View style={styles.empty}><Text>Nada por aqui.</Text></View>}
      />

      <Modal visible={bidModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Fazer Proposta</Text>
                    <TouchableOpacity onPress={() => setBidModalVisible(false)}><Ionicons name="close" size={24} color="#999" /></TouchableOpacity>
                </View>
                <Text style={styles.modalSub}>Cliente oferece R$ {selectedRequest?.offer_price}. Sua contra-proposta:</Text>
                <View style={styles.inputContainer}>
                    <Text style={styles.currency}>R$</Text>
                    <TextInput style={styles.priceInput} value={bidPrice} onChangeText={setBidPrice} keyboardType="numeric" autoFocus />
                </View>
                <TouchableOpacity style={styles.btnSendBid} onPress={handleSendBid}><Text style={styles.btnSendBidText}>ENVIAR</Text></TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={missionModalVisible} animationType="slide" presentationStyle="pageSheet">
         {selectedRequest && (
             <ChatInterface 
                orderId={selectedRequest.id} 
                partnerName={selectedRequest.client?.name || 'Cliente'} 
                onClose={() => setMissionModalVisible(false)} 
             />
         )}
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { backgroundColor: '#FFF', padding: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#D32F2F', marginBottom: 15 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 8, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  toggleActive: { backgroundColor: '#FFF', elevation: 2 },
  toggleText: { fontWeight: '600', color: '#999' },
  toggleTextActive: { color: '#D32F2F' },
  empty: { alignItems: 'center', marginTop: 80 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 15, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  badge: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#2196F3' },
  distance: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#CCC', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  clientName: { fontSize: 14, color: '#666' },
  requestDesc: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  peopleCount: { fontSize: 12, color: '#999', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  offerLabel: { fontSize: 10, color: '#999', textTransform: 'uppercase' },
  offerValue: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },
  btnBid: { backgroundColor: '#D32F2F', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  btnBidText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  btnAction: { marginTop: 10, backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnActionText: { fontSize: 12, fontWeight: 'bold', color: '#2E7D32' },
  
  // MODAL LANCE
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalSub: { marginVertical: 15, color: '#666' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#DDD', marginBottom: 20 },
  currency: { fontSize: 24, fontWeight: 'bold', color: '#333', marginRight: 10 },
  priceInput: { flex: 1, fontSize: 32, fontWeight: 'bold', color: '#333', paddingVertical: 10 },
  btnSendBid: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnSendBidText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // CHAT STYLES CORRIGIDOS
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFF', borderBottomWidth:1, borderColor:'#EEE' },
  backBtn: { padding: 5, marginRight: 10 },
  chatTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  chatSub: { fontSize: 12, color: '#666' },
  msgBubble: { padding: 12, borderRadius: 16, marginBottom: 10, maxWidth: '80%' },
  msgMe: { backgroundColor: '#2196F3', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  msgOther: { backgroundColor: '#FFF', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  msgText: { fontSize: 16, color: '#333' },
  msgTime: { fontSize: 10, color: '#999', alignSelf: 'flex-end', marginTop: 4 },
  
  // ÁREA DE INPUT DE ALTO CONTRASTE
  inputArea: { 
      flexDirection: 'row', 
      padding: 10, 
      backgroundColor: '#F0F0F0', 
      alignItems: 'center', 
      borderTopWidth: 1, 
      borderColor: '#DDD' 
  },
  chatInput: { 
      flex: 1, 
      backgroundColor: '#FFFFFF', 
      borderRadius: 20, 
      paddingHorizontal: 15, 
      paddingVertical: 10, 
      marginRight: 10, 
      minHeight: 40,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      color: '#000'
  },
  sendBtn: { backgroundColor: '#2196F3', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }
});