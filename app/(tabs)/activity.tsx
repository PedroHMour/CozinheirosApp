import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../src/constants/Config';
import { Colors, Shadows, Typography } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';

export default function ActivityScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/requests/history/${user?.id}`);
      const data = await response.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (error) { console.log(error); } finally { setLoading(false); }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.iconCol}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-done" size={20} color={Colors.light.success} />
        </View>
        <View style={styles.line} />
      </View>
      <View style={styles.contentCol}>
        <View style={styles.headerRow}>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
          <Text style={styles.price}>R$ {item.offer_price}</Text>
        </View>
        <Text style={styles.dish}>{item.dish_description}</Text>
        <TouchableOpacity 
          style={styles.chatLink}
          onPress={() => router.push({ pathname: '/chat', params: { orderId: item.id } })}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.light.primary} />
          <Text style={styles.chatLinkText}>Ver conversa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={Typography.heading1}>Histórico</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.light.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={50} color="#DDD" />
              <Text style={styles.emptyText}>Nenhum pedido finalizado ainda.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE' },
  card: { flexDirection: 'row', marginBottom: 5 },
  iconCol: { alignItems: 'center', width: 40, marginRight: 10 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#C8E6C9' },
  line: { width: 2, flex: 1, backgroundColor: '#EEE', marginTop: 5 },
  contentCol: { flex: 1, backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 20, ...Shadows.small, borderWidth: 1, borderColor: '#F0F0F0' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  date: { fontSize: 12, color: '#999' },
  price: { fontSize: 14, fontWeight: 'bold', color: Colors.light.success },
  dish: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
  chatLink: { flexDirection: 'row', alignItems: 'center' },
  chatLinkText: { color: Colors.light.primary, fontSize: 13, marginLeft: 5, fontWeight: '500' },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', marginTop: 10 }
});