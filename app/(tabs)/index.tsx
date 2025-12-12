import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- IMPORTS DO PROJETO ---
import MyMap from '../../src/components/MyMap';
import { API_URL } from '../../src/constants/Config';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';

const { width } = Dimensions.get('window');

// --- COMPONENTES UI REUTILIZÁVEIS (Internos para facilitar a cópia) ---

// Botão de Ícone Redondo (Estilo Menu/Notificação)
const IconButton = ({ name, onPress, color = Colors.light.text, style }: any) => (
  <TouchableOpacity style={[styles.iconButton, style]} onPress={onPress}>
    <Ionicons name={name} size={24} color={color} />
  </TouchableOpacity>
);

// Card de Pedido (Estilo "Viagem Disponível")
const RequestCard = ({ item, onPress, isActive = false }: any) => (
  <TouchableOpacity 
    style={[styles.requestCard, isActive && styles.requestCardActive]} 
    onPress={onPress}
    activeOpacity={0.9}
  >
    <View style={styles.requestIconContainer}>
      {/* Ícone de prato em vez de carro */}
      <Ionicons name="restaurant" size={24} color={isActive ? '#FFF' : Colors.light.primary} />
    </View>
    <View style={{ flex: 1, paddingHorizontal: 12 }}>
      <Text style={styles.requestTitle} numberOfLines={1}>{item.dish_description}</Text>
      <Text style={styles.requestSub}>{item.client_name || 'Cliente'} • 2.5km</Text>
    </View>
    <View style={styles.priceBadge}>
      <Text style={[styles.priceText, isActive && {color: '#FFF'}]}>R$ {item.offer_price}</Text>
    </View>
  </TouchableOpacity>
);

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();

  // --- LÓGICA (Mantida Original) ---
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<any>(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [dish, setDish] = useState('');
  const [price, setPrice] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('pix'); 

  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]); 
  const [myAcceptedOrders, setMyAcceptedOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadLocation(); }, []);

  useEffect(() => {
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
      { text: "Sim", style: 'destructive', onPress: () => signOut() }
    ]);
  };

  const checkMyOrder = async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/requests/my-active-order/${id}`);
      const data = await res.json();
      if (data && data.status === 'completed') setActiveOrder(null);
      else setActiveOrder(data && data.id ? data : null);
    } catch (e) { }
  };

  const handleRequest = async () => {
    if(!dish || !price || !user) return Alert.alert("Ops", "Preencha o prato e o valor");
    try {
      await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          client_id: user.id, dish, price, 
          latitude: region?.latitude||0, longitude: region?.longitude||0,
          payment_method: selectedPayment
        })
      });
      setModalVisible(false); setDish(''); setPrice(''); checkMyOrder(user.id);
      Alert.alert("Pedido Enviado", "Aguardando um Chef aceitar.");
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
      if(res.ok) { fetchCookData(); Alert.alert("Pedido Aceito", "Vá até o local do cliente."); }
    } catch (e) { }
  };

  const changeStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/requests/update-status`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ request_id: orderId, new_status: newStatus })
      });
      if(res.ok) {
        if(newStatus === 'completed') Alert.alert("Sucesso", "Serviço finalizado!");
        fetchCookData();
      }
    } catch (e) { Alert.alert("Erro", "Falha ao mudar status"); }
  };

  // Status visual estilo Timeline de Transporte
  const renderProgressBar = (status: string) => {
    const steps = ['accepted', 'arrived', 'cooking'];
    const labels = ['A Caminho', 'Chegou', 'Cozinhando'];
    let currentIndex = steps.indexOf(status);
    if (status === 'completed') currentIndex = 3;

    return (
      <View style={styles.timelineContainer}>
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          return (
            <View key={step} style={styles.timelineItem}>
              <View style={[styles.timelineDot, isActive && styles.timelineDotActive]} />
              {index < steps.length - 1 && <View style={[styles.timelineLine, isActive && styles.timelineLineActive]} />}
              <Text style={[styles.timelineLabel, isActive && styles.timelineLabelActive]}>{labels[index]}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading || !user) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.light.primary} />
    </View>
  );

  // ==================== UI DO COZINHEIRO (Estilo Driver) ====================
  if (user.type === 'cook') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Mapa ao Fundo */}
        <View style={styles.mapBackground}>
          {region && <MyMap region={region} />}
        </View>

        {/* Header Flutuante */}
        <View style={[styles.floatingHeader, { top: insets.top + 10 }]}>
          <View style={styles.headerProfile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
            </View>
            <View>
              <Text style={Typography.caption}>Bem-vindo, Chef</Text>
              <Text style={Typography.subHeader}>{user.name.split(' ')[0]}</Text>
            </View>
          </View>
          <IconButton name="log-out-outline" color={Colors.light.error} onPress={handleLogout} />
        </View>

        {/* Painel Inferior (Bottom Sheet) */}
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          
          <Text style={styles.sheetTitle}>
            {myAcceptedOrders.length > 0 ? 'Em Andamento' : 'Novas Solicitações'}
          </Text>

          {/* Pedido Ativo (Destaque) */}
          {myAcceptedOrders.length > 0 ? (
            <FlatList
              data={myAcceptedOrders}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.activeOrderContainer}>
                  <View style={styles.activeCard}>
                    <View style={styles.activeCardHeader}>
                      <Text style={styles.activeCardTitle} numberOfLines={1}>{item.dish_description}</Text>
                      <View style={styles.activePriceTag}>
                        <Text style={styles.activePriceText}>R$ {item.offer_price}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardSubText}>{item.client_name}</Text>
                    
                    {renderProgressBar(item.status)}

                    <View style={styles.actionButtonsRow}>
                      <IconButton 
                        name="chatbubbles" 
                        color="#FFF" 
                        style={{backgroundColor: Colors.light.secondary}}
                        onPress={() => router.push({ pathname: '/chat', params: { orderId: item.id } })} 
                      />
                      
                      {/* Botão de Ação Principal */}
                      <TouchableOpacity style={styles.primaryActionButton} onPress={() => {
                          if (item.status === 'accepted') changeStatus(item.id, 'arrived');
                          else if (item.status === 'arrived') changeStatus(item.id, 'cooking');
                          else if (item.status === 'cooking') changeStatus(item.id, 'completed');
                      }}>
                        <Text style={Typography.button}>
                          {item.status === 'accepted' ? 'Cheguei no Local' :
                           item.status === 'arrived' ? 'Iniciar Preparo' : 'Finalizar Serviço'}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" style={{marginLeft: 8}} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
          ) : (
            /* Lista de Solicitações (Estilo Lista de Corridas) */
            <FlatList
              data={orders}
              keyExtractor={item => item.id.toString()}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchCookData} />}
              renderItem={({ item }) => (
                <RequestCard 
                  item={item} 
                  onPress={() => handleAccept(item.id)} 
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="map-outline" size={48} color={Colors.light.textSecondary} />
                  <Text style={styles.emptyText}>Procurando pedidos na região...</Text>
                </View>
              }
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </View>
      </View>
    );
  }

  // ==================== UI DO CLIENTE (Estilo Passageiro) ====================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Mapa ao Fundo */}
      <View style={styles.mapBackground}>
        {region && <MyMap region={region} />}
      </View>

      {/* Header Flutuante */}
      <View style={[styles.floatingHeader, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.searchBarFake} onPress={() => router.push('/(tabs)/account')}>
          <Ionicons name="menu" size={24} color={Colors.light.text} />
          <Text style={styles.searchText}>Olá, {user.name.split(' ')[0]}</Text>
          <View style={styles.profilePicSmall}>
             <Text style={{color: '#FFF', fontSize: 12, fontWeight: 'bold'}}>{user.name.charAt(0)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Painel Inferior (Bottom Sheet) */}
      <View style={styles.bottomSheet}>
        {activeOrder ? (
          // Estado: Pedido em Andamento
          <View>
            <Text style={styles.sheetTitle}>Acompanhe seu pedido</Text>
            <View style={styles.driverInfoCard}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={24} color="#FFF" />
              </View>
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={styles.driverName}>Chef {activeOrder.cook_name}</Text>
                <Text style={styles.driverCar}>{activeOrder.dish_description}</Text>
              </View>
              <View>
                <Text style={styles.priceText}>R$ {activeOrder.offer_price}</Text>
              </View>
            </View>

            {renderProgressBar(activeOrder.status)}

            <View style={styles.actionButtonsRow}>
               <TouchableOpacity 
                 style={[styles.primaryActionButton, {backgroundColor: Colors.light.secondary}]}
                 onPress={() => router.push({ pathname: '/chat', params: { orderId: activeOrder.id } })}
               >
                 <Ionicons name="chatbubble" size={20} color="#FFF" style={{marginRight: 8}} />
                 <Text style={Typography.button}>Contactar Chef</Text>
               </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Estado: Solicitar "Viagem" (Prato)
          <View>
            <Text style={styles.sheetTitle}>O que vamos comer?</Text>
            
            {/* Atalhos Rápidos */}
            <View style={styles.quickShortcuts}>
              <TouchableOpacity style={styles.shortcutItem} onPress={() => setModalVisible(true)}>
                <View style={styles.shortcutIcon}><Ionicons name="restaurant" size={24} color={Colors.light.primary} /></View>
                <Text style={styles.shortcutLabel}>Prato Feito</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shortcutItem} onPress={() => setModalVisible(true)}>
                <View style={styles.shortcutIcon}><Ionicons name="pizza" size={24} color={Colors.light.primary} /></View>
                <Text style={styles.shortcutLabel}>Massas</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shortcutItem} onPress={() => setModalVisible(true)}>
                <View style={styles.shortcutIcon}><Ionicons name="calendar" size={24} color={Colors.light.primary} /></View>
                <Text style={styles.shortcutLabel}>Agendar</Text>
              </TouchableOpacity>
            </View>

            {/* Input Fake para abrir Modal */}
            <TouchableOpacity style={styles.destinationInput} onPress={() => setModalVisible(true)}>
              <Ionicons name="search" size={20} color={Colors.light.text} />
              <Text style={styles.destinationText}>Digite o prato ou ingrediente...</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modal de Solicitação (Design Limpo) */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.sheetTitle}>Detalhes do Pedido</Text>
            
            <View style={styles.inputGroup}>
              <Text style={Typography.caption}>PRATO</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="Ex: Strogonoff de Frango" 
                value={dish} 
                onChangeText={setDish} 
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={Typography.caption}>SUA OFERTA (R$)</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="0,00" 
                keyboardType="numeric" 
                value={price} 
                onChangeText={setPrice} 
              />
            </View>

            <View style={styles.paymentSelect}>
              <Ionicons name="card" size={20} color={Colors.light.text} />
              <Text style={{marginLeft: 10, flex: 1, color: Colors.light.text}}>Pagamento via Pix</Text>
              <Text style={{color: Colors.light.primary, fontWeight: '600'}}>Alterar</Text>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={handleRequest}>
              <Text style={Typography.button}>Confirmar Pedido</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{alignItems:'center', marginTop: 15}}>
              <Text style={{color: Colors.light.textSecondary}}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },

  // --- HEADER FLUTUANTE ---
  floatingHeader: {
    position: 'absolute',
    left: 20, right: 20,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: Spacing.xs,
    paddingRight: Spacing.md,
    borderRadius: Radius.full,
    ...Shadows.float,
  },
  avatar: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: Colors.light.primary },
  iconButton: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.card,
    justifyContent: 'center', alignItems: 'center',
    ...Shadows.float,
  },

  // --- CLIENTE SEARCH BAR ---
  searchBarFake: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: Spacing.md,
    borderRadius: Radius.full,
    ...Shadows.float,
  },
  searchText: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '500', color: Colors.light.text },
  profilePicSmall: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center', alignItems: 'center',
  },

  // --- BOTTOM SHEET ---
  bottomSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: 40,
    ...Shadows.float,
    // Sombra invertida para subir
    shadowOffset: { width: 0, height: -5 },
  },
  sheetHandle: {
    width: 40, height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetTitle: { ...Typography.header, marginBottom: Spacing.md },

  // --- CARDS E LISTAS ---
  requestCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  requestCardActive: {
    backgroundColor: Colors.light.primaryLight,
    borderColor: Colors.light.primary,
  },
  requestIconContainer: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  requestTitle: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  requestSub: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 2 },
  priceBadge: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full,
  },
  priceText: { fontWeight: '700', color: Colors.light.text },

  // --- ATALHOS CLIENTE ---
  quickShortcuts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  shortcutItem: { alignItems: 'center', width: width / 3.5 },
  shortcutIcon: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: Colors.light.background,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  shortcutLabel: { fontSize: 13, fontWeight: '500', color: Colors.light.text },
  destinationInput: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  destinationText: { marginLeft: 10, fontSize: 16, color: '#9CA3AF', fontWeight: '500' },

  // --- PEDIDO ATIVO (CHEF/CLIENTE) ---
  activeCard: {
    backgroundColor: Colors.light.card,
    borderRadius: Radius.lg,
    // Sem sombra interna, pois já está no bottom sheet
  },
  activeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeCardTitle: { ...Typography.subHeader, flex: 1 },
  activePriceTag: { backgroundColor: Colors.light.success + '20', padding: 6, borderRadius: Radius.sm },
  activePriceText: { color: Colors.light.success, fontWeight: '700' },
  cardSubText: { ...Typography.caption, marginTop: 4, marginBottom: 15 },
  
  driverInfoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.light.primary,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  driverAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent:'center', alignItems:'center' },
  driverName: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  driverCar: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },

  actionButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.light.primary,
    padding: Spacing.md,
    borderRadius: Radius.full,
    ...Shadows.soft,
  },

  // --- TIMELINE ---
  timelineContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  timelineItem: { alignItems: 'center', flex: 1 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E5E7EB', zIndex: 2 },
  timelineDotActive: { backgroundColor: Colors.light.primary },
  timelineLine: { position: 'absolute', top: 5, left: '50%', right: '-50%', height: 2, backgroundColor: '#E5E7EB', zIndex: 1 },
  timelineLineActive: { backgroundColor: Colors.light.primary },
  timelineLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  timelineLabelActive: { color: Colors.light.text, fontWeight: '600' },

  // --- MODAL ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  modalInput: {
    backgroundColor: Colors.light.background,
    padding: Spacing.md,
    borderRadius: Radius.md,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1, borderColor: 'transparent',
  },
  inputGroup: { marginBottom: Spacing.md },
  paymentSelect: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.light.border,
    marginVertical: Spacing.md,
  },
  confirmButton: {
    backgroundColor: Colors.light.primary,
    padding: Spacing.lg,
    borderRadius: Radius.full,
    alignItems: 'center',
    ...Shadows.soft,
  },
  
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { ...Typography.caption, marginTop: 10 },
});