import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl, StatusBar,
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
interface Order {
  id: number; client_id: number; cook_id?: number; dish_description: string;
  offer_price: string; status: 'pending' | 'accepted' | 'arrived' | 'cooking' | 'completed';
  client_name?: string; cook_name?: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();



  // --- 1. TODOS OS HOOKS DEVEM FICAR NO TOPO ---
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<any>(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [dish, setDish] = useState('');
  const [price, setPrice] = useState('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const [orders, setOrders] = useState<Order[]>([]); 
  const [myAcceptedOrders, setMyAcceptedOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Hook 1: Carregar Localização
  useEffect(() => {
    loadLocation();
  }, []);

  // Hook 2: Radar
  useEffect(() => {
    // Só executa o intervalo se o usuário existir
    if (!user) return; 

    let interval: any;
    if (user.type === 'client') {
      checkMyOrder(user.id);
      interval = setInterval(() => checkMyOrder(user.id), 3000);
    } else if (user.type === 'cook') {
      fetchCookData(); 
      interval = setInterval(fetchCookData, 5000);
    }
    return () => clearInterval(interval);
  }, [user]);

  // --- FUNÇÕES AUXILIARES ---
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
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja desconectar?", [
      { text: "Não", style: "cancel" },
      { text: "Sim", onPress: () => signOut() }
    ]);
  };

