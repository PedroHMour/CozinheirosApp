import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { Colors, Shadows, Typography } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 40) / 3 - 10; 

export default function AccountScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newImageTitle, setNewImageTitle] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (user?.id) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const resStats = await fetch(`${API_URL}/users/${user?.id}/stats`);
      const jsonStats = await resStats.json();
      setStats(jsonStats.stats);

      if (user?.type === 'cook') {
        const resPort = await fetch(`${API_URL}/portfolio/${user.id}`);
        const jsonPort = await resPort.json();
        if (Array.isArray(jsonPort)) setPortfolio(jsonPort);
      }
    } catch (error) { console.log(error); } finally { setLoading(false); }
  };

  const handleAddPhoto = async () => {
    if (!newImageUrl) return Alert.alert("Ops", "Cole o link da imagem.");
    try {
      const res = await fetch(`${API_URL}/portfolio`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ chef_id: user?.id, image_url: newImageUrl, title: newImageTitle || "Prato do Chef" })
      });
      if (res.ok) {
        setModalVisible(false); setNewImageUrl(''); setNewImageTitle('');
        loadProfile();
        Alert.alert("Sucesso", "Adicionado ao portfólio!");
      }
    } catch (error) { Alert.alert("Erro", "Falha ao salvar."); }
  };

  const handleDeletePhoto = async (id: number) => {
    Alert.alert("Excluir", "Remover esta foto?", [
      { text: "Cancelar" },
      { text: "Excluir", style: 'destructive', onPress: async () => {
          await fetch(`${API_URL}/portfolio/${id}`, { method: 'DELETE' });
          loadProfile();
        }}
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza?", [
      { text: "Cancelar" },
      { text: "Sair", style: 'destructive', onPress: () => signOut() }
    ]);
  };

  if (loading || !user) return <ActivityIndicator size="large" color={Colors.light.primary} style={{flex:1}} />;

  const isCook = user.type === 'cook';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Cabeçalho de Perfil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={Typography.heading2}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{isCook ? 'Chef de Cozinha' : 'Cliente Vip'}</Text>
            </View>
          </View>
        </View>

        {/* Estatísticas */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {isCook ? `R$ ${parseFloat(stats.total_earnings || 0).toFixed(0)}` : stats.completed_orders}
              </Text>
              <Text style={styles.statLabel}>{isCook ? 'Ganhos' : 'Pedidos'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.completed_orders || 0}</Text>
              <Text style={styles.statLabel}>Serviços</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5.0</Text>
              <Text style={styles.statLabel}>Avaliação</Text>
            </View>
          </View>
        )}

        {/* Portfólio (Grid de Fotos) */}
        {isCook && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={Typography.heading3}>Meu Portfólio</Text>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Text style={styles.addText}>+ Adicionar</Text>
              </TouchableOpacity>
            </View>
            
            {portfolio.length === 0 ? (
              <View style={styles.emptyPortfolio}>
                <Ionicons name="images-outline" size={40} color="#DDD" />
                <Text style={styles.emptyText}>Adicione fotos dos seus pratos</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {portfolio.map((item) => (
                  <TouchableOpacity key={item.id} onLongPress={() => handleDeletePhoto(item.id)} style={styles.photoWrapper}>
                    <Image source={{ uri: item.image_url }} style={styles.photo} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Menu de Ações */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/activity')}>
            <View style={[styles.iconBox, {backgroundColor: '#E3F2FD'}]}>
              <Ionicons name="time" size={20} color="#2196F3" />
            </View>
            <Text style={styles.menuText}>Histórico de Atividades</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={[styles.iconBox, {backgroundColor: '#FFEBEE'}]}>
              <Ionicons name="log-out" size={20} color="#F44336" />
            </View>
            <Text style={[styles.menuText, {color: '#F44336'}]}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modal Adicionar Foto */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={Typography.heading3}>Novo Prato</Text>
            <TextInput style={styles.input} placeholder="Nome do Prato" value={newImageTitle} onChangeText={setNewImageTitle} />
            <TextInput style={styles.input} placeholder="URL da Imagem (https://...)" value={newImageUrl} onChangeText={setNewImageUrl} autoCapitalize="none"/>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddPhoto}>
              <Text style={styles.btnText}>Salvar Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{marginTop:15}}>
              <Text style={{color: Colors.light.error}}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  profileHeader: { padding: 25, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#F0F0F0' },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center', marginRight: 20, ...Shadows.medium },
  avatarText: { fontSize: 32, color: '#FFF', fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  email: { color: Colors.light.textSecondary, marginTop: 4, marginBottom: 8 },
  badge: { backgroundColor: Colors.light.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { color: Colors.light.primary, fontSize: 12, fontWeight: 'bold' },
  
  statsContainer: { flexDirection: 'row', backgroundColor: '#FFF', margin: 20, borderRadius: 15, padding: 20, justifyContent: 'space-around', ...Shadows.small },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  statDivider: { width: 1, height: '100%', backgroundColor: '#EEE' },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  addText: { color: Colors.light.primary, fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoWrapper: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 12, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  emptyPortfolio: { padding: 30, alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#DDD' },
  emptyText: { marginTop: 10, color: '#999' },

  menuSection: { paddingHorizontal: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, ...Shadows.small },
  iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#333' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 25, borderRadius: 20, alignItems: 'center' },
  input: { width: '100%', backgroundColor: '#F5F5F5', padding: 15, borderRadius: 12, marginTop: 15 },
  saveBtn: { width: '100%', backgroundColor: Colors.light.primary, padding: 15, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' }
});