import { API_URL } from '../constants/Config';

export const api = {
  get: async (endpoint: string) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`);
      return await res.json();
    } catch (error) {
      throw error;
    }
  },

  post: async (endpoint: string, body: any) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch (error) {
      throw error;
    }
  }
  // Futuramente podemos adicionar put, delete, etc.
};