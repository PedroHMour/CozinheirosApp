import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';

// --- BIBLIOTECA NATIVA DO GOOGLE ---
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// --- IMPORTS DO FIREBASE ---
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  User
} from 'firebase/auth';
import { auth } from '../firebaseConfig';

// --- NOVOS IMPORTS (NAVEGAÇÃO E CONTEXTO) ---
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

// Habilita animações no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- CONFIGURAÇÃO DO BACKEND (RAILWAY) ---
const API_URL = 'https://backend-api-production-29fe.up.railway.app'; 

export default function HomeScreen() {
  // --- HOOKS DE NAVEGAÇÃO E AUTENTICAÇÃO ---
  const router = useRouter();
  const { signIn } = useAuth(); 

  const [isLogin, setIsLogin] = useState(true);
  const [showManual, setShowManual] = useState(false); // Controla se mostra o login manual
  const [isLoading, setIsLoading] = useState(false);
  
  // Dados do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<'client' | 'cook'>('client');

  // --- 1. CONFIGURAÇÃO INICIAL DO GOOGLE ---
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '387721210844-v43kneclhqelp9lkre8pmb6ag89r280r.apps.googleusercontent.com', 
      offlineAccess: true,
    });
  }, []);

  // --- 2. FUNÇÃO DIAGNÓSTICA (RAILWAY) ---
  const syncUserWithBackend = async (user: User, type: string, nome?: string) => {
    try {
      console.log("🔄 [RAILWAY] Iniciando sincronia...");
      const token = await user.getIdToken(); 

      const payload = {
        token: token, 
        email: user.email,
        firebaseId: user.uid,
        name: nome || user.displayName || 'Usuário',
        type: type, 
        photo: user.photoURL
      };

      console.log("📦 [RAILWAY] Enviando Payload:", JSON.stringify(payload));

      const res = await fetch(`${API_URL}/auth/googleLogin`, { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (res.ok) {
        console.log("✅ [RAILWAY] Sucesso! Resposta:", data);
        
        // --- ATUALIZAÇÃO CRÍTICA AQUI ---
        // 1. Atualiza o contexto global (para o _layout saber que logou)
        if (signIn) {
            signIn(data.user);
        }

        // 2. Navega para a área interna (Tabs)
        router.replace('/(tabs)'); 
        
      } else {
        console.error("⚠️ [RAILWAY] Erro API:", res.status);
        console.error("⚠️ [RAILWAY] Detalhes:", JSON.stringify(data, null, 2));
        Alert.alert("Atenção", `Erro no servidor: ${data.error || 'Verifique o terminal'}`);
      }
    } catch (error) {
      console.error("❌ [RAILWAY] Erro de Conexão:", error);
      Alert.alert("Erro", "Falha ao conectar com o Railway.");
    }
  };

  // --- 3. LOGIN GOOGLE NATIVO ---
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('Token Google não recebido.');

      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);

      console.log("✅ [FIREBASE] Logado como:", userCredential.user.email);
      
      // Manda para o Railway
      await syncUserWithBackend(userCredential.user, 'client');

    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Cancelado pelo usuário');
      } else {
        console.error("❌ Erro Google:", error);
        Alert.alert("Erro", "Falha no Login Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. LOGIN MANUAL ---
  const handleManualAction = async () => {
    if (!email || !password) return Alert.alert("Atenção", "Preencha e-mail e senha.");
    setIsLoading(true);
    try {
      let userCred;
      if (isLogin) {
        userCred = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
      }
      console.log("✅ [FIREBASE] Manual Sucesso");
      await syncUserWithBackend(userCred.user, userType, name);
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para alternar visualização com animação
  const toggleManualLogin = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowManual(!showManual);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* CABEÇALHO */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="restaurant" size={50} color="#FFF" />
          </View>
          <Text style={styles.title}>Chefe Local</Text>
          <Text style={styles.subtitle}>Alta gastronomia na sua casa</Text>
        </View>

        <View style={styles.form}>
          {/* BOTÃO GOOGLE (DESTAQUE) */}
          <TouchableOpacity style={styles.googleBtn} disabled={isLoading} onPress={handleGoogleLogin}>
            {isLoading && !showManual ? <ActivityIndicator color="#333"/> : (
              <>
                <Ionicons name="logo-google" size={24} color="black" style={{marginRight: 10}} />
                <Text style={styles.googleText}>Entrar com Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* DIVISOR OU BOTÃO DE EXPANDIR */}
          <TouchableOpacity onPress={toggleManualLogin} style={styles.expandButton}>
            <Text style={styles.expandText}>
              {showManual ? 'Ocultar opções de e-mail' : 'Ou entrar com e-mail'}
            </Text>
            <Ionicons name={showManual ? "chevron-up" : "chevron-down"} size={16} color="#666" />
          </TouchableOpacity>

          {/* ÁREA DE LOGIN MANUAL (ESCONDIDA POR PADRÃO) */}
          {showManual && (
            <View style={styles.manualContainer}>
              {!isLogin && (
                <View style={styles.typeRow}>
                    <TouchableOpacity onPress={() => setUserType('client')} style={[styles.typeBtn, userType==='client' && styles.typeActive]}><Text style={[styles.typeText, userType==='client' && styles.typeTextActive]}>Sou Cliente</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setUserType('cook')} style={[styles.typeBtn, userType==='cook' && styles.typeActive]}><Text style={[styles.typeText, userType==='cook' && styles.typeTextActive]}>Sou Chef</Text></TouchableOpacity>
                </View>
              )}
              
              {!isLogin && <TextInput style={styles.input} placeholder="Nome Completo" value={name} onChangeText={setName} />}
              <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <TextInput style={styles.input} placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry />

              <TouchableOpacity style={styles.actionButton} onPress={handleManualAction} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#FFF" /> : (
                  <Text style={styles.actionButtonText}>{isLogin ? 'Confirmar' : 'Cadastrar'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.switchBtn} onPress={() => setIsLogin(!isLogin)}>
                <Text style={styles.switchText}>
                  {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  iconContainer: { 
    backgroundColor: '#FF6F00', 
    padding: 15, 
    borderRadius: 50, 
    marginBottom: 10,
    elevation: 5
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333' },
  subtitle: { color: '#666', marginTop: 5, fontSize: 16 },
  
  form: { width: '100%' },
  
  googleBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#FFF', 
    padding: 18, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#DDD', 
    marginBottom: 15,
    elevation: 2 
  },
  googleText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10
  },
  expandText: { color: '#666', marginRight: 5, fontSize: 14 },
  
  manualContainer: {
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth:1, borderColor:'#E0E0E0', fontSize: 16 },
  actionButton: { backgroundColor: '#FF6F00', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  switchBtn: { marginTop: 15, alignItems: 'center' },
  switchText: { color: '#FF6F00', fontWeight: '600' },
  
  typeRow: { flexDirection: 'row', marginBottom: 15, gap: 10 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', alignItems: 'center', backgroundColor: '#FFF' },
  typeActive: { backgroundColor: '#FF6F00', borderColor: '#FF6F00' },
  typeText: { color: '#333' },
  typeTextActive: { color: '#FFF', fontWeight: 'bold' },
});