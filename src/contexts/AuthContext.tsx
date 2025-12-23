import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

GoogleSignin.configure({
  webClientId: "387721210844-v43kneclhqelp9lkre8pmb6ag89r280r.apps.googleusercontent.com", 
  offlineAccess: true,
  scopes: ['profile', 'email']
});

interface User {
  id: number;
  name: string;
  email: string;
  type: 'client' | 'cook';
  token?: string;
  photo?: string;
}

interface AuthResponse {
  success: boolean;
  error?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, isRegistering: boolean, name?: string, type?: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  googleLogin: (type: string) => Promise<AuthResponse>;
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

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (storedToken && !parsedUser.token) {
          parsedUser.token = storedToken;
        }
        setUser(parsedUser);
      }
    } catch (error) {
      console.log('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string, isRegistering: boolean, name?: string, type: string = 'client'): Promise<AuthResponse> {
    setLoading(true);
    try {
      const endpoint = isRegistering ? '/signup' : '/login';
      const payload = isRegistering ? { email, password, name, type } : { email, password };

      const response = await api.post(endpoint, payload);
      const { user: userData, token } = response;
      
      if (!userData) throw new Error('Dados de usuário não retornados');

      if (token) await AsyncStorage.setItem('@chefelocal:token', token);
      
      const userToSave = { ...userData, token };
      setUser(userToSave);
      await AsyncStorage.setItem('@chefelocal:user', JSON.stringify(userToSave));

      return { success: true, email: userData.email };
    } catch (error: any) {
      const msg = error.message || (error.response?.data?.error) || 'Falha na autenticação';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin(type: string): Promise<AuthResponse> {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.data?.idToken) {
        const googlePayload = {
          email: userInfo.data.user.email,
          name: userInfo.data.user.name,
          photo: userInfo.data.user.photo,
          type: type,
          token: userInfo.data.idToken
        };

        const response = await api.post('/auth/google', googlePayload);
        const { user: userData, token } = response;

        const userToSave = { ...userData, token };
        setUser(userToSave);
        await AsyncStorage.setItem('@chefelocal:user', JSON.stringify(userToSave));
        if (token) await AsyncStorage.setItem('@chefelocal:token', token);

        return { success: true, email: userData.email };
      } else {
         return { success: false, error: 'Sem token do Google' };
      }
    } catch {
       // CORREÇÃO ESLINT: Removemos o '(error: any)'
       return { success: false, error: 'Erro Login Google' };
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setLoading(true);
    try {
      await AsyncStorage.clear();
      await GoogleSignin.signOut().catch(() => {});
    } catch (e) {
      console.log("Erro ao limpar dados:", e);
    }

    setUser(null);
    setLoading(false);

    setTimeout(() => {
        if (router.canGoBack()) {
            router.dismissAll();
        }
        router.replace('/'); 
    }, 100);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
}