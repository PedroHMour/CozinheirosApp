import { Ionicons } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { useSession } from '../ctx';
import { API_URL } from '../src/constants/Config'; // Usa a config central

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  const { signIn } = useSession(); 
  
  const redirectUri = makeRedirectUri({
    scheme: 'cozinheirosapp'
  });

  // --- SEUS IDs DO GOOGLE ---
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '1018879454844-3ua061oto90o8khh54u0hgokcenun5vd.apps.googleusercontent.com',
    webClientId: '1018879454844-aj3mkuaol995iej7difc9gvrti9kffgv.apps.googleusercontent.com',
    redirectUri: redirectUri,
  });

  const [isLogin, setIsLogin] = useState(true); 
  const [isLoading, setIsLoading] = useState(false); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState('client');

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    }
  }, [response]);

  const handleGoogleLogin = async (token: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok) signIn(data.user);
      else Alert.alert("Erro", data.error);
    } catch (e) { Alert.alert("Erro", "Falha na conexão."); } 
    finally { setIsLoading(false); }
  };

  const handleManualAction = async () => {
    setIsLoading(true);
    try {
      const endpoint = isLogin ? '/login' : '/signup';
      const body = isLogin ? { email, password } : { name, email, password, type: userType };
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) signIn(data.user);
      else Alert.alert("Erro", data.error);
    } catch (e) { Alert.alert("Erro", "Falha na conexão."); } 
    finally { setIsLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Ionicons name="restaurant" size={60} color="#FF6F00" />
          <Text style={styles.title}>ChefInHouse</Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity style={styles.googleBtn} disabled={!request} onPress={() => promptAsync()}>
            {isLoading ? <ActivityIndicator color="#000"/> : (
              <>
                <Ionicons name="logo-google" size={24} color="black" style={{marginRight: 10}} />
                <Text style={styles.googleText}>Continuar com Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} /><Text style={styles.orText}>OU</Text><View style={styles.line} />
          </View>

          {!isLogin && (
             <View style={styles.typeRow}>
                 <TouchableOpacity onPress={() => setUserType('client')} style={[styles.typeBtn, userType==='client' && styles.typeActive]}><Text style={[styles.typeText, userType==='client' && styles.typeTextActive]}>Sou Cliente</Text></TouchableOpacity>
                 <TouchableOpacity onPress={() => setUserType('cook')} style={[styles.typeBtn, userType==='cook' && styles.typeActive]}><Text style={[styles.typeText, userType==='cook' && styles.typeTextActive]}>Sou Chef</Text></TouchableOpacity>
             </View>
          )}
          
          {!isLogin && <TextInput style={styles.input} placeholder="Nome" value={name} onChangeText={setName} />}
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity style={styles.actionButton} onPress={handleManualAction}>
            <Text style={styles.actionButtonText}>{isLogin ? 'Entrar' : 'Cadastrar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchBtn} onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>{isLogin ? 'Criar conta' : 'Já tenho conta'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#000', marginTop: 10 },
  subtitle: { color: '#666', marginTop: 5 },
  form: { width: '100%' },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', marginBottom: 20 },
  googleText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#EEE' },
  orText: { marginHorizontal: 10, color: '#999', fontSize: 12, fontWeight: 'bold' },
  input: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth:1, borderColor:'#EEE', fontSize: 16 },
  actionButton: { backgroundColor: '#FF6F00', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#666' },
  typeRow: { flexDirection: 'row', marginBottom: 15, gap: 10 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#EEE', alignItems: 'center' },
  typeActive: { backgroundColor: '#FF6F00', borderColor: '#FF6F00' },
  typeText: { color: '#000' },
  typeTextActive: { color: '#FFF', fontWeight: 'bold' },
});