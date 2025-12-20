import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '../src/contexts/AuthContext';
import { api } from '../src/services/api';

const { width, height } = Dimensions.get('window');

// --- TIPAGEM ---
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

interface Chef {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  gender?: string;
  is_premium?: boolean;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [chefs, setChefs] = useState<Chef[]>([]);

  // Estados de Pedidos (Cliente)
  const [modalVisible, setModalVisible] = useState(false);
  const [dish, setDish] = useState('');
  const [price, setPrice] = useState('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Estados do Painel (Chef)
  const [orders, setOrders] = useState<Order[]>([]);
  const [myAcceptedOrders, setMyAcceptedOrders] = useState<Order[]>([]);

  // --- BUSCA DE DADOS ---
  const fetchChefs = useCallback(async () => {
    try {
        const res = await api.get('/chefs');
        if(Array.isArray(res)) setChefs(res);
    } catch {
        // Silencioso em produção
    }
  }, []);

  const loadLocationAndData = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        });

        if (user) {
            // Atualiza posição no backend
            api.post('/users/location', {
                id: user.id,
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
            }).catch(() => {});
        }
      }
      fetchChefs();
    } catch (error) {
      console.log("Erro gps", error);
    } finally {
      setLoading(false);
    }
  }, [user, fetchChefs]);

  const checkMyOrder = async (id: number) => {
    if (!id) return;
    try {
      const res = await api.get(`/requests/my-active-order/${id}`);
      if (res && res.id && res.status !== 'completed') {
        setActiveOrder(res);
      } else {
        setActiveOrder(null);
      }
    } catch { }
  };

  const fetchCookData = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const resP = await api.get('/requests');
      const dataP = Array.isArray(resP) ? resP : [];
      setOrders(dataP);

      const resA = await api.get(`/requests/accepted-by/${user.id}`);
      const dataA = Array.isArray(resA) ? resA : [];
      if (dataA.length > 0) {
        setMyAcceptedOrders(dataA.filter((o: any) => o.status !== 'completed'));
      }
    } catch (error) {
      console.log("Erro chef", error);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  // --- EFEITOS ---
  useEffect(() => {
    loadLocationAndData();
  }, [loadLocationAndData]);

  useEffect(() => {
    if (!user) return;
    const runUpdates = () => {
        if (user.type === 'client') {
            checkMyOrder(user.id);
            fetchChefs();
        } else if (user.type === 'cook') {
            fetchCookData();
        }
    };
    runUpdates();
    const interval = setInterval(runUpdates, 6000);
    return () => clearInterval(interval);
  }, [user, fetchCookData, fetchChefs]);

  // --- AÇÕES ---
  const handleRequest = () => {
    if(!dish || !price || !user) return Alert.alert("Ops", "Preencha tudo.");
    setModalVisible(false);
    router.push({
      pathname: '/payment',
      params: {
        dish,
        price,
        client_id: user.id,
        latitude: region?.latitude || 0,
        longitude: region?.longitude || 0
      }
    });
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja desconectar?", [
      { text: "Não", style: "cancel" },
      { text: "Sim", onPress: () => signOut() }
    ]);
  };

  const handleAccept = async (orderId: number) => {
    if (!user) return;
    try {
      await api.post('/requests/accept', { request_id: orderId, cook_id: user.id });
      Alert.alert("Sucesso", "Pedido Aceito!");
      fetchCookData();
    } catch { Alert.alert("Erro", "Falha ao aceitar."); }
  };

  const changeStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.post('/requests/update-status', { request_id: orderId, new_status: newStatus });
      fetchCookData();
    } catch { Alert.alert("Erro", "Falha ao atualizar."); }
  };

  // --- RENDERIZADORES ---
  const renderChefMarker = (chef: Chef) => {
    let color = '#2196F3'; 
    if (chef.gender === 'female') color = '#E91E63'; 
    if (chef.is_premium) color = '#FFD700'; 
    let iconName: any = chef.is_premium ? 'star' : 'restaurant';

    return (
      <Marker
        key={chef.id}
        coordinate={{ latitude: Number(chef.latitude), longitude: Number(chef.longitude) }}
        title={chef.name}
        description={chef.is_premium ? "⭐ Chef Premium" : "Cozinheiro(a)"}
      >
        <View style={[styles.markerContainer, { borderColor: color }]}>
           <View style={[styles.markerInner, { backgroundColor: color }]}>
              <Ionicons name={iconName} size={16} color="#FFF" />
           </View>
           <View style={[styles.markerArrow, { borderTopColor: color }]} />
        </View>
      </Marker>
    );
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

  // === CHEF ===
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
              {myAcceptedOrders.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🔥 Serviço Atual</Text>
                  {myAcceptedOrders.map((order: Order) => (
                    <View key={order.id} style={[styles.card, styles.cardActive]}>
                        <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                           <Text style={styles.cardTitle}>{order.dish_description}</Text>
                           <Text style={{fontWeight:'bold', color:'green'}}>R$ {Number(order.offer_price).toFixed(2)}</Text>
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
                              <Text style={styles.btnText}>📍 Cheguei</Text>
                           </TouchableOpacity>
                          )}
                          {order.status === 'arrived' && (
                           <TouchableOpacity style={[styles.btnStatus, {backgroundColor:'#9C27B0'}]} onPress={() => changeStatus(order.id, 'cooking')}>
                              <Text style={styles.btnText}>🍳 Cozinhar</Text>
                           </TouchableOpacity>
                          )}
                          {order.status === 'cooking' && (
                           <TouchableOpacity style={[styles.btnStatus, {backgroundColor:'#4CAF50'}]} onPress={() => changeStatus(order.id, 'completed')}>
                              <Text style={styles.btnText}>✅ Finalizar</Text>
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
          ListEmptyComponent={<Text style={styles.empty}>Nenhum pedido na região.</Text>}
          renderItem={({ item }: { item: Order }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.dish_description}</Text>
              <Text style={styles.cardSub}>Cliente: {item.client_name}</Text>
              <Text style={styles.cardPrice}>Oferta: R$ {Number(item.offer_price).toFixed(2)}</Text>
              <TouchableOpacity style={styles.btnAccept} onPress={() => handleAccept(item.id)}>
                <Text style={styles.btnText}>Aceitar e Ir</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  // === CLIENTE ===
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation={true}
        showsMyLocationButton={false}
        initialRegion={region || {
            latitude: -23.55052,
            longitude: -46.633308,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
        }}
      >
        {chefs.map((chef: Chef) => renderChefMarker(chef))}
      </MapView>

      <View style={styles.panel}>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/account')}>
            <Text style={styles.greeting}>Olá, {user.name}!</Text>
            <Text style={styles.debug}>Encontre seu chef ideal</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="red" />
          </TouchableOpacity>
        </View>

        {activeOrder ? (
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
                   <Text style={{color:'green', fontWeight:'bold'}}>R$ {Number(activeOrder.offer_price).toFixed(2)}</Text>
                </View>
                {renderProgressBar(activeOrder.status)}
                <TouchableOpacity
                  style={styles.btnChat}
                  onPress={() => router.push({ pathname: '/chat', params: { orderId: activeOrder.id } })}
                >
                  <Ionicons name="chatbubbles" size={20} color="#FFF" style={{marginRight:5}} />
                  <Text style={styles.btnText}>Chat</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
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

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Novo Pedido</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}>
                 <Ionicons name="close" size={24} color="#999" />
               </TouchableOpacity>
            </View>
            <Text style={styles.label}>O que deseja comer?</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Churrasco, Risoto..."
              value={dish}
              onChangeText={setDish}
            />
            <Text style={styles.label}>Quanto quer pagar? (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 150.00"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
            <TouchableOpacity style={styles.btnConfirm} onPress={handleRequest}>
              <Text style={styles.btnText}>Ir para Pagamento</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  map: { width: width, height: height },
  header: { padding: 20, paddingTop: 40, flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'#FFF', borderBottomWidth:1, borderColor:'#EEE' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { color: '#666', fontSize: 14 },
  debug: { fontSize:12, color:'#FF6F00', fontStyle:'italic' },
  empty: { textAlign:'center', marginTop:50, color:'#999' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight:'bold', color:'#333', marginLeft: 15, marginBottom: 10 },
  card: { backgroundColor:'#FFF', marginHorizontal:15, marginBottom:15, padding:15, borderRadius:12, elevation:3, shadowColor:'#000', shadowOffset:{width:0, height:2}, shadowOpacity:0.1, borderWidth:1, borderColor:'#EEE' },
  cardActive: { borderColor: '#FF6F00', backgroundColor: '#FFF8E1' },
  cardTitle: { fontSize:18, fontWeight:'bold', color:'#333' },
  cardSub: { color:'#666', marginVertical:5 },
  cardPrice: { fontSize:16, fontWeight:'bold', color:'green' },
  btnAccept: { backgroundColor:'#FF6F00', padding:12, borderRadius:8, marginTop:10, alignItems:'center' },
  panel: { position:'absolute', top:60, left:20, right:20, backgroundColor:'rgba(255,255,255,0.95)', padding:20, borderRadius:20, elevation:10, shadowColor:'#000', shadowOpacity:0.2, shadowRadius:10 },
  row: { flexDirection:'row', justifyContent:'space-between', marginBottom:15 },
  greeting: { fontSize:20, fontWeight:'bold', color:'#333' },
  btnChat: { backgroundColor:'#2196F3', padding:12, borderRadius:10, flexDirection:'row', justifyContent:'center', alignItems:'center', marginTop: 15 },
  btnChatSmall: { backgroundColor:'#2196F3', padding:10, borderRadius:8, justifyContent:'center', alignItems:'center', marginRight: 10 },
  btnStatus: { flex: 1, backgroundColor:'#FF6F00', padding:10, borderRadius:8, justifyContent:'center', alignItems:'center' },
  actionRow: { flexDirection: 'row', marginTop: 15 },
  btnSearch: { backgroundColor:'#FFF', padding:15, borderRadius:15, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:'#EEE', elevation:2 },
  iconCircle: { width:40, height:40, borderRadius:20, backgroundColor:'#FF6F00', alignItems:'center', justifyContent:'center' },
  activeOrderContainer: { backgroundColor:'#F9FAFB', padding:15, borderRadius:15, borderWidth:1, borderColor:'#EEE' },
  statusRow: { flexDirection:'row', alignItems:'center', marginBottom:10 },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalContent: { backgroundColor:'#FFF', padding:25, borderTopLeftRadius:25, borderTopRightRadius:25 },
  modalHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  modalTitle: { fontSize:22, fontWeight:'bold', color:'#333' },
  input: { backgroundColor:'#F5F5F5', padding:15, borderRadius:12, marginBottom:15, fontSize:16 },
  label: { fontWeight: 'bold', color:'#333', marginBottom:8, fontSize:14 },
  btnConfirm: { backgroundColor:'#FF6F00', padding:18, borderRadius:12, alignItems:'center', marginTop:10 },
  btnText: { color:'#FFF', fontWeight:'bold', fontSize:16 },
  progressContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, marginBottom: 5 },
  stepWrapper: { alignItems: 'center' },
  stepCircle: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  stepActive: { backgroundColor: '#4CAF50' },
  stepInactive: { backgroundColor: '#E0E0E0' },
  stepLabel: { fontSize: 10, color: '#666', fontWeight:'600' },
  markerContainer: { alignItems: 'center', width: 40, height: 50 },
  markerInner: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  markerArrow: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', transform: [{translateY: -2}] }
});