import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image, Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../src/constants/Config';
import { useAuth } from '../../src/contexts/AuthContext';

// Largura da tela para calcular o tamanho das fotos (Grid de 3 colunas)
const { width } = Dimensions.get('window');
const PHOTO_SIZE = width / 3 - 10; 

export default function AccountScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  
  // Portfólio
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newImageTitle, setNewImageTitle] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (user?.id) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      // 1. Carrega Estatísticas
      const resStats = await fetch(`${API_URL}/users/${user?.id}/stats`);
      const jsonStats = await resStats.json();
      setStats(jsonStats.stats);

      // 2. Se for Chef, carrega fotos
      if (user?.type === 'cook') {
        const resPort = await fetch(`${API_URL}/portfolio/${user.id}`);
        const jsonPort = await resPort.json();
        if (Array.isArray(jsonPort)) setPortfolio(jsonPort);
      }
    } catch (error) {
      console.log("Erro dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!newImageUrl) return Alert.alert("Ops", "Cole o link da imagem.");
    
    try {
      const res = await fetch(`${API_URL}/portfolio`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          chef_id: user?.id,
          image_url: newImageUrl,
          title: newImageTitle || "Prato do Chef"
        })
      });
      
      if (res.ok) {
        setModalVisible(false);
        setNewImageUrl('');
        setNewImageTitle('');
        loadProfile(); // Recarrega a galeria
        Alert.alert("Sucesso", "Prato adicionado ao portfólio!");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar foto.");
    }
  };

  const handleDeletePhoto = async (id: number) => {
    Alert.alert("Excluir", "Remover esta foto?", [
      { text: "Cancelar" },
      { 
        text: "Excluir", 
        style: 'destructive',
        onPress: async () => {
          await fetch(`${API_URL}/portfolio/${id}`, { method: 'DELETE' });
          loadProfile();
        }
      }
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza?", [
      { text: "Cancelar" },
      { text: "Sair", onPress: () => signOut() }
    ]);
  };

  if (loading || !user) return <ActivityIndicator size="large" color="#FF6F00" style={{flex:1}} />;

  // Dados seguros para exibição
  const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
  const isCook = user.type === 'cook';

  // Componente de Foto Individual
  const renderPhoto = ({ item }: { item: any }) => (
    <TouchableOpacity onLongPress={() => handleDeletePhoto(item.id)} style={styles.photoContainer}>
      <Image source={{ uri: item.image_url }} style={styles.photo} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Minha Conta</Text>
        </View>

        {/* Perfil */}
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{isCook ? '👨‍🍳 Chef de Cozinha' : '🧑‍💼 Cliente'}</Text>
          </View>
        </View>

        {/* Estatísticas */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{isCook ? 'Ganhos' : 'Pedidos'}</Text>
              <Text style={[styles.statValue, {color: 'green'}]}>
                {isCook ? `R$ ${parseFloat(stats.total_earnings || 0).toFixed(2)}` : stats.completed_orders}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Serviços</Text>
              <Text style={styles.statValue}>{stats.completed_orders || 0}</Text>
            </View>
          </View>
        )}

        {/* ÁREA DO PORTFÓLIO (SÓ PARA CHEFS) */}
        {isCook && (
          <View style={styles.portfolioSection}>
            <View style={styles.portfolioHeader}>
              <Text style={styles.sectionTitle}>Meu Portfólio 📸</Text>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Text style={styles.btnAdd}>+ Adicionar</Text>
              </TouchableOpacity>
            </View>

            {portfolio.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma foto. Adicione seus melhores pratos!</Text>
            ) : (
              <FlatList
                data={portfolio}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPhoto}
                numColumns={3}
                scrollEnabled={false} // A lista rola junto com a página
                columnWrapperStyle={{ gap: 10 }}
                contentContainerStyle={{ gap: 10 }}
              />
            )}
          </View>
        )}

        {/* Menu Geral */}
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/activity')}>
            <Ionicons name="time-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Histórico</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="red" />
            <Text style={[styles.menuText, {color:'red'}]}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* MODAL PARA ADICIONAR FOTO */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Prato</Text>
            
            <Text style={styles.label}>Título do Prato</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Risoto de Funghi" 
              value={newImageTitle} 
              onChangeText={setNewImageTitle} 
            />

            <Text style={styles.label}>Link da Imagem (URL)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="https://..." 
              value={newImageUrl} 
              onChangeText={setNewImageUrl} 
              autoCapitalize="none"
            />
            <Text style={styles.hint}>Dica: Copie o link de uma imagem do Google ou Unsplash.</Text>

            <TouchableOpacity style={styles.btnConfirm} onPress={handleAddPhoto}>
              <Text style={styles.btnText}>Salvar Foto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{marginTop:15}}>
              <Text style={{color:'red', textAlign:'center'}}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth:1, borderColor:'#EEE' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  
  card: { alignItems: 'center', backgroundColor: '#FFF', padding: 20, marginBottom: 15, marginTop: 15 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FF6F00', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 28, color: '#FFF', fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  email: { color: '#666', marginBottom: 5 },
  tag: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tagText: { color: '#FF6F00', fontSize: 12, fontWeight: 'bold' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-evenly', padding: 20, backgroundColor: '#FFF', marginBottom: 15, marginHorizontal: 15, borderRadius: 10, elevation: 2 },
  statBox: { alignItems: 'center' },
  statLabel: { color: '#999', fontSize: 12, marginBottom: 5 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },

  // Portfólio Styles
  portfolioSection: { padding: 15, backgroundColor: '#FFF', marginBottom: 15 },
  portfolioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  btnAdd: { color: '#FF6F00', fontWeight: 'bold', fontSize: 16 },
  emptyText: { color: '#999', fontStyle: 'italic', textAlign: 'center', padding: 20 },
  
  photoContainer: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 8, overflow: 'hidden', backgroundColor: '#EEE' },
  photo: { width: '100%', height: '100%' },

  // Menu
  menu: { backgroundColor: '#FFF', paddingHorizontal: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#F0F0F0' },
  menuText: { flex: 1, marginLeft: 15, fontSize: 16, color: '#333' },

  // Modal
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', padding: 20 },
  modalContent: { backgroundColor:'#FFF', padding:20, borderRadius:15 },
  modalTitle: { fontSize:20, fontWeight:'bold', marginBottom:15, textAlign:'center' },
  input: { backgroundColor:'#F0F0F0', padding:12, borderRadius:8, marginBottom:10 },
  label: { fontWeight: 'bold', color:'#333', marginBottom:5 },
  hint: { fontSize:12, color:'#999', marginBottom:15 },
  btnConfirm: { backgroundColor:'#FF6F00', padding:15, borderRadius:10, alignItems:'center' },
  btnText: { color:'#FFF', fontWeight:'bold' }
});