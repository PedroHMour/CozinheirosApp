import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Este componente será carregado apenas quando o Expo tentar rodar na Web
export default function MyMap(props: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🗺️</Text>
      <Text style={styles.text}>O Mapa Interativo usa recursos nativos.</Text>
      <Text style={styles.subtext}>Disponível apenas no App Android/iOS.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 250,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
    marginBottom: 10,
  },
  text: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  }
});