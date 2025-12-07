// src/types/index.ts

// Definição do Usuário (Cliente ou Cozinheiro)
export interface User {
  id: string; // ou number, dependendo do seu banco (Supabase usa UUID string)
  name: string;
  email: string;
  photo?: string; // Opcional
  type: 'client' | 'cook'; // Só aceita esses dois valores
}

// Definição de um Pedido
export interface Order {
  id: number;
  client_id: string;
  cook_id?: string | null;
  dish_description: string;
  offer_price: number | string;
  status: 'pending' | 'accepted' | 'preparing' | 'delivery' | 'finished';
  latitude: number;
  longitude: number;
  created_at: string;
}

// Definição de uma Mensagem de Chat
export interface ChatMessage {
  id: string;
  order_id: number;
  sender_id: string;
  text: string;
  created_at: string;
}

// Resposta de Login da API
export interface AuthResponse {
  user: User;
  token: string;
}