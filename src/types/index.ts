// src/types/index.ts

// Níveis de Cozinheiro disponíveis
export type CookLevel = 'basic' | 'intermediate' | 'professional' | 'premium';

// Definição do Usuário (Cliente ou Cozinheiro)
export interface User {
  id: string; 
  name: string;
  email: string;
  photo?: string; 
  type: 'client' | 'cook';
  
  // NOVOS CAMPOS (Correção dos erros 2339)
  cook_level?: CookLevel;       
  wallet_balance?: number;      
  pix_key?: string;             
}

// Definição dos Pacotes de Serviço (Correção do erro 2305)
export interface ServicePackage {
  id: CookLevel;
  label: string;
  price: number;
  description: string;
  commission: number; // 11%
}

// Definição de um Pedido
export interface Order {
  id: number;
  client_id: string;
  cook_id?: string | null;
  
  package_level: CookLevel; 
  dish_description: string; 
  people_count: number;
  
  total_price: number;      
  cook_profit: number;      
  
  status: 'pending' | 'accepted' | 'preparing' | 'delivery' | 'finished';
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  order_id: number;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}