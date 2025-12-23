import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const SPACING = 10;

interface Chef {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  gender?: string;
  is_premium?: boolean;
  photo?: string;
  specialty?: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth(); // Removi signOut daqui
  const webViewRef = useRef<WebView>(null);
  const flatListRef = useRef<FlatList>(null);

  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<any>(null);
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [searchText, setSearchText] = useState('');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [dish, setDish] = useState('');
  const [price, setPrice] = useState('');

  // --- HTML DO MAPA ---
  const generateMapHTML = (chefsList: Chef[], userLat: number, userLon: number) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; background-color: #f0f0f0; touch-action: none; } 
        #map { width: 100%; height: 100vh; }
        .chef-marker-icon {
          border-radius: 50%;
          border: 3px solid #FFF;
          box-shadow: 0 4px 8px rgba(0,0,0,0.4);
          background: #FFF;
        }
        .premium-glow {
          box-shadow: 0 0 15px #FFD700;
          border: 3px solid #FFD700;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false, dragging: true, tap: true }).setView([${userLat}, ${userLon}], 15);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '',
          maxZoom: 19
        }).addTo(map);

        var iconClient = 'https://cdn-icons-png.flaticon.com/512/9308/9308339.png'; 
        var iconChefNormal = 'https://cdn-icons-png.flaticon.com/512/3461/3461974.png';
        var iconChefPremium = 'https://cdn-icons-png.flaticon.com/512/1995/1995515.png'; 

        var userIcon = L.icon({ iconUrl: iconClient, iconSize: [40, 40], iconAnchor: [20, 20], className: 'chef-marker-icon' });
        L.marker([${userLat}, ${userLon}], {icon: userIcon}).addTo(map);

        var chefs = ${JSON.stringify(chefsList)};
        
        chefs.forEach(function(chef, index) {
          var isPremium = chef.is_premium;
          var imgUrl = isPremium ? iconChefPremium : iconChefNormal;
          var cssClass = isPremium ? 'chef-marker-icon premium-glow' : 'chef-marker-icon';

          var chefIcon = L.icon({ iconUrl: imgUrl, iconSize: [45, 45], iconAnchor: [22, 22], className: cssClass });
          var marker = L.marker([chef.latitude, chef.longitude], {icon: chefIcon}).addTo(map);
          
          marker.on('click', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', index: index, id: chef.id }));
          });
        });

        function flyToLocation(lat, lon) {
          map.flyTo([lat, lon], 16, { duration: 1.0 });
        }
      </script>
    </body>
    </html>
  `;

  // --- LÓGICA ---
  const fetchChefs = useCallback(async () => {
    try {
        const res = await api.get('/chefs').catch(() => []);
        if(Array.isArray(res) && res.length > 0) setChefs(res);
        else setChefs([
            { id: 991, name: "Maria Massas", latitude: -23.55052, longitude: -46.633308, specialty: "Italiana", is_premium: true, gender: 'female' },
            { id: 992, name: "João Burguer", latitude: -23.55552, longitude: -46.638308, specialty: "Hamburguer", is_premium: false, gender: 'male' },
        ]);
    } catch {}
  }, []);

  const loadLocationAndData = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
          setRegion({ latitude: -23.55052, longitude: -46.633308 });
          setLoading(false);
          return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setRegion({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      await fetchChefs();
    } catch {
      setRegion({ latitude: -23.55052, longitude: -46.633308 });
    } finally {
      setLoading(false);
    }
  }, [fetchChefs]);

  useEffect(() => { loadLocationAndData(); }, [loadLocationAndData]);
  useEffect(() => { if (!user) router.replace('/'); }, [user, router]);

  const handleWebViewMessage = (event: any) => {
    try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'markerClick') {
            flatListRef.current?.scrollToIndex({ index: data.index, animated: true });
        }
    } catch {}
  };

  const handleRequest = () => {
    if(!dish || !price) return Alert.alert("Atenção", "Preencha os campos.");
    setModalVisible(false);
    router.push({ pathname: '/payment', params: { dish, price, client_id: user?.id, latitude: region?.latitude, longitude: region?.longitude } });
  };

  if (loading || !region) {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6F00" />
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      {/* 1. MAPA */}
      <View style={styles.mapContainer}>
        <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: generateMapHTML(chefs, region.latitude, region.longitude) }}
            style={{ flex: 1 }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
        />
      </View>

      {/* 2. HEADER */}
      <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
          <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#FF6F00" />
              <TextInput 
                  placeholder="Buscar prato ou chef..." 
                  placeholderTextColor="#888"
                  style={styles.inputSearch}
                  value={searchText}
                  onChangeText={setSearchText}
              />
              <TouchableOpacity onPress={() => router.push('/(tabs)/account')}>
                 <View style={styles.avatar}>
                    <Text style={{color:'#FFF', fontWeight:'bold'}}>{user?.name?.charAt(0) || 'U'}</Text>
                 </View>
              </TouchableOpacity>
          </View>
      </SafeAreaView>

      {/* 3. BOTÃO DE PEDIDO (Agora ÚNICO botão flutuante) */}
      <View style={styles.fabContainer} pointerEvents="box-none">
         <TouchableOpacity style={styles.fabPrimary} onPress={() => setModalVisible(true)}>
            <Ionicons name="restaurant" size={24} color="#FFF" />
            <Text style={styles.fabText}>PEDIR AGORA</Text>
         </TouchableOpacity>
      </View>

      {/* 4. CARROSSEL */}
      <View style={styles.carouselWrapper} pointerEvents="box-none">
          <Animated.FlatList
            ref={flatListRef}
            data={chefs}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled={false}
            snapToInterval={CARD_WIDTH + SPACING * 2}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContainer}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
                <TouchableOpacity 
                    style={styles.card} 
                    activeOpacity={0.9}
                    onPress={() => router.push({ pathname: '/chat', params: { orderId: item.id } })}
                >
                    <View style={styles.cardContent}>
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardTitle}>{item.name}</Text>
                            <Text style={styles.cardSpecialty}>🍴 {item.specialty || 'Comida Caseira'}</Text>
                        </View>
                        <Ionicons name="chevron-forward-circle" size={35} color="#FF6F00" />
                    </View>
                </TouchableOpacity>
            )}
          />
      </View>

      {/* 5. MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>O que vamos comer?</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}>
                 <Ionicons name="close-circle" size={30} color="#DDD" />
               </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Nome do Prato" value={dish} onChangeText={setDish} />
            <TextInput style={styles.input} placeholder="Valor (R$)" keyboardType="numeric" value={price} onChangeText={setPrice} />
            <TouchableOpacity style={styles.btnConfirm} onPress={handleRequest}>
              <Text style={styles.btnConfirmText}>ENCONTRAR CHEF</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  loadingContainer: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#F5F5F5' },
  mapContainer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  
  headerContainer: { position: 'absolute', top: 40, left: 20, right: 20, zIndex: 10 },
  searchBar: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 15, padding: 12, alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6 },
  inputSearch: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333' },
  avatar: { width: 35, height: 35, borderRadius: 18, backgroundColor: '#FF6F00', justifyContent:'center', alignItems:'center' },

  fabContainer: { position: 'absolute', bottom: 160, right: 20, alignItems: 'flex-end', zIndex: 10 },
  fabPrimary: { flexDirection: 'row', backgroundColor: '#FF6F00', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, alignItems: 'center', elevation: 6 },
  fabText: { color: '#FFF', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },

  carouselWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, zIndex: 10 },
  carouselContainer: { paddingHorizontal: 10, paddingBottom: 30, paddingTop: 10 },
  card: { backgroundColor: '#FFF', width: CARD_WIDTH, height: 100, borderRadius: 20, marginHorizontal: SPACING, padding: 15, elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8 },
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent:'space-between', height: '100%' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardSpecialty: { color: '#666', fontSize: 14, marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  input: { backgroundColor: '#F9F9F9', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#EEE', color: '#333', marginBottom: 15 },
  btnConfirm: { backgroundColor: '#FF6F00', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  btnConfirmText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});