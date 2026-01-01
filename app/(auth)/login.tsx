import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const { signIn, googleLogin, loading } = useAuth();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState<'client' | 'cook'>('client');

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert("Erro", "Preencha email e senha");
    if (isRegistering && !name) return Alert.alert("Erro", "Preencha seu nome");

    const res = await signIn(email, password, isRegistering, name, type);
    
    if (!res.success) {
      Alert.alert("Erro", res.error || "Falha na autenticação");
    }
  };

  const handleGoogle = async () => {
    // 1. Passamos isRegistering para o contexto saber a intenção
    const res = await googleLogin(type, isRegistering);
    
    if (!res.success) {
      Alert.alert("Erro", res.error || "Falha no Google Login");
      return;
    }

    // LÓGICA ANTI-BYPASS
    // Se o usuário estava tentando CADASTRAR, mas o login retornou sucesso...
    if (isRegistering && res.user) {
        const returnedType = res.user.type;
        
        // Verifica se o tipo retornado é diferente do tipo escolhido
        // Ex: Usuário escolheu 'cook', mas a conta já existia como 'client'
        if (returnedType && returnedType !== type) {
             Alert.alert(
                "Conta Existente", 
                `O e-mail ${res.user.email} já possui cadastro como ${returnedType === 'client' ? 'Cliente' : 'Cozinheiro'}. Realizamos seu login automaticamente.`
            );
        } else {
             // Se o tipo for igual ou nulo, mas era um cadastro e não houve erro,
             // podemos assumir que deu certo (criou novo ou logou no correto).
             // Opcional: Se quiser avisar que logou em vez de cadastrar:
             // Alert.alert("Atenção", "Você já possui conta. Login realizado.");
        }
    }
  };

  // ... (Restante do código de renderização permanece igual) ...
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <View style={[styles.header, isRegistering && styles.headerCompact]}>
          <Image source={require('../../assets/images/icon.png')} style={isRegistering ? styles.logoSmall : styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Chefe Local</Text>
          {!isRegistering && <Text style={styles.subtitle}>Comida caseira, feita por vizinhos.</Text>}
        </View>

        <View style={styles.form}>
          {isRegistering && (
            <TextInput 
              style={styles.input} 
              placeholder="Nome Completo" 
              placeholderTextColor="#999"
              value={name} onChangeText={setName} 
            />
          )}
          
          <TextInput 
            style={styles.input} 
            placeholder="E-mail" 
            placeholderTextColor="#999"
            keyboardType="email-address" 
            autoCapitalize="none" 
            value={email} onChangeText={setEmail} 
          />
          
          <TextInput 
            style={styles.input} 
            placeholder="Senha" 
            placeholderTextColor="#999"
            secureTextEntry 
            value={password} onChangeText={setPassword} 
          />

          {isRegistering && (
            <View style={styles.typeContainer}>
              <Text style={styles.label}>Quero ser:</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity 
                  style={[styles.typeBtn, type === 'client' && styles.typeBtnActive]} 
                  onPress={() => setType('client')}
                >
                  <Ionicons name="person" size={18} color={type === 'client' ? '#FFF' : '#666'} />
                  <Text style={[styles.typeText, type === 'client' && {color:'#FFF'}]}>Cliente</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, type === 'cook' && styles.typeBtnActive]} 
                  onPress={() => setType('cook')}
                >
                  <Ionicons name="restaurant" size={18} color={type === 'cook' ? '#FFF' : '#666'} />
                  <Text style={[styles.typeText, type === 'cook' && {color:'#FFF'}]}>Cozinheiro</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.btnPrimary} onPress={handleAuth} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <Text style={styles.btnText}>{isRegistering ? 'CRIAR CONTA' : 'ENTRAR'}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} /><Text style={styles.orText}>OU</Text><View style={styles.line} />
          </View>

          <TouchableOpacity style={styles.btnGoogle} onPress={handleGoogle} disabled={loading}>
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.btnGoogleText}>
              {isRegistering ? 'Cadastre-se com Google' : 'Entrar com Google'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchBtn} onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={styles.switchText}>
              {isRegistering ? 'Já tem conta? Fazer Login' : 'Criar nova conta'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: height * 0.05 },
  headerCompact: { marginBottom: 15, marginTop: 10 },
  logo: { width: 100, height: 100, marginBottom: 10 },
  logoSmall: { width: 60, height: 60, marginBottom: 5 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FF6F00' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 5 },
  form: { width: '100%' },
  input: { backgroundColor: '#F5F5F5', padding: 15, borderRadius: 12, marginBottom: 12, fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#EEE' },
  btnPrimary: { backgroundColor: '#FF6F00', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 5, elevation: 2 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  line: { flex: 1, height: 1, backgroundColor: '#EEE' },
  orText: { marginHorizontal: 10, color: '#999', fontWeight: 'bold', fontSize: 12 },
  btnGoogle: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DDD', elevation: 1 },
  btnGoogleText: { color: '#333', fontWeight: 'bold', marginLeft: 10 },
  switchBtn: { marginTop: 20, alignItems: 'center', padding: 10 },
  switchText: { color: '#FF6F00', fontWeight: '600' },
  typeContainer: { marginBottom: 15 },
  label: { marginBottom: 8, color: '#666', fontWeight:'600' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#EEE', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5, backgroundColor:'#F9F9F9' },
  typeBtnActive: { backgroundColor: '#FF6F00', borderColor: '#FF6F00' },
  typeText: { fontWeight: '600', color: '#666', fontSize: 14 }
});