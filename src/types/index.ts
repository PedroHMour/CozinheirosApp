// src/types/index.ts

export type CookLevel = 'basic' | 'intermediate' | 'professional' | 'premium';

export interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
  type: 'client' | 'cook';
  cook_level?: CookLevel;
  rating?: number;
}

export interface ServicePackage {
  id: CookLevel;
  label: string;
  price: number;
  description: string;
  commission: number;
}

export interface Order {
  id: number;
  client_id: string;
  cook_id?: string | null;
  
  // Dados do Pacote
  package_level: CookLevel; 
  dish_description: string; 
  people_count: number;
  
  // Financeiro
  total_price: number;      
  cook_profit: number;      
  platform_fee: number;
  payment_method: string;

  // Status e Local
  status: 'pending' | 'accepted' | 'preparing' | 'delivery' | 'finished';
  latitude: number;
  longitude: number;
  created_at: string;

  // Relações (opcionais do Supabase)
  client?: User;
  cook?: User;
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