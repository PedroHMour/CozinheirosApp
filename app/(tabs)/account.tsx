import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
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

const { width } = Dimensions.get('window');
const PHOTO_SIZE = width / 3 - 10; 

export default function AccountScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newImageTitle, setNewImageTitle] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  // 1. CORREÇÃO: Envolvemos a função em useCallback para o useEffect aceitá-la
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const resStats = await fetch(`${API_URL}/users/${user.id}/stats`);
      const jsonStats = await resStats.json();
      setStats(jsonStats.stats || {}); 

      if (user.type === 'cook') {
        const resPort = await fetch(`${API_URL}/portfolio/${user.id}`);
        const jsonPort = await resPort.json();
        if (Array.isArray(jsonPort)) setPortfolio(jsonPort);
      }
    } catch (error) {
      console.log("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 2. CORREÇÃO: Agora as dependências estão corretas
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleDeleteAccount = async () => {
    Alert.alert(
      "EXCLUIR CONTA ⚠️", 
      "Tem certeza absoluta? Isso apagará seus dados permanentemente.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "SIM, EXCLUIR", 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await fetch(`${API_URL}/users/${user?.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
              });

              if (res.ok) {
                Alert.alert("Conta Excluída", "Seus dados foram removidos.");
                await signOut(); 
              } else {
                Alert.alert("Erro", "Não foi possível excluir a conta no servidor.");
              }
            } catch (error) {
              // 3. CORREÇÃO: Agora usamos a variável error (no console) ou removemos ela
              console.error(error);
              Alert.alert("Erro", "Falha de conexão.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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
        loadProfile(); 
        Alert.alert("Sucesso", "Prato adicionado ao portfólio!");
      }
    } catch (error) {
      // Usando error para satisfazer o linter
      console.log(error);
      Alert.alert("Erro", "Falha ao salvar foto.");
    }
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza?", [
      { text: "Cancelar" },
      { text: "Sair", onPress: () => signOut() }
    ]);
  };

  if (loading || !user) return <ActivityIndicator size="large" color="#FF6F00" style={{flex:1}} />;

  const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
  const isCook = user.type === 'cook';

  const renderPhoto = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.photoContainer}>
      <Image source={{ uri: item.image_url }} style={styles.photo} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Minha Conta</Text>
        </View>

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

        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{isCook ? 'Ganhos' : 'Pedidos'}</Text>
              <Text style={[styles.statValue, {color: 'green'}]}>
                {isCook ? `R$ ${parseFloat(stats.total_earnings || 0).toFixed(2)}` : stats.completed_orders || 0}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Serviços</Text>
              <Text style={styles.statValue}>{stats.completed_orders || 0}</Text>
            </View>
          </View>
        )}

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
                scrollEnabled={false}
                columnWrapperStyle={{ gap: 10 }}
                contentContainerStyle={{ gap: 10 }}
              />
            )}
          </View>
        )}

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/activity')}>
            <Ionicons name="time-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Histórico</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Sair da Conta</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={24} color="red" />
            <Text style={[styles.menuText, {color:'red', fontWeight:'bold'}]}>Excluir Minha Conta</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Prato</Text>
            <Text style={styles.label}>Título</Text>
            <TextInput style={styles.input} placeholder="Ex: Risoto" value={newImageTitle} onChangeText={setNewImageTitle} />
            <Text style={styles.label}>Link da Imagem</Text>
            <TextInput style={styles.input} placeholder="https://..." value={newImageUrl} onChangeText={setNewImageUrl} autoCapitalize="none"/>
            <TouchableOpacity style={styles.btnConfirm} onPress={handleAddPhoto}>
              <Text style={styles.btnText}>Salvar</Text>
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
  portfolioSection: { padding: 15, backgroundColor: '#FFF', marginBottom: 15 },
  portfolioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  btnAdd: { color: '#FF6F00', fontWeight: 'bold', fontSize: 16 },
  emptyText: { color: '#999', fontStyle: 'italic', textAlign: 'center', padding: 20 },
  photoContainer: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 8, overflow: 'hidden', backgroundColor: '#EEE' },
  photo: { width: '100%', height: '100%' },
  menu: { backgroundColor: '#FFF', paddingHorizontal: 20, marginTop: 10, marginBottom: 30 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#F0F0F0' },
  menuText: { flex: 1, marginLeft: 15, fontSize: 16, color: '#333' },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', padding: 20 },
  modalContent: { backgroundColor:'#FFF', padding:20, borderRadius:15 },
  modalTitle: { fontSize:20, fontWeight:'bold', marginBottom:15, textAlign:'center' },
  input: { backgroundColor:'#F0F0F0', padding:12, borderRadius:8, marginBottom:10 },
  label: { fontWeight: 'bold', color:'#333', marginBottom:5 },
  btnConfirm: { backgroundColor:'#FF6F00', padding:15, borderRadius:10, alignItems:'center' },
  btnText: { color:'#FFF', fontWeight:'bold' }
});