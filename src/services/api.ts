import { supabase } from './supabase';

export const api = {
  // --- BUSCAR DADOS (GET) ---
  get: async (endpoint: string) => {
    
    // 1. RADAR DO CHEF (Modo Simplificado)
    // Busca pedidos pendentes sem tentar cruzar com a tabela de usuários agora
    if (endpoint === '/requests/open') {
      const { data, error } = await supabase
        .from('orders') 
        .select('*') // Traz apenas os dados do pedido
        .is('cook_id', null)        
        .eq('status', 'pending')    
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Erro API Radar:", error);
        return [];
      }
      return data || [];
    }

    // 2. MEUS PEDIDOS (Modo Simplificado)
    if (endpoint.includes('/my-requests/')) {
        const userId = endpoint.split('/').pop();
        
        // Proteção contra ID inválido
        if (!userId) return [];

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .or(`client_id.eq.${userId},cook_id.eq.${userId}`)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error("Erro API Meus Pedidos:", error);
            return [];
        }
        return data || [];
    }

    // 3. CHAT (Mensagens de um pedido)
    if (endpoint.includes('/chat/')) {
        const orderId = endpoint.split('/').pop();
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });

        if (error) {
             console.error("Erro Chat:", error);
             return [];
        }
        return data || [];
    }

    return [];
  },

  // --- ENVIAR DADOS (POST) ---
  post: async (endpoint: string, body: any) => {
    
    // 1. LOGIN / CADASTRO (Sincroniza usuário do Firebase na tabela pública do Supabase)
    if (endpoint === '/login' || endpoint === '/signup' || endpoint === '/auth/google') {
       // Tenta encontrar o usuário
       const { data: existingUser } = await supabase
           .from('users')
           .select('*')
           .eq('email', body.email)
           .maybeSingle();

       if (existingUser) {
           // Se já existe, retorna ele
           return { user: existingUser, token: 'session_token_simulated' };
       } 
       else {
           // Se não existe, cria um novo registro simples
           const userData = {
               id: body.uid || body.id, // Usa o ID do Firebase se disponível
               name: body.name || 'Usuário',
               email: body.email,
               type: body.type || 'client',
               photo: body.photo || null,
               cook_level: 'basic'
           };

           // Tenta inserir (ignora erro se já existir por ID)
           const { data: newUser, error } = await supabase
               .from('users')
               .upsert([userData]) 
               .select()
               .single();
           
           if (error) {
               console.error("Erro ao criar usuário:", error);
               // Retorna um objeto fake para não travar o app
               return { user: userData, token: 'session_token_simulated' };
           }
           return { user: newUser, token: 'session_token_simulated' };
       }
    }

    // 2. ACEITAR PEDIDO (Cozinheiro assume o pedido)
    if (endpoint === '/requests/confirm-offer') {
        const { error } = await supabase
            .from('orders')
            .update({ 
                cook_id: body.cook_id, 
                status: 'accepted'
            })
            .eq('id', body.order_id);
            
        if (error) throw error;
        return { ok: true };
    }

    // 3. ENVIAR MENSAGEM NO CHAT
    if (endpoint === '/chat/send') {
        const { error } = await supabase
            .from('messages')
            .insert([{
                order_id: body.order_id,
                sender_id: body.sender_id,
                content: body.content,
                type: body.type || 'text'
            }]);
        if (error) throw error;
        return { ok: true };
    }

    return { ok: true };
  }
};