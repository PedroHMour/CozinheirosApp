import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../src/contexts/AuthContext';
import { API_URL } from '../../src/constants/Config';

export default function ActivityScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // 1. CORREÇÃO: Tipagem explícita para evitar erro de 'never[]'
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 2. CORREÇÃO: useCallback para estabilizar a função no useEffect
  const fetchHistory = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/requests/history/${user.id}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (error) {
      console.log("Erro histórico:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // 3. CORREÇÃO: Dependências corretas
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  if (!user) return <View style={styles.container} />;

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString('pt-BR')} • {new Date(item.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
        </Text>
        {/* Badge de Status */}
        <View style={[styles.badge, item.status === 'completed' ? styles.badgeSuccess : styles.badgeDefault]}>
           <Text style={styles.badgeText}>
             {item.status === 'completed' ? 'Finalizado' : item.status}
           </Text>
        </View>
      </View>
      
      {/* 4. CORREÇÃO: Estilos manuais em vez de 'heading1' */}
      <Text style={styles.dishTitle}>{item.dish_description}</Text>
      
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Valor pago:</Text>
        <Text style={styles.priceValue}>R$ {item.offer_price}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.btnDetails}
        onPress={() => router.push({ pathname: '/chat', params: { orderId: item.id } })}
      >
        <Ionicons name="chatbox-ellipses-outline" size={18} color="#FF6F00" style={{marginRight: 5}}/>
        <Text style={styles.btnText}>Ver Conversa</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Histórico de Pedidos</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF6F00" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6F00']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color="#DDD" />
              <Text style={styles.emptyText}>Nenhum pedido finalizado ainda.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  
  header: { 
    padding: 20, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderColor: '#EEE'
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#333' 
  },

  // Card Styles (Substituindo os estilos quebrados)
  card: { 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15, 
    // Sombra manual (Substituindo 'style.soft')
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 10 
  },
  
  date: { 
    color: '#999', 
    fontSize: 12 
  },
  
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeSuccess: { backgroundColor: '#E8F5E9' },
  badgeDefault: { backgroundColor: '#F5F5F5' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: 'green', textTransform: 'uppercase' },

  dishTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 10 
  },
  
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  priceLabel: { color: '#666', marginRight: 5 },
  priceValue: { fontSize: 16, color: 'green', fontWeight: 'bold' },

  btnDetails: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 8
  },
  btnText: { 
    color: '#FF6F00', 
    fontWeight: '600',
    fontSize: 14
  },
  
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 10, fontSize: 16 }
});