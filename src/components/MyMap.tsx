import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface MyMapProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null;
}

export default function MyMap({ region }: MyMapProps) {
  if (!region) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" color="#FF6F00" />
        <Text style={{ marginTop: 10, color: '#666' }}>Carregando mapa...</Text>
      </View>
    );
  }

  // Criamos um HTML simples que carrega o Leaflet (Mapa Open Source)
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Inicia o mapa centrado na localização do usuário
          var map = L.map('map', { zoomControl: false }).setView([${region.latitude}, ${region.longitude}], 15);
          
          // Adiciona os "azulejos" do OpenStreetMap (Grátis)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(map);

          // Adiciona um ícone marcador
          L.marker([${region.latitude}, ${region.longitude}]).addTo(map)
            .bindPopup('Você está aqui!')
            .openPopup();
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        scrollEnabled={false} // Evita conflito de scroll com a página
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 250,
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE'
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0'
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  }
});