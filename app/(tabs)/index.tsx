import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MyMap from '../../src/components/MyMap';
import { API_URL } from '../../src/constants/Config';
import { useAuth } from '../../src/contexts/AuthContext';

// Tipagem rigorosa para evitar erros
interface Order {
  id: number; 
  client_id: number; 
  cook_id?: number; 
  dish_description: string;
  offer_price: string; 
  status: 'pending' | 'accepted' | 'arrived' | 'cooking' | 'completed';
  client_name?: string; 
  cook_name?: string;
  created_at?: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  // --- ESTADOS GERAIS ---
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // --- ESTADOS DO CLIENTE ---
  const [modalVisible, setModalVisible] = useState(false);
  const [dish, setDish] = useState('');
  const [price, setPrice] = useState('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // --- ESTADOS DO CHEF ---
  const [orders, setOrders] = useState<Order[]>([]); // Pedidos disponíveis na região
  const [myAcceptedOrders, setMyAcceptedOrders] = useState<Order[]>([]); // Pedidos que eu aceitei

  // 1. Carregar Localização
  const loadLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.005, longitudeDelta: 0.005,
        });
      }
    } catch (error) {
      console.log("Erro ao obter localização:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. (CLIENTE) Verificar meu pedido ativo
  const checkMyOrder = async (id: number) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/requests/my-active-order/${id}`);
      const data = await res.json();
      
      if (data && data.id && data.status !== 'completed') {
        setActiveOrder(data);
      } else {
        setActiveOrder(null);
      }
    } catch { /* Erro silencioso (polling) */ }
  };

  // 3. (CHEF) Buscar dados do painel
  const fetchCookData = useCallback(async () => {
    if (!user) return;
    setRefreshing(true); 
    try {
      // A. Buscar pedidos disponíveis (Status 'pending')
      const resP = await fetch(`${API_URL}/requests`);
      const dataP = await resP.json();
      if (Array.isArray(dataP)) setOrders(dataP);

      // B. Buscar pedidos que EU aceitei
      const resA = await fetch(`${API_URL}/requests/accepted-by/${user.id}`);
      const dataA = await resA.json();
      if (Array.isArray(dataA)) {
        setMyAcceptedOrders(dataA.filter((o: any) => o.status !== 'completed'));
      }
    } catch (error) {
      console.log("Erro ao atualizar dados do chef:", error);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  // --- CYCLES E RADAR ---
  
  useEffect(() => {
    loadLocation();
  }, []);

  useEffect(() => {
    if (!user) return; 

    let interval: any;
    
    // Se for Cliente, busca status do pedido a cada 4s
    if (user.type === 'client') {
      checkMyOrder(user.id); 
      interval = setInterval(() => checkMyOrder(user.id), 4000);
    } 
    // Se for Chef, busca novos pedidos a cada 6s
    else if (user.type === 'cook') {
      fetchCookData(); 
      interval = setInterval(fetchCookData, 6000);
    }
    
    return () => clearInterval(interval);
  }, [user, fetchCookData]);

  // --- AÇÕES DO USUÁRIO ---

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja desconectar?", [
      { text: "Não", style: "cancel" },
      { text: "Sim", onPress: () => signOut() }
    ]);
  };

  // (CLIENTE) Criar Pedido
  const handleRequest = async () => {
    if(!dish || !price || !user) return Alert.alert("Ops", "Preencha o prato e o valor.");
    
    try {
      await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          client_id: user.id, 
          dish, 
          price, 
          latitude: region?.latitude || 0, 
          longitude: region?.longitude || 0
        })
      });
      setModalVisible(false); 
      setDish(''); 
      setPrice(''); 
      checkMyOrder(user.id);
      Alert.alert("Pedido Enviado!", "Aguarde, estamos buscando um Chef próximo.");
    } catch { 
      Alert.alert("Erro", "Falha ao enviar pedido. Verifique sua internet."); 
    }
  };

  // (CHEF) Aceitar Pedido
  const handleAccept = async (orderId: number) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/requests/accept`, {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ request_id: orderId, cook_id: user.id })
      });
      
      if(res.ok) { 
        Alert.alert("Pedido Aceito! 👨‍🍳", "Vá até o local do cliente."); 
        fetchCookData(); 
      } else {
        Alert.alert("Atenção", "Este pedido já foi pego por outro chef.");
        fetchCookData();
      }
    } catch { 
      Alert.alert("Erro", "Falha ao aceitar pedido.");
    }
  };

  // (CHEF) Mudar Status (Chegou, Cozinhando, Finalizou)
  const changeStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/requests/update-status`, {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ request_id: orderId, new_status: newStatus })
      });
      
      if(res.ok) {
        if(newStatus === 'completed') Alert.alert("Parabéns! 🎉", "Serviço finalizado com sucesso!");
        fetchCookData();
      }
    } catch { 
      Alert.alert("Erro", "Falha ao atualizar status."); 
    }
  };

  // --- RENDERIZAÇÃO VISUAL ---

  const renderProgressBar = (status: string) => {
    const steps = ['accepted', 'arrived', 'cooking'];
    const labels = ['A Caminho', 'Chegou', 'Cozinhando'];
    let currentIndex = steps.indexOf(status);
    if (status === 'completed') currentIndex = 3;

    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={step} style={styles.stepWrapper}>
            <View style={[styles.stepCircle, index <= currentIndex ? styles.stepActive : styles.stepInactive]}>
              <Ionicons name={index <= currentIndex ? "checkmark" : "ellipse"} size={12} color="#FFF" />
            </View>
            <Text style={styles.stepLabel}>{labels[index]}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" color="#FF6F00" style={{flex:1}} />;
  if (!user) return <View style={{flex:1, backgroundColor:'#FFF'}} />;

  // ==========================================
  // VIEW DO CHEF 👨‍🍳
  // ==========================================
  if (user.type === 'cook') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/account')}>
            <Text style={styles.title}>Painel do Chef</Text>
            <Text style={styles.subtitle}>{user.name} • Online 🟢</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
             <Ionicons name="log-out-outline" size={28} color="red" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={orders} 
          keyExtractor={item => item.id.toString()} 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchCookData} colors={['#FF6F00']} />}
          ListHeaderComponent={
            <View>
              {/* MEUS SERVIÇOS ATIVOS */}
              {myAcceptedOrders.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🔥 Serviço Atual</Text>
                  {myAcceptedOrders.map(order => (
                    <View key={order.id} style={[styles.card, styles.cardActive]}>
                       <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                          <Text style={styles.cardTitle}>{order.dish_description}</Text>
                          <Text style={{fontWeight:'bold', color:'green'}}>R$ {order.offer_price}</Text>
                       </View>
                       <Text style={styles.cardSub}>Cliente: {order.client_name}</Text>
                       
                       {renderProgressBar(order.status)}
                       
                       <View style={styles.actionRow}>
                         <TouchableOpacity 
                            style={styles.btnChatSmall} 
                            onPress={() => router.push({ pathname: '/chat', params: { orderId: order.id } })}
                         >
                            <Ionicons name="chatbubbles" size={20} color="#FFF"/>
                         </TouchableOpacity>

                         {order.status === 'accepted' && (
                           <TouchableOpacity style={styles.btnStatus} onPress={() => changeStatus(order.id, 'arrived')}>
                             <Text style={styles.btnText}>📍 Informar Chegada</Text>
                           </TouchableOpacity>
                         )}
                         {order.status === 'arrived' && (
                           <TouchableOpacity style={[styles.btnStatus, {backgroundColor:'#9C27B0'}]} onPress={() => changeStatus(order.id, 'cooking')}>
                             <Text style={styles.btnText}>🍳 Iniciar Preparo</Text>
                           </TouchableOpacity>
                         )}
                         {order.status === 'cooking' && (
                           <TouchableOpacity style={[styles.btnStatus, {backgroundColor:'#4CAF50'}]} onPress={() => changeStatus(order.id, 'completed')}>
                             <Text style={styles.btnText}>✅ Finalizar Serviço</Text>
                           </TouchableOpacity>
                         )}
                       </View>
                    </View>
                  ))}
                </View>
              )}
              <Text style={[styles.sectionTitle, {marginLeft:15, marginTop:10}]}>🔔 Pedidos Disponíveis</Text>
            </View>
          }
          ListEmptyComponent={<Text style={styles.empty}>Nenhum pedido na região agora.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.dish_description}</Text>
              <Text style={styles.cardSub}>Cliente: {item.client_name}</Text>
              <Text style={styles.cardPrice}>Oferta: R$ {item.offer_price}</Text>
              <TouchableOpacity style={styles.btnAccept} onPress={() => handleAccept(item.id)}>
                <Text style={styles.btnText}>Aceitar e Ir</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  // ==========================================
  // VIEW DO CLIENTE 🧑‍💼
  // ==========================================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Mapa */}
      {region && <MyMap region={region} />}
      
      {/* Painel Flutuante */}
      <View style={styles.panel}>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/account')}>
            <Text style={styles.greeting}>Olá, {user.name}!</Text>
            <Text style={styles.debug}>Alta gastronomia em casa</Text> 
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="red" />
          </TouchableOpacity>
        </View>

        {activeOrder ? (
          // MOSTRA SE TIVER PEDIDO
          <View style={styles.activeOrderContainer}>
            {activeOrder.status === 'pending' ? (
              <View style={styles.statusRow}>
                <ActivityIndicator color="#FF6F00" />
                <Text style={{color:'#FF6F00', fontWeight:'bold', marginLeft: 10}}> Procurando Chef...</Text>
              </View>
            ) : (
              <View>
                <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:10}}>
                   <Text style={{fontWeight:'bold', fontSize:16}}>Chef {activeOrder.cook_name}</Text>
                   <Text style={{color:'green', fontWeight:'bold'}}>R$ {activeOrder.offer_price}</Text>
                </View>
                
                {renderProgressBar(activeOrder.status)}
                
                <Text style={{textAlign:'center', marginVertical:10, color:'#555'}}>
                    {activeOrder.status === 'accepted' && "O Chef aceitou e está a caminho!"}
                    {activeOrder.status === 'arrived' && "O Chef chegou na sua casa."}
                    {activeOrder.status === 'cooking' && "O Chef está preparando seu prato."}
                </Text>
                
                <TouchableOpacity 
                  style={styles.btnChat} 
                  onPress={() => router.push({ pathname: '/chat', params: { orderId: activeOrder.id } })}
                >
                  <Ionicons name="chatbubbles" size={20} color="#FFF" style={{marginRight:5}} />
                  <Text style={styles.btnText}>Conversar com Chef</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          // BOTÃO DE PEDIR (SE NÃO TIVER NADA ATIVO)
          <TouchableOpacity style={styles.btnSearch} onPress={() => setModalVisible(true)}>
             <View style={styles.iconCircle}>
                <Ionicons name="restaurant" size={24} color="#FFF" />
             </View>
             <View style={{marginLeft:15, flex:1}}>
                <Text style={{fontWeight:'bold', fontSize:16, color:'#333'}}>Solicitar um Chef</Text>
                <Text style={{fontSize:12, color:'#666'}}>Escolha o prato e o valor.</Text>
             </View>
             <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        )}
      </View>

      {/* MODAL (FORMULÁRIO DE PEDIDO) */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Novo Pedido</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}>
                 <Ionicons name="close" size={24} color="#999" />
               </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>O que você deseja comer?</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Risoto de Funghi, Churrasco..." 
              value={dish} 
              onChangeText={setDish} 
            />
            
            <Text style={styles.label}>Quanto pretende pagar? (R$)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: 150.00" 
              keyboardType="numeric" 
              value={price} 
              onChangeText={setPrice} 
            />
            
            <TouchableOpacity style={styles.btnConfirm} onPress={handleRequest}>
              <Text style={styles.btnText}>Solicitar Chef</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { padding: 20, paddingTop: 40, flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'#FFF', borderBottomWidth:1, borderColor:'#EEE' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { color: '#666', fontSize: 14 },
  
  debug: { fontSize:12, color:'#FF6F00', fontStyle:'italic' },
  empty: { textAlign:'center', marginTop:50, color:'#999' },
  
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight:'bold', color:'#333', marginLeft: 15, marginBottom: 10 },
  
  // Card Styles
  card: { backgroundColor:'#FFF', marginHorizontal:15, marginBottom:15, padding:15, borderRadius:12, elevation:3, shadowColor:'#000', shadowOffset:{width:0, height:2}, shadowOpacity:0.1, borderWidth:1, borderColor:'#EEE' },
  cardActive: { borderColor: '#FF6F00', backgroundColor: '#FFF8E1' },
  cardTitle: { fontSize:18, fontWeight:'bold', color:'#333' },
  cardSub: { color:'#666', marginVertical:5 },
  cardPrice: { fontSize:16, fontWeight:'bold', color:'green' },
  
  // Painel Flutuante (Cliente)
  panel: { position:'absolute', top:60, left:20, right:20, backgroundColor:'rgba(255,255,255,0.95)', padding:20, borderRadius:20, elevation:10, shadowColor:'#000', shadowOpacity:0.2, shadowRadius:10 },
  row: { flexDirection:'row', justifyContent:'space-between', marginBottom:15 },
  greeting: { fontSize:20, fontWeight:'bold', color:'#333' },
  
  // Pedido Ativo Container
  activeOrderContainer: { backgroundColor:'#F9FAFB', padding:15, borderRadius:15, borderWidth:1, borderColor:'#EEE' }, 
  statusRow: { flexDirection:'row', alignItems:'center', marginBottom:10 },
  
  // Botões
  btnAccept: { backgroundColor:'#FF6F00', padding:12, borderRadius:8, marginTop:10, alignItems:'center' },
  btnChat: { backgroundColor:'#2196F3', padding:12, borderRadius:10, flexDirection:'row', justifyContent:'center', alignItems:'center', marginTop: 15 },
  btnChatSmall: { backgroundColor:'#2196F3', padding:10, borderRadius:8, justifyContent:'center', alignItems:'center', marginRight: 10 },
  btnStatus: { flex: 1, backgroundColor:'#FF6F00', padding:10, borderRadius:8, justifyContent:'center', alignItems:'center' },
  actionRow: { flexDirection: 'row', marginTop: 15 },
  
  // Busca
  btnSearch: { backgroundColor:'#FFF', padding:15, borderRadius:15, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:'#EEE', elevation:2 },
  iconCircle: { width:40, height:40, borderRadius:20, backgroundColor:'#FF6F00', alignItems:'center', justifyContent:'center' },
  
  // Modal
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalContent: { backgroundColor:'#FFF', padding:25, borderTopLeftRadius:25, borderTopRightRadius:25 },
  modalHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  modalTitle: { fontSize:22, fontWeight:'bold', color:'#333' },
  input: { backgroundColor:'#F5F5F5', padding:15, borderRadius:12, marginBottom:15, fontSize:16 },
  label: { fontWeight: 'bold', color:'#333', marginBottom:8, fontSize:14 },
  btnConfirm: { backgroundColor:'#FF6F00', padding:18, borderRadius:12, alignItems:'center', marginTop:10 },
  btnText: { color:'#FFF', fontWeight:'bold', fontSize:16 },
  
  // Barra de Progresso
  progressContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, marginBottom: 5 },
  stepWrapper: { alignItems: 'center' },
  stepCircle: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  stepActive: { backgroundColor: '#4CAF50' },
  stepInactive: { backgroundColor: '#E0E0E0' },
  stepLabel: { fontSize: 10, color: '#666', fontWeight:'600' }
});