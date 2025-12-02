import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';

const AuthContext = React.createContext<{
  signIn: (userData: any) => void;
  signOut: () => void;
  user: any | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  user: null,
  isLoading: true,
});

export function useAuth() { // Mudei o nome de useSession para useAuth (padrão de mercado)
  const value = React.useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be wrapped in a <AuthProvider />');
  }
  return value;
}

export function AuthProvider(props: React.PropsWithChildren) { // Mudei de SessionProvider para AuthProvider
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('user').then((json) => {
      if (json) {
        try {
          setUser(JSON.parse(json));
        } catch (e) {
          console.error("Erro leitura auth", e);
        }
      }
      setIsLoading(false);
    });
  }, []);

  const signIn = async (userData: any) => {
    const userObj = typeof userData === 'string' ? JSON.parse(userData) : userData;
    setUser(userObj);
    await AsyncStorage.setItem('user', JSON.stringify(userObj));
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