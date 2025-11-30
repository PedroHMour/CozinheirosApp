import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function MyMap({ region }) {
  // Se por acaso a região não estiver carregada, não mostra nada para não dar erro
  if (!region) return null;

  return (
    <MapView 
      style={styles.map} 
      region={region} 
      showsUserLocation={true}
    >
      {/* Exemplo de marcador (aqui entra a Chef Maria) */}
      <Marker
        coordinate={{
          latitude: region.latitude + 0.002,
          longitude: region.longitude + 0.002,
        }}
        title="Chef Maria"
        description="Cozinheira Destaque"
      >
        <View style={styles.markerContainer}>
          <Ionicons name="restaurant" size={20} color="#FFF" />
        </View>
      </Marker>
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  markerContainer: {
    backgroundColor: '#FF6F00',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF',
  },
});