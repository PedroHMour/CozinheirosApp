import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Este componente será carregado apenas quando o Expo tentar rodar na Web/Verificação
export default function MyMap(props: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🗺️</Text>
      <Text style={styles.text}>O Mapa Interativo só funciona no App (Android/iOS).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    minHeight: 300,
  },
  text: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  }
});