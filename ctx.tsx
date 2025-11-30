import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

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

export function useSession() {
  const value = React.useContext(AuthContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <SessionProvider />');
    }
  }
  return value;
}

export function SessionProvider(props: React.PropsWithChildren) {
  const [user, setUser] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Carrega o usuário do AsyncStorage (O mesmo lugar que o Login salva)
    AsyncStorage.getItem('user').then((json) => {
      if (json) {
        try {
          setUser(JSON.parse(json));
        } catch (e) {
          console.error("Erro ao ler usuário");
        }
      }
      setIsLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signIn: (userData) => {
          // Salva no AsyncStorage
          // Nota: userData já vem string do login, ou objeto. Tratamos aqui.
          const userString = typeof userData === 'string' ? userData : JSON.stringify(userData);
          const userObj = typeof userData === 'string' ? JSON.parse(userData) : userData;
          
          AsyncStorage.setItem('user', userString);
          setUser(userObj);
        },
        signOut: () => {
          // Apaga do AsyncStorage
          AsyncStorage.removeItem('user');
          setUser(null); // Isso avisa o _layout para trocar a tela
        },
        user,
        isLoading,
      }}>
      {props.children}
    </AuthContext.Provider>
  );
}