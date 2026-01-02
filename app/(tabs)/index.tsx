import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';
// Certifica-te que estes ficheiros existem na pasta src
import { PACKAGES } from '../../src/constants/packages';
import { Colors, Shadows, Typography } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';

// HTML para o mapa Leaflet (gratuito e leve)
const generateMapHTML = (lat: number, lon: number) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style> 
        body { margin: 0; } 
        #map { width: 100%; height: 100vh; } 
        .custom-div-icon { background:transparent; border:none; }
      </style>
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
        L.marker([${lat}, ${lon}], {icon: icon}).addTo(map);
      </script>
    </body>
  </html>
`;

export default function ClientHome() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [location, setLocation] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Estados do formulário
  const [description, setDescription] = useState('');
  const [peopleCount, setPeopleCount] = useState('');

  // 1. Pega a localização ao abrir
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
          Alert.alert("Permissão negada", "Precisamos da sua localização para encontrar chefs.");
          return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  // 2. Lógica de seleção do pacote
  const handleSelectPackage = (pkg: any) => {
    if (!description.trim()) {
        return Alert.alert("Falta o prato", "Por favor, diga o que gostaria de comer.");
    }
    if (!peopleCount.trim()) {
        return Alert.alert("Falta a quantidade", "Para quantas pessoas será o serviço?");
    }

    setModalVisible(false);

    // Navega para a tela de pagamento enviando TODOS os dados necessários
    router.push({
        pathname: '/payment',
        params: {
            package_id: pkg.id,
            price: pkg.price.toString(),
            dish: description,
            people: peopleCount,
            client_id: user?.id,
            latitude: location?.latitude,
            longitude: location?.longitude
        }
    });
  };

  if (!location) {
      return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6F00" />
            <Text style={{marginTop: 10, color: '#666'}}>Localizando chefs próximos...</Text>
        </View>
      );
  }

  return (
    <View style={styles.container}>
      {/* Mapa de Fundo */}
      <View style={styles.mapContainer}>
         <WebView 
            source={{ html: generateMapHTML(location.latitude, location.longitude) }} 
            style={{flex:1}} 
            scrollEnabled={false} 
         />
      </View>

      {/* Botão Inferior "Pedir um Chef" */}
      <View style={styles.bottomSheetWrapper}>
        <View style={styles.bottomSheet}>
           <Text style={Typography.subHeader}>O que vamos comer hoje?</Text>
           <TouchableOpacity style={styles.btnCall} onPress={() => setModalVisible(true)}>
              <Text style={styles.btnCallText}>PEDIR UM CHEF</Text>
           </TouchableOpacity>
        </View>
      </View>

      {/* Modal de Preenchimento e Escolha de Pacote */}
      <Modal visible={modalVisible} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={Typography.subHeader}>Detalhes do Pedido</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>O que gostaria de comer?</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Ex: Churrasco, Feijoada, Jantar Romântico..." 
                    value={description}
                    onChangeText={setDescription}
                />

                <Text style={styles.label}>Para quantas pessoas?</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Ex: 4" 
                    keyboardType="numeric"
                    value={peopleCount}
                    onChangeText={setPeopleCount}
                />

                <Text style={[Typography.subHeader, {marginTop: 15, marginBottom: 10}]}>Escolha o Nível:</Text>
                
                <FlatList
                    data={PACKAGES}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{paddingRight: 20}}
                    renderItem={({item}) => (
                        <TouchableOpacity style={styles.packageCard} onPress={() => handleSelectPackage(item)}>
                            <View style={styles.cardHeader}>
                                <View style={styles.priceTag}>
                                    <Text style={styles.priceText}>R$ {item.price}</Text>
                                </View>
                            </View>
                            <View>
                                <Text style={styles.pkgTitle}>{item.label}</Text>
                                <Text style={styles.pkgDesc} numberOfLines={3}>{item.description}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>
         </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapContainer: { ...StyleSheet.absoluteFillObject },
  
  bottomSheetWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  bottomSheet: { 
      backgroundColor: '#FFF', padding: 25, 
      borderTopLeftRadius: 25, borderTopRightRadius: 25, 
      ...Shadows.float 
  },
  
  btnCall: { 
      backgroundColor: Colors.light.primary, padding: 18, 
      borderRadius: 12, alignItems: 'center', marginTop: 15 
  },
  btnCallText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { 
      backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, 
      padding: 20, height: '75%' 
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  
  label: { fontWeight: '600', color: '#333', marginBottom: 5 },
  input: { 
      backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, 
      fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' 
  },
  
  packageCard: { 
      width: 150, height: 170, backgroundColor: '#FFF', 
      borderRadius: 12, padding: 12, marginRight: 15, 
      borderWidth: 1, borderColor: '#EEE', ...Shadows.soft, 
      justifyContent: 'space-between' 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'flex-start' },
  priceTag: { backgroundColor: '#E8F5E9', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
  priceText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 14 },
  pkgTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 5 },
  pkgDesc: { fontSize: 11, color: '#666', marginTop: 2 }
});