import React from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
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

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          /* Garante que o mapa ocupe 100% do espaço da WebView */
          body, html { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
          #map { height: 100%; width: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Inicia o mapa
          var map = L.map('map', { 
            zoomControl: false, // Remove botões de zoom para ficar mais limpo
            attributionControl: false // Remove o rodapé de direitos autorais para ganhar espaço
          }).setView([${region.latitude}, ${region.longitude}], 15);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(map);

          L.marker([${region.latitude}, ${region.longitude}]).addTo(map)
            .bindPopup('<b>Você está aqui</b>')
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
        style={styles.webView}
        // ATENÇÃO: Mudamos para TRUE ou removemos para permitir interação
        scrollEnabled={true} 
        // No Android, nestedScrollEnabled ajuda se estiver dentro de outro ScrollView
        nestedScrollEnabled={true}
      />
      {/* Camada transparente para capturar toques se necessário, 
          mas vamos tentar deixar a WebView lidar com isso direto */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300, // Aumentei um pouco para ficar melhor de mexer
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    marginTop: 10, // Adicionei margem no topo para não colar no header
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
  webView: {
    flex: 1,
    backgroundColor: 'transparent'
  }
});