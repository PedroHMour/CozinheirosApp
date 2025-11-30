import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OptionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Opções e Configurações</Text>
      <Text style={styles.subtext}>(Em breve: Cupons, Ajuda, etc)</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  text: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  subtext: { color: '#999', marginTop: 10 }
});