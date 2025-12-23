// src/services/api.ts
import { supabase } from './supabase';

export const api = {
  // --- BUSCAR DADOS (GET) ---
  get: async (endpoint: string) => {
    
    // 1. BUSCAR CHEFS (Para o Mapa do Cliente)
    if (endpoint === '/chefs') {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('type', 'cook'); // Traz só quem é cozinheiro
      
      if (error) {
        console.error("Erro ao buscar chefs:", error);
        return [];
      }
      return data || [];
    }

    // 2. BUSCAR PEDIDOS (Para o Painel do Chefe)
    if (endpoint === '/requests') {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending') // Só pedidos novos
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    // 3. BUSCAR MEU PEDIDO ATIVO (Para o Cliente acompanhar)
    if (endpoint.includes('/requests/my-active-order/')) {
      const clientId = endpoint.split('/').pop();
      
      // Tenta buscar o último pedido não finalizado
      const { data, error } = await supabase
        .from('orders')
        .select('*, cook:users!cook_id(name, photo, latitude, longitude)')
        .eq('client_id', clientId)
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // maybeSingle evita erro se não tiver pedido

      if (error) console.log("Erro busca pedido:", error.message);
      return data || null;
    }

    // 4. HISTÓRICO DE PEDIDOS DO CHEF
    if (endpoint.includes('/requests/accepted-by/')) {
        const cookId = endpoint.split('/').pop();
        const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('cook_id', cookId)
            .neq('status', 'completed');
        return data || [];
    }

    return [];
  },

  // --- ENVIAR DADOS (POST) ---
  post: async (endpoint: string, body: any) => {
    
    // 1. LOGIN / CADASTRO / GOOGLE
    // Aqui garantimos que o usuário do Firebase seja salvo no Banco do Supabase
    if (endpoint === '/login' || endpoint === '/signup' || endpoint === '/auth/google') {
       
       const userData = {
           name: body.name || 'Usuário',
           email: body.email,
           type: body.type || 'client',
           photo: body.photo || null,
           // Se tiver latitude/longitude vindo do cadastro
           latitude: body.latitude || 0,
           longitude: body.longitude || 0
       };

       // Verifica se usuário já existe pelo email
       const { data: existingUser } = await supabase
           .from('users')
           .select('*')
           .eq('email', body.email)
           .single();

       let finalUser = existingUser;

       if (!existingUser) {
           // Se não existe, cria
           const { data: newUser, error } = await supabase
               .from('users')
               .insert([userData])
               .select()
               .single();
           
           if (error) console.error("Erro ao criar usuário no banco:", error);
           finalUser = newUser;
       } else {
           // Se existe, atualiza dados (ex: foto nova do Google)
           await supabase.from('users').update(userData).eq('id', existingUser.id);
       }

       // Retorna formato que o AuthContext espera
       return { 
           user: finalUser || { ...userData, id: 'temp_id' }, 
           token: 'session_token_firebase' 
       };
    }

    // 2. ATUALIZAR GPS DO USUÁRIO
    if (endpoint === '/users/location') {
      await supabase
        .from('users')
        .update({ latitude: body.latitude, longitude: body.longitude })
        .eq('id', body.id);
      return { ok: true };
    }

    // 3. CRIAR NOVO PEDIDO
    if (endpoint === '/requests') {
       const { error } = await supabase
         .from('orders')
         .insert([{
            client_id: body.client_id,
            dish_description: body.dish_description,
            offer_price: body.offer_price,
            latitude: body.latitude,
            longitude: body.longitude,
            status: 'pending',
            payment_method: body.payment_method || 'pix',
            created_at: new Date()
         }]);
       
       if (error) throw new Error(error.message);
       return { ok: true };
    }

    // 4. CHEFE ACEITA PEDIDO
    if (endpoint === '/requests/accept') {
        const { error } = await supabase
            .from('orders')
            .update({ 
                cook_id: body.cook_id, 
                status: 'accepted' 
            })
            .eq('id', body.request_id);
        
        if (error) throw error;
        return { ok: true };
    }

    // 5. ATUALIZAR STATUS (Cozinhando, Entregue, etc)
    if (endpoint === '/requests/update-status') {
        const { error } = await supabase
            .from('orders')
            .update({ status: body.new_status })
            .eq('id', body.request_id);
        return { ok: !error };
    }
    
    // MOCK DE PAGAMENTO (Para passar na loja sem backend)
    if (endpoint.includes('/payments')) {
        return { 
            status: 'approved', 
            qr_code: '00020126580014BR.GOV.BCB.PIX...', 
            id: 123456 
        };
    }

    return { ok: true };
  },

  delete: async (endpoint: string) => {
      // Deletar conta (Simples)
      if (endpoint.includes('/users/')) {
          const id = endpoint.split('/').pop();
          await supabase.from('users').delete().eq('id', id);
          return { ok: true };
      }
      return { ok: false };
  }
};