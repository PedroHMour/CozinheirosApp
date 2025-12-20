// app/(tabs)/activity.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors, Shadows, Typography } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/services/api';

export default function ActivityScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  // Para o Chef: Filtro de aba (pendente ou aceito)
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) return;

      let endpoint = '';
      
      if (user.type === 'client') {
        // Cliente vê seu pedido ativo
        endpoint = `/requests/my-active-order/${user.id}`;
      } else {
        // CHEFE:
        if (activeTab === 'pending') {
           // ROTA DO MURAL: Busca TODOS os pendentes (/requests)
           endpoint = `/requests`; 
        } else {
           // ROTA DOS MEUS: Busca os que eu já aceitei
           endpoint = `/requests/accepted-by/${user.id}`;
        }
      }

      console.log(`📡 Buscando em: ${endpoint}`); // Debug
      const data = await api.get(endpoint);
      const list = Array.isArray(data) ? data : (data ? [data] : []);
      
      // Se for Chef na aba Pendente, garante que só mostra status 'pending'
      // E filtra para não mostrar pedidos que já tenham sido aceitos por outros (se o backend mandar sujo)
      if (user.type === 'cook' && activeTab === 'pending') {
          setOrders(list.filter((o: any) => o.status === 'pending'));
      } else {
          setOrders(list);
      }

    } catch (error) {
      console.log("Erro ao buscar pedidos:", error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, activeTab]); 

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAcceptOrder = async (orderId: number) => {
    try {
      console.log(`👨‍🍳 Aceitando pedido ${orderId}...`);
      await api.post('/requests/accept', { request_id: orderId, cook_id: user?.id });
      
      Alert.alert("Sucesso", "Pedido aceito! Vá para a aba 'Em Preparo'.");
      setActiveTab('active'); // Muda a aba automaticamente
      fetchOrders(); 
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível aceitar o pedido.");
    }
  };

  const renderOrder = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Pedido #{item.id}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.clientName}>Cliente: {item.client_name || 'Cliente'}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.price}>R$ {Number(item.offer_price).toFixed(2)}</Text>
      
      <View style={styles.footer}>
        <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString()}
        </Text>
        
        {/* BOTÃO PARA O CHEFE ACEITAR (Só aparece se status for pending e aba novos) */}
        {user?.type === 'cook' && item.status === 'pending' && activeTab === 'pending' && (
            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptOrder(item.id)}>
                <Text style={styles.acceptText}>Aceitar Pedido</Text>
            </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={Typography.header}>
            {user?.type === 'cook' ? 'Gestão de Pedidos' : 'Meus Pedidos'}
        </Text>
      </View>

      {/* ABAS DO CHEFE */}
      {user?.type === 'cook' && (
          <View style={styles.tabsContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                onPress={() => setActiveTab('pending')}
              >
                  <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Mural (Novos)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                onPress={() => setActiveTab('active')}
              >
                  <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Meus (Em Preparo)</Text>
              </TouchableOpacity>
          </View>
      )}

      {loading ? (
        <ActivityIndicator style={{marginTop: 50}} size="large" color={Colors.light.primary} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrder}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={60} color="#CCC" />
                <Text style={styles.emptyText}>
                    {user?.type === 'cook' && activeTab === 'pending' 
                        ? 'Nenhum pedido novo disponível no app.' 
                        : 'Lista vazia.'}
                </Text>
            </View>
          }
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const getStatusColor = (status: string) => {
    switch(status) {
        case 'pending': return '#FFB300'; 
        case 'accepted': return '#2196F3'; 
        case 'completed': return '#4CAF50'; 
        default: return '#999';
    }
};

const getStatusLabel = (status: string) => {
    switch(status) {
        case 'pending': return 'Disponível';
        case 'accepted': return 'Em Preparo';
        case 'completed': return 'Finalizado';
        default: return status;
    }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { padding: 20, backgroundColor: Colors.light.card, ...Shadows.soft },
  tabsContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#FFF' },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  activeTab: { borderColor: Colors.light.primary },
  tabText: { fontWeight: '600', color: '#999' },
  activeTabText: { color: Colors.light.primary },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, ...Shadows.soft },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderId: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  clientName: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 5 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  description: { fontSize: 14, color: '#666', marginBottom: 10 },
  price: { fontSize: 18, fontWeight: 'bold', color: Colors.light.primary },
  footer: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: '#999' },
  acceptBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  acceptText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', marginTop: 10 }
});