import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router'; // Removido useSegments

// IMPORTS
import { auth } from '../../firebaseConfig'; 
import { GoogleSignin } from '@react-native-google-signin/google-signin';

type UserData = {
  id: number;
  email: string;
  name: string;
  type: 'client' | 'cook';
  token?: string;
};

type AuthContextType = {
  user: UserData | null;
  isLoading: boolean;
  signIn: (userData: UserData) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  // REMOVIDO: const segments = useSegments(); (Não era usado aqui)

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const userStored = await SecureStore.getItemAsync('userData');
      const tokenStored = await SecureStore.getItemAsync('userToken');

      if (userStored && tokenStored) {
        setUser(JSON.parse(userStored));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(userData: UserData) {
    setIsLoading(true);
    try {
      setUser(userData);
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      if (userData.token) {
        await SecureStore.setItemAsync('userToken', userData.token);
      }
    } catch (error) {
      console.log('Erro ao salvar login:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // --- FUNÇÃO SIGNOUT ---
  async function signOut() {
    setIsLoading(true);
    try {
      // 1. Firebase
      await auth.signOut();

      // 2. Google
      try {
        await GoogleSignin.signOut();
      } catch (googleError) {
        console.log("Google SignOut info:", googleError);
      }

      // 3. Limpeza Local
      await SecureStore.deleteItemAsync('userData');
      await SecureStore.deleteItemAsync('userToken');
      
      setUser(null);

      // 4. NAVEGAÇÃO SEGURA PARA A RAIZ
      if (router.canGoBack()) {
        router.dismissAll();
      }
      router.replace('/');
      
    } catch (error) {
      console.error('Erro crítico ao sair:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6F00" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}