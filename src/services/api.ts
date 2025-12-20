// src/services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/Config';

// Tempo limite padrão: 15 segundos (ideal para redes móveis 4G/5G)
const DEFAULT_TIMEOUT = 15000;

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('@auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// Função auxiliar para fetch com timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = DEFAULT_TIMEOUT) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('A conexão demorou muito. Verifique sua internet.');
    }
    throw error;
  }
};

export const api = {
  get: async (endpoint: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetchWithTimeout(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: headers
      });

      if (!res.ok) throw new Error(`Erro ${res.status}: Falha na requisição`);
      return await res.json();
    } catch (error) {
      console.error(`Erro GET ${endpoint}:`, error);
      throw error;
    }
  },

  post: async (endpoint: string, body: any) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetchWithTimeout(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Erro ${res.status}: Falha na requisição`);
      return await res.json();
    } catch (error) {
      console.error(`Erro POST ${endpoint}:`, error);
      throw error;
    }
  },

  put: async (endpoint: string, body: any) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetchWithTimeout(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Erro ${res.status}: Falha na requisição`);
      return await res.json();
    } catch (error) {
      console.error(`Erro PUT ${endpoint}:`, error);
      throw error;
    }
  },

  delete: async (endpoint: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetchWithTimeout(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: headers
      });

      if (!res.ok) throw new Error(`Erro ${res.status}: Falha na requisição`);
      return await res.json();
    } catch (error) {
      console.error(`Erro DELETE ${endpoint}:`, error);
      throw error;
    }
  }
};