  const checkMyOrder = async (id: number) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/requests/my-active-order/${id}`);
      const data = await res.json();
      if (data && data.status === 'completed') setActiveOrder(null);
      else setActiveOrder(data && data.id ? data : null);
    } catch (e) { }
  };

  const handleRequest = async () => {
    if(!dish || !price || !user) return Alert.alert("Ops", "Preencha tudo");
    try {
      await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          client_id: user.id, dish, price, 
          latitude: region?.latitude||0, longitude: region?.longitude||0
        })
      });
      setModalVisible(false); setDish(''); setPrice(''); checkMyOrder(user.id);
      Alert.alert("Enviado!", "Aguarde um Chef.");
    } catch (e) { Alert.alert("Erro", "Falha na conexão"); }
  };

  const fetchCookData = async () => {
    if (!user) return;
    try {
      const resP = await fetch(`${API_URL}/requests`);
      const dataP = await resP.json();
      if (Array.isArray(dataP)) setOrders(dataP);

      const resA = await fetch(`${API_URL}/requests/accepted-by/${user.id}`);
      const dataA = await resA.json();
      if (Array.isArray(dataA)) setMyAcceptedOrders(dataA.filter((o:any)=>o.status!=='completed'));
    } catch (e) {}
  };

  const handleAccept = async (orderId: number) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/requests/accept`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ request_id: orderId, cook_id: user.id })
      });
      if(res.ok) { Alert.alert("Aceito!", "Vá até o cliente."); fetchCookData(); }
    } catch (e) { }
  };

  const changeStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/requests/update-status`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ request_id: orderId, new_status: newStatus })
      });
      if(res.ok) {
        if(newStatus === 'completed') Alert.alert("Parabéns!", "Pedido finalizado!");
        fetchCookData();
      }
    } catch (e) { Alert.alert("Erro", "Falha ao mudar status"); }
  };

  const renderProgressBar = (status: string) => {
    const steps = ['accepted', 'arrived', 'cooking'];
    const labels = ['A Caminho', 'Chegou', 'Cozinhando'];
    let currentIndex = steps.indexOf(status);
    if (status === 'completed') currentIndex = 3;

    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={step} style={styles.stepWrapper}>
            <View style={[styles.stepCircle, index <= currentIndex ? styles.stepActive : styles.stepInactive]}><Ionicons name={index <= currentIndex ? "checkmark" : "ellipse"} size={12} color="#FFF" /></View>
            <Text style={styles.stepLabel}>{labels[index]}</Text>
          </View>
        ))}
      </View>
    );
  };

  // --- 2. RETORNO ANTECIPADO (AGORA NO LUGAR CERTO) ---
  // Só pode acontecer depois de TODOS os hooks acima.
  
  if (loading) return <ActivityIndicator size="large" color="#FF6F00" style={{flex:1}} />;

  // Se user for nulo (logout), mostra tela em branco e espera o _layout redirecionar
  if (!user) {
    return <View style={{flex:1, backgroundColor:'#FFF'}} />;
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================
  if (user.type === 'cook') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/account')}>
            <Text style={styles.title}>Painel do Chef</Text>
            <Text style={styles.subtitle}>{user.name} • Online</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
             <Ionicons name="log-out-outline" size={28} color="red" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={orders} 
          keyExtractor={item => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchCookData} />}
          ListHeaderComponent={
            <View>
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
                         <TouchableOpacity style={styles.btnChatSmall} onPress={() => router.push({ pathname: '/chat', params: { orderId: order.id } })}>
                            <Ionicons name="chatbubbles" size={20} color="#FFF"/>
                         </TouchableOpacity>
                         {order.status === 'accepted' && <TouchableOpacity style={styles.btnStatus} onPress={() => changeStatus(order.id, 'arrived')}><Text style={styles.btnText}>📍 Informar Chegada</Text></TouchableOpacity>}
                         {order.status === 'arrived' && <TouchableOpacity style={[styles.btnStatus, {backgroundColor:'#9C27B0'}]} onPress={() => changeStatus(order.id, 'cooking')}><Text style={styles.btnText}>🍳 Iniciar Preparo</Text></TouchableOpacity>}
                         {order.status === 'cooking' && <TouchableOpacity style={[styles.btnStatus, {backgroundColor:'#4CAF50'}]} onPress={() => changeStatus(order.id, 'completed')}><Text style={styles.btnText}>✅ Finalizar Serviço</Text></TouchableOpacity>}
                       </View>
                    </View>
                  ))}
                </View>
              )}
              <Text style={[styles.sectionTitle, {marginLeft:15, marginTop:10}]}>🔔 Solicitações</Text>
            </View>
          }
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma solicitação.</Text>}
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

  // CLIENTE
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {region && <MyMap region={region} />}
      <View style={styles.panel}>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/account')}>
            <Text style={styles.greeting}>Olá, {user.name}!</Text>
            <Text style={styles.debug}>"Chefs na sua casa"</Text> 
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="red" />
          </TouchableOpacity>
        </View>

        {activeOrder ? (
          <View style={styles.orderCard}>
            {activeOrder.status === 'pending' ? (
              <View style={styles.statusRow}>
                <ActivityIndicator color="#FF6F00" />
                <Text style={{color:'#FF6F00', fontWeight:'bold', marginLeft: 10}}> Buscando Chef...</Text>
              </View>
            ) : (
              <View>
                <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:10}}>
                   <Text style={{fontWeight:'bold', fontSize:16}}>Chef {activeOrder.cook_name}</Text>
                   <Text style={{color:'green', fontWeight:'bold'}}>R$ {activeOrder.offer_price}</Text>
                </View>
                {renderProgressBar(activeOrder.status)}
                <Text style={{textAlign:'center', marginVertical:10, color:'#555'}}>
                    {activeOrder.status === 'accepted' && "O Chef está a caminho."}
                    {activeOrder.status === 'arrived' && "O Chef chegou!"}
                    {activeOrder.status === 'cooking' && "O Chef está cozinhando."}
                </Text>
                <TouchableOpacity style={styles.btnChat} onPress={() => router.push({ pathname: '/chat', params: { orderId: activeOrder.id } })}>
                  <Ionicons name="chatbubbles" size={20} color="#FFF" style={{marginRight:5}} />
                  <Text style={styles.btnText}>Chat</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity style={styles.btnSearch} onPress={() => setModalVisible(true)}>
             <Ionicons name="restaurant" size={20} color="#FF6F00" />
             <View style={{marginLeft:10}}>
                <Text style={{fontWeight:'bold', color:'#333'}}>Solicitar um Chef</Text>
                <Text style={{fontSize:10, color:'#666'}}>Você escolhe o prato, o chef vai até você.</Text>
             </View>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Pedido</Text>
            <TextInput style={styles.input} placeholder="O que vai comer?" value={dish} onChangeText={setDish} />
            <TextInput style={styles.input} placeholder="Valor (R$)" keyboardType="numeric" value={price} onChangeText={setPrice} />
            <TouchableOpacity style={styles.btnConfirm} onPress={handleRequest}>
              <Text style={styles.btnText}>Solicitar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{marginTop:15, alignItems:'center'}}>
              <Text style={{color:'red'}}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { padding: 20, paddingTop: 40, flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'#FFF' },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#666' },
  debug: { fontSize:12, color:'#FF6F00', fontStyle:'italic' },
  empty: { textAlign:'center', marginTop:50, color:'#999' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight:'bold', color:'#333', marginLeft: 15, marginBottom: 5 },
  card: { backgroundColor:'#FFF', marginHorizontal:15, marginBottom:15, padding:15, borderRadius:10, elevation:3, shadowOpacity:0.1, borderWidth:1, borderColor:'#EEE' },
  cardActive: { borderColor: '#FF6F00', backgroundColor: '#FFF8E1' },
  cardTitle: { fontSize:18, fontWeight:'bold', color:'#333' },
  cardSub: { color:'#666', marginVertical:5 },
  cardPrice: { fontSize:16, fontWeight:'bold', color:'green' },
  panel: { position:'absolute', top:50, left:20, right:20, backgroundColor:'rgba(255,255,255,0.95)', padding:20, borderRadius:15, elevation:5 },
  row: { flexDirection:'row', justifyContent:'space-between', marginBottom:15 },
  greeting: { fontSize:18, fontWeight:'bold' },
  orderCard: { backgroundColor:'#F9F9F9', padding:15, borderRadius:10 },
  statusRow: { flexDirection:'row', alignItems:'center', marginBottom:10 },
  btnAccept: { backgroundColor:'#FF6F00', padding:10, borderRadius:5, marginTop:10, alignItems:'center' },
  btnChat: { backgroundColor:'#2196F3', padding:12, borderRadius:8, flexDirection:'row', justifyContent:'center', alignItems:'center', marginTop: 15 },
  btnChatSmall: { backgroundColor:'#2196F3', padding:10, borderRadius:8, justifyContent:'center', alignItems:'center', marginRight: 10 },
  btnStatus: { flex: 1, backgroundColor:'#FF6F00', padding:10, borderRadius:8, justifyContent:'center', alignItems:'center' },
  actionRow: { flexDirection: 'row', marginTop: 15 },
  btnSearch: { backgroundColor:'#EEE', padding:15, borderRadius:10, flexDirection:'row', alignItems:'center' },
  btnConfirm: { backgroundColor:'#FF6F00', padding:15, borderRadius:10, alignItems:'center', marginTop:20 },
  btnText: { color:'#FFF', fontWeight:'bold' },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalContent: { backgroundColor:'#FFF', padding:20, borderTopLeftRadius:20, borderTopRightRadius:20 },
  modalTitle: { fontSize:20, fontWeight:'bold', marginBottom:5 },
  input: { backgroundColor:'#F0F0F0', padding:12, borderRadius:8, marginBottom:10 },
  label: { fontWeight: 'bold', color:'#333', marginBottom:5, marginTop:5 },
  progressContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 5 },
  stepWrapper: { alignItems: 'center' },
  stepCircle: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  stepActive: { backgroundColor: '#4CAF50' },
  stepInactive: { backgroundColor: '#DDD' },
  stepLabel: { fontSize: 10, color: '#666' }
});