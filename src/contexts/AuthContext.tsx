import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { router } from 'expo-router';

// Tipagem do Usuário
interface User {
  id: number;
  name: string;
  email: string;
  type: 'client' | 'cook';
  token?: string;
}

// Tipagem do Contexto (CORRIGIDA)
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, isRegistering: boolean, name?: string, type?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  googleLogin: (type: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const storedUser = await AsyncStorage.getItem('@chefelocal:user');
      const storedToken = await AsyncStorage.getItem('@chefelocal:token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  // LOGIN NORMAL (Email/Senha)
  async function signIn(email: string, password: string, isRegistering: boolean, name?: string, type: string = 'client') {
    setLoading(true);
    try {
      const endpoint = isRegistering ? '/signup' : '/login';
      const payload = isRegistering 
        ? { email, password, name, type } 
        : { email, password };

      const response = await api.post(endpoint, payload);
      
      const { user: userData, token } = response.data;
      
      // Salva token para requisições futuras
      if (token) {
        await AsyncStorage.setItem('@chefelocal:token', token);
      }
      
      // Salva usuário
      const userToSave = { ...userData, token };
      setUser(userToSave);
      await AsyncStorage.setItem('@chefelocal:user', JSON.stringify(userToSave));

      return { success: true };
    } catch (error: any) {
      console.log("Erro Login:", error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Falha na autenticação' };
    } finally {
      setLoading(false);
    }
  }

  // GOOGLE LOGIN (Mock Simples ou Real)
  async function googleLogin(type: string) {
    setLoading(true);
    try {
      // Simulação de login Google para destravar o desenvolvimento
      // Num app real, aqui iria o código do GoogleSignin.signIn()
      
      const fakeGoogleUser = {
        email: "google.user@teste.com",
        name: "Usuário Google",
        type: type,
        token: "fake-google-token"
      };

      // Chama backend para registrar/logar esse email
      const response = await api.post('/auth/google', fakeGoogleUser);
      const { user: userData, token } = response.data;

      const userToSave = { ...userData, token };
      setUser(userToSave);
      await AsyncStorage.setItem('@chefelocal:user', JSON.stringify(userToSave));
      await AsyncStorage.setItem('@chefelocal:token', token || 'fake-token');

      return { success: true };
    } catch (error: any) {
      return { success: false, error: 'Erro no Google Login' };
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await AsyncStorage.clear();
    setUser(null);
    router.replace('/');
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}