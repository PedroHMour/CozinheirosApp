import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
// 1. Importamos o tipo que acabamos de criar
import { User } from '../types'; 

// 2. Definimos a "Cara" do nosso Contexto usando o tipo User
interface AuthContextData {
  signIn: (userData: User) => void;
  signOut: () => void;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextData>({
  signIn: () => null,
  signOut: () => null,
  user: null,
  isLoading: true,
});

export function useAuth() {
  const value = React.useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth deve ser usado dentro de um <AuthProvider />');
  }
  return value;
}

export function AuthProvider(props: React.PropsWithChildren) {
  // 3. O estado agora sabe que guarda um User ou null
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carrega o usuário salvo ao abrir o app
    AsyncStorage.getItem('user').then((json) => {
      if (json) {
        try {
          const userObj = JSON.parse(json);
          setUser(userObj);
        } catch (e) {
          console.error("Erro leitura auth", e);
        }
      }
      setIsLoading(false);
    });
  }, []);

  const signIn = async (userData: User) => {
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  const signOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ signIn, signOut, user, isLoading }}>
      {props.children}
    </AuthContext.Provider>
  );
}