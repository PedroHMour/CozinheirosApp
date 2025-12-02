import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// IMPORTANDO O CONTEXTO (SEGURANÇA)
import { useSession } from '../../ctx';
import { API_URL } from '../../src/constants/Config';

export default function ActivityScreen() {
  const router = useRouter();
  
  // Pegamos o usuário do contexto global
  const { user } = useSession();
  

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Só busca histórico se o usuário existir
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return; // Proteção extra

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
    }
  };

  // Se não tiver usuário (está saindo da conta), mostra vazio para não travar
  if (!user) return <View style={styles.container} />;

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <Text style={styles.status}>✅ Finalizado</Text>
      </View>
      
      <Text style={styles.dish}>{item.dish_description}</Text>
      <Text style={styles.price}>R$ {item.offer_price}</Text>
      
      <TouchableOpacity 
        style={styles.btnDetails}
        onPress={() => router.push({ pathname: '/chat', params: { orderId: item.id } })}
      >
        <Text style={styles.btnText}>Ver Conversa Antiga</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* Removemos o botão de voltar pois é uma aba */}
        <Text style={styles.title}>Histórico de Pedidos</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF6F00" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum pedido finalizado ainda.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', elevation: 2, borderBottomWidth: 1, borderColor: '#EEE' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  date: { color: '#999', fontSize: 12 },
  status: { color: 'green', fontWeight: 'bold', fontSize: 12 },
  dish: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  price: { fontSize: 16, color: 'green', fontWeight: 'bold' },
  btnDetails: { marginTop: 10, alignSelf: 'flex-start', paddingVertical: 5 },
  btnText: { color: '#FF6F00', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#999', marginTop: 50 }
});