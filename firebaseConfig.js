import { initializeApp } from 'firebase/app';
// MUDANÇA AQUI: Importamos initializeAuth e getReactNativePersistence
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';

// As tuas chaves continuam as mesmas
const firebaseConfig = {
  apiKey: "AIzaSyB_4K4Kjy4xVyiEooDNfH5URAeUayLdpLs", // CONFIRMA SE AS TUAS CHAVES ESTÃO AQUI
  authDomain: "local-chefe.firebaseapp.com",
  projectId: "local-chefe",
  storageBucket: "local-chefe.appspot.com",
  messagingSenderId: "387721210844",
  appId: "1:387721210844:web:63267cdf453740b9687d19" 
};

const app = initializeApp(firebaseConfig);

// MUDANÇA AQUI: Inicializamos com persistência (memória do celular)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { app, auth };

