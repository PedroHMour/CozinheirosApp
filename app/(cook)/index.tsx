import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
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
import { Order } from '../../src/types';

export default function CookHome() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await api.get('/requests/open');
      setRequests(data);
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Falha ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (orderId: number, profit: number) => {
    Alert.alert(
      "Aceitar Serviço",
      `Receberá R$ ${profit.toFixed(2)} por este trabalho. Confirmar?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "ACEITAR AGORA", 
          onPress: async () => {
            try {
              await api.post('/requests/confirm-offer', {
                 order_id: orderId,
                 cook_id: user?.id
              });
              Alert.alert("Parabéns!", "Pedido aceite. Veja os detalhes em 'Meus Pedidos'.");
              fetchRequests(); 
            } catch {
              Alert.alert("Erro", "Não foi possível aceitar este pedido.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Order }) => {
    let badgeColor = Colors.light.primaryLight;
    if (item.package_level === 'premium') badgeColor = '#FFD700';
    if (item.package_level === 'professional') badgeColor = '#C0C0C0';

    return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                 {item.client?.photo ? (
                    <Image source={{ uri: item.client.photo }} style={styles.avatar} />
                 ) : (
                    <View style={[styles.avatar, {backgroundColor: '#DDD'}]}>
                        <Ionicons name="person" size={20} color="#FFF" />
                    </View>
                 )}
                 <View>
                     <Text style={styles.clientName}>{item.client?.name || 'Cliente'}</Text>
                     <View style={[styles.badge, {backgroundColor: badgeColor}]}>
                        <Text style={styles.badgeText}>
                            PACOTE {item.package_level ? item.package_level.toUpperCase() : 'BÁSICO'}
                        </Text>
                     </View>
                 </View>
            </View>
            <View style={{alignItems: 'flex-end'}}>
                <Text style={styles.priceLabel}>O seu Lucro</Text>
                <Text style={styles.price}>R$ {item.cook_profit?.toFixed(2)}</Text>
            </View>
          </View>
    
          {/* Correção das aspas para &quot; */}
          <Text style={styles.dishDescription}>&quot;{item.dish_description}&quot;</Text>
          
          <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                  <Ionicons name="people" size={18} color="#666" />
                  <Text style={styles.infoText}>{item.people_count || 1} pessoas</Text>
              </View>
              <View style={styles.infoItem}>
                  <Ionicons name="wallet-outline" size={18} color="#666" />
                  <Text style={styles.infoText}>Pix Confirmado</Text>
              </View>
          </View>
    
          <TouchableOpacity 
            style={styles.acceptBtn} 
            onPress={() => handleAccept(item.id, item.cook_profit)}
          >
             <Text style={styles.acceptText}>ACEITAR SERVIÇO</Text>
          </TouchableOpacity>
        </View>
      );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={Typography.header}>Radar de Pedidos</Text>
        <Text style={Typography.body}>Pedidos aguardando chef na sua região.</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRequests} />}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        // Correção do ternário
        ListEmptyComponent={
            !loading ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="restaurant-outline" size={64} color="#DDD" />
                    <Text style={styles.emptyText}>Nenhum pedido disponível no momento.</Text>
                    <TouchableOpacity onPress={fetchRequests} style={styles.refreshBtn}>
                        <Text style={styles.refreshText}>Atualizar Radar</Text>
                    </TouchableOpacity>
                </View>
            ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 20, backgroundColor: '#FFF', paddingBottom: 15, ...Shadows.soft },
  
  card: { 
      backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 15,
      ...Shadows.soft, borderWidth: 1, borderColor: '#EEE'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  
  avatar: { width: 45, height: 45, borderRadius: 25, alignItems:'center', justifyContent:'center' },
  clientName: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4, alignSelf:'flex-start', marginTop: 4 },
  badgeText: { fontSize: 10, color: '#333', fontWeight:'bold' },
  
  priceLabel: { fontSize: 10, color: '#888', textTransform: 'uppercase' },
  price: { fontSize: 20, fontWeight: 'bold', color: '#2ecc71' },
  
  dishDescription: { fontSize: 16, color: '#444', marginBottom: 20, lineHeight: 22, fontStyle: 'italic' },
  
  infoRow: { flexDirection: 'row', gap: 20, marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { color: '#666', fontSize: 14 },
  
  acceptBtn: { backgroundColor: Colors.light.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  acceptText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },

  emptyContainer: { alignItems:'center', marginTop: 80 },
  emptyText: { color:'#999', marginTop:15, fontSize: 16 },
  refreshBtn: { marginTop: 20, padding: 10 },
  refreshText: { color: Colors.light.primary, fontWeight: 'bold' }
});