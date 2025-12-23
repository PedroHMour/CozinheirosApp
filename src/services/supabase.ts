// src/services/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// ⚠️ COLOQUE SUAS CHAVES AQUI
const SUPABASE_URL = 'https://wylggmdtqqwhghxojnqp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-r4qaiKpZYHn19cABQ2wmw_2j6nn4ef';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Otimização: Pausa a conexão realtime se o app for para segundo plano
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.removeAllChannels();
  }
});