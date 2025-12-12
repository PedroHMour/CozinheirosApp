import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StatusBar,
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

// --- ROTEAMENTO E CONTEXTO ---
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

// Habilita animações no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const API_URL = 'https://backend-api-production-29fe.up.railway.app';
const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  // Estado para alternar entre Login (Entrar) e Register (Cadastrar)
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<'client' | 'cook'>('client');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '387721210844-v43kneclhqelp9lkre8pmb6ag89r280r.apps.googleusercontent.com', 
      offlineAccess: true,
    });
  }, []);

  // --- LÓGICA DE BACKEND (INTACTA) ---
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
        console.log("✅ [RAILWAY] Sucesso!");
        if (signIn) signIn(data.user);
        router.replace('/(tabs)'); 
      } else {
        Alert.alert("Atenção", `Erro no servidor: ${data.error || 'Tente novamente.'}`);
      }
    } catch (error) {
      Alert.alert("Erro", "Falha de conexão com o servidor.");
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('Token Google não recebido.');

      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      
      // Se for Google, assumimos Cliente por padrão, ou podemos perguntar depois
      await syncUserWithBackend(userCredential.user, 'client');
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert("Erro", "Falha no Login Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualAction = async () => {
    if (!email || !password) return Alert.alert("Ops!", "Preencha e-mail e senha.");
    if (isRegistering && !name) return Alert.alert("Ops!", "Preencha seu nome.");
    
    setIsLoading(true);
    try {
      let userCred;
      if (!isRegistering) {
        // LOGIN
        userCred = await signInWithEmailAndPassword(auth, email, password);
      } else {
        // CADASTRO
        userCred = await createUserWithEmailAndPassword(auth, email, password);
      }
      await syncUserWithBackend(userCred.user, userType, name);
    } catch (error: any) {
      let msg = "Ocorreu um erro.";
      if (error.code === 'auth/invalid-credential') msg = "E-mail ou senha incorretos.";
      if (error.code === 'auth/email-already-in-use') msg = "Este e-mail já está cadastrado.";
      if (error.code === 'auth/weak-password') msg = "A senha deve ter pelo menos 6 caracteres.";
      Alert.alert("Erro", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsRegistering(!isRegistering);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. CABEÇALHO LIMPO */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="restaurant" size={40} color="#FFF" />
          </View>
          <Text style={styles.appTitle}>Chefe Local</Text>
          <Text style={styles.appSubtitle}>
            {isRegistering ? 'Crie sua conta e comece agora' : 'Bem-vindo de volta!'}
          </Text>
        </View>

        {/* 2. CARD DO FORMULÁRIO */}
        <View style={styles.formCard}>
          
          {/* BOTÃO GOOGLE */}
          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} disabled={isLoading}>
            {isLoading && !email ? (
               <ActivityIndicator color="#333" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#DB4437" style={{marginRight: 10}} />
                <Text style={styles.googleText}>Continuar com Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>ou use e-mail</Text>
            <View style={styles.line} />
          </View>

          {/* SELETOR DE TIPO (SÓ NO CADASTRO) */}
          {isRegistering && (
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeOption, userType === 'client' && styles.typeSelected]}
                onPress={() => setUserType('client')}
              >
                <Text style={[styles.typeText, userType === 'client' && styles.typeTextSelected]}>Cliente</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeOption, userType === 'cook' && styles.typeSelected]}
                onPress={() => setUserType('cook')}
              >
                <Text style={[styles.typeText, userType === 'cook' && styles.typeTextSelected]}>Sou Chef</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* INPUTS */}
          <View style={styles.inputsContainer}>
            {isRegistering && (
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Nome Completo" 
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#AAA"
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Seu E-mail" 
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#AAA"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Sua Senha" 
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#AAA"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </View>

          {/* BOTÃO DE AÇÃO PRINCIPAL */}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleManualAction} disabled={isLoading}>
            {isLoading && email ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {isRegistering ? 'Criar Conta' : 'Entrar'}
              </Text>
            )}
          </TouchableOpacity>

        </View>

        {/* 3. RODAPÉ (TROCAR MODO) */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
          </Text>
          <TouchableOpacity onPress={toggleMode}>
            <Text style={styles.linkText}>
              {isRegistering ? ' Faça Login' : ' Cadastre-se'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  
  header: { alignItems: 'center', marginBottom: 30 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FF6F00',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 15,
    elevation: 8, shadowColor: '#FF6F00', shadowOpacity: 0.3, shadowRadius: 10
  },
  appTitle: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 5 },
  appSubtitle: { fontSize: 16, color: '#666', textAlign: 'center' },

  formCard: { width: '100%' },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1, borderColor: '#EEE',
    elevation: 2, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity:0.05,
    marginBottom: 20
  },
  googleText: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#EEE' },
  dividerText: { marginHorizontal: 10, color: '#999', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },

  typeSelector: {
    flexDirection: 'row', backgroundColor: '#F5F5F5',
    borderRadius: 12, padding: 4, marginBottom: 20
  },
  typeOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  typeSelected: { backgroundColor: '#FF6F00', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
  typeText: { fontSize: 14, fontWeight: '600', color: '#666' },
  typeTextSelected: { color: '#FFF' },

  inputsContainer: { gap: 15, marginBottom: 25 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1, borderColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 56
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333', height: '100%' },

  primaryBtn: {
    backgroundColor: '#FF6F00',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#FF6F00', shadowOffset: {width:0, height:4}, shadowOpacity:0.3
  },
  primaryBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, paddingBottom: 20 },
  footerText: { color: '#666', fontSize: 14 },
  linkText: { color: '#FF6F00', fontWeight: 'bold', fontSize: 14 }
});