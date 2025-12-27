import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/services/api';

const generateMapHTML = (lat: number, lon: number) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style> body { margin: 0; } #map { width: 100%; height: 100vh; } </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {zoomControl: false, attributionControl: false}).setView([${lat}, ${lon}], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
        var icon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#FF6F00; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow:0 0 5px rgba(0,0,0,0.5);'></div>",
            iconSize: [15, 15],
            iconAnchor: [7, 7]
        });
        L.marker([${lat}, ${lon}], {icon: icon}).addTo(map).bindPopup('<b>Você está aqui</b>').openPopup();
      </script>
    </body>
  </html>
`;

export default function ClientHome() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [location, setLocation] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [description, setDescription] = useState('');
  const [peopleCount, setPeopleCount] = useState('');
  const [offerPrice, setOfferPrice] = useState('');

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  const handleCreateBroadcast = async () => {
    if (!description || !offerPrice || !peopleCount) {
        return Alert.alert("Campos Vazios", "Preencha todos os campos.");
    }
    setLoading(true);
    try {
        await api.post('/requests/broadcast', {
            client_id: user?.id,
            description: description,
            people_count: parseInt(peopleCount),
            price: parseFloat(offerPrice.replace(',', '.')),
            latitude: location?.latitude || 0,
            longitude: location?.longitude || 0
        });
        setModalVisible(false);
        setDescription('');
        setPeopleCount('');
        setOfferPrice('');
        Alert.alert("Sucesso", "Pedido enviado! Aguarde as ofertas.");
        router.push('/(tabs)/activity'); 
    } catch {
        Alert.alert("Erro", "Falha ao criar chamado.");
    } finally {
        setLoading(false);
    }
  };

  if (!location) {
      return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6F00" />
            <Text style={styles.loadingText}>Localizando...</Text>
        </View>
      );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
         <WebView source={{ html: generateMapHTML(location.latitude, location.longitude) }} style={{flex:1}} scrollEnabled={false} />
      </View>

      <SafeAreaView style={styles.headerContainer} edges={['top']}>
          <View style={styles.searchBar}>
              <View style={styles.dot} />
              <Text style={styles.addressText}>Sua localização atual</Text>
          </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.bottomSheetWrapper}>
        <View style={styles.bottomSheet}>
           <Text style={styles.callText}>O que vamos comer hoje?</Text>
           <TouchableOpacity style={styles.btnCall} onPress={() => setModalVisible(true)}>
              <Text style={styles.btnCallText}>SOLICITAR UM CHEF</Text>
           </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={modalVisible} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ width: '100%' }}
            >
                <View style={styles.modalContent}>
                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Novo Pedido</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>Preencha os dados para os chefs verem.</Text>

                        <Text style={styles.label}>O que você precisa?</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Ex: Almoço, Churrasco..." 
                            value={description}
                            onChangeText={setDescription}
                        />

                        <View style={styles.row}>
                            <View style={{flex: 1, marginRight: 10}}>
                                <Text style={styles.label}>Pessoas</Text>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="Ex: 4" 
                                    keyboardType="numeric"
                                    value={peopleCount}
                                    onChangeText={setPeopleCount}
                                />
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={styles.label}>Sua Oferta (R$)</Text>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="Ex: 150.00" 
                                    keyboardType="numeric"
                                    value={offerPrice}
                                    onChangeText={setOfferPrice}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.btnConfirm} onPress={handleCreateBroadcast} disabled={loading}>
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnConfirmText}>ENVIAR PEDIDO</Text>}
                        </TouchableOpacity>
                        <View style={{height: 20}} />
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
         </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },
  mapContainer: { ...StyleSheet.absoluteFillObject },
  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, padding: 20, alignItems: 'center' },
  searchBar: { backgroundColor: '#FFF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, flexDirection: 'row', alignItems: 'center', elevation: 5, width: '90%' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50', marginRight: 10 },
  addressText: { fontWeight: '600', color: '#333' },
  bottomSheetWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  bottomSheet: { backgroundColor: '#FFF', padding: 25, borderTopLeftRadius: 25, borderTopRightRadius: 25, elevation: 10, paddingBottom: Platform.OS === 'ios' ? 40 : 25 },
  callText: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  btnCall: { backgroundColor: '#FF6F00', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnCallText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, paddingBottom: 40 }, 
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalSubtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  closeBtn: { padding: 5 },
  label: { fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#F5F5F5', padding: 15, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#EEE' },
  row: { flexDirection: 'row', marginBottom: 20 },
  btnConfirm: { backgroundColor: '#2196F3', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnConfirmText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});