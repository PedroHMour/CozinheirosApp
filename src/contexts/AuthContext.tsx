import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';

// IMPORTS CRÍTICOS
import { auth } from '../../firebaseConfig'; // Teu arquivo de config
import { GoogleSignin } from '@react-native-google-signin/google-signin'; // Para deslogar do Google Nativo

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
  const segments = useSegments();

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

  // Função chamada pelo app/index.tsx quando o Railway dá OK
  async function signIn(userData: UserData) {
    setIsLoading(true);
    try {
      setUser(userData);
      // Salva para não precisar logar toda vez que fecha o app
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      if (userData.token) {
        await SecureStore.setItemAsync('userToken', userData.token);
      }
      
      // A navegação automática é feita pelo RootLayout ou index, 
      // mas podemos forçar aqui se necessário.
    } catch (error) {
      console.log('Erro ao salvar login:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // --- AQUI ESTÁ A CORREÇÃO DO LOGOUT ---
  async function signOut() {
    setIsLoading(true);
    try {
      // 1. Desconecta do Firebase
      await auth.signOut();

      // 2. Desconecta do Google Nativo (O SEGREDO PARA TROCAR DE CONTA)
      try {
        await GoogleSignin.signOut();
        // Opcional: revokeAccess() força pedir a senha de novo, mas signOut() costuma bastar para trocar conta
        // await GoogleSignin.revokeAccess(); 
      } catch (googleError) {
        console.log("Aviso: Google SignOut falhou (talvez não estivesse logado via Google):", googleError);
      }

      // 3. Limpa o armazenamento local
      await SecureStore.deleteItemAsync('userData');
      await SecureStore.deleteItemAsync('userToken');
      
      // 4. Zera o estado
      setUser(null);

      // 5. Manda para a tela de login
      router.replace('/');
      
    } catch (error) {
      console.error('Erro ao sair:', error);
    } finally {
      setIsLoading(false); // Destrava a tela de carregamento
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