import { supabase } from './supabase';

export const api = {
  // --- GET (Mantido original) ---
  get: async (endpoint: string) => {
    
    // 1. RADAR DO CHEF
    if (endpoint === '/requests/open') {
      const { data } = await supabase
        .from('orders')
        .select('*, client:users!client_id(name, photo, rating)') 
        .is('cook_id', null) 
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      return data || [];
    }

    // 2. OFERTAS DE UM PEDIDO
    if (endpoint.includes('/requests/offers/')) {
        const orderId = endpoint.split('/').pop();
        const { data } = await supabase
            .from('order_offers')
            .select('*, cook:users!cook_id(name, photo, rating, specialty)')
            .eq('order_id', orderId)
            .order('price', { ascending: true });
        return data || [];
    }

    // 3. MEUS PEDIDOS
    if (endpoint.includes('/my-requests/')) {
        const userId = endpoint.split('/').pop();
        const { data } = await supabase
            .from('orders')
            .select('*, cook:users!cook_id(name, photo), client:users!client_id(name, photo)')
            .or(`client_id.eq.${userId},cook_id.eq.${userId}`)
            .order('created_at', { ascending: false });
        return data || [];
    }

    // 4. CHAT
    if (endpoint.includes('/chat/')) {
        const orderId = endpoint.split('/').pop();
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });
        return data || [];
    }

    // 5. PAGAMENTOS DO PEDIDO
    if (endpoint.includes('/payments/order/')) {
        const orderId = endpoint.split('/').pop();
        const { data } = await supabase
            .from('payments')
            .select('*')
            .eq('order_id', orderId)
            .maybeSingle();
        return data;
    }

    return [];
  },

  // --- POST (Aqui está a correção) ---
  post: async (endpoint: string, body: any) => {
    
    // LOGIN / CADASTRO / GOOGLE
    if (endpoint === '/login' || endpoint === '/signup' || endpoint === '/auth/google') {
       
       const { data: existingUser } = await supabase
           .from('users')
           .select('*')
           .eq('email', body.email)
           .maybeSingle();

       if (existingUser) {
           // >>> A TRAVA DE SEGURANÇA <<<
           if (endpoint === '/signup') {
               throw new Error("Este e-mail já possui cadastro. Faça login.");
           }
           // >>>>>>>>>>>>>>>>>>>>>>>>>>>>

           // Atualiza dados se necessário e loga
           if (body.photo || body.name) {
               await supabase.from('users').update({ 
                   photo: body.photo || existingUser.photo,
                   name: body.name || existingUser.name
               }).eq('id', existingUser.id);
           }
           
           return { user: existingUser, token: 'session_token_simulated' };
       } 
       else {
           // Cria usuário novo
           const userData = {
               name: body.name || 'Usuário',
               email: body.email,
               type: body.type || 'client',
               photo: body.photo || null,
               latitude: body.latitude || 0,
               longitude: body.longitude || 0
           };

           const { data: newUser, error } = await supabase
               .from('users')
               .insert([userData])
               .select()
               .single();
           
           if (error) throw new Error(error.message);
           return { user: newUser, token: 'session_token_simulated' };
       }
    }

    // 1. CRIAR PEDIDO
    if (endpoint === '/requests/broadcast') {
       const { data, error } = await supabase
         .from('orders')
         .insert([{
            client_id: body.client_id,
            dish_description: body.description,
            people_count: body.people_count,
            offer_price: body.price,
            latitude: body.latitude,
            longitude: body.longitude,
            status: 'pending',
            created_at: new Date()
         }])
         .select()
         .single();
       if (error) throw new Error(error.message);
       return { ok: true, orderId: data.id };
    }

    // 2. FAZER OFERTA
    if (endpoint === '/requests/make-offer') {
        const { error } = await supabase
            .from('order_offers')
            .insert([{
                order_id: body.order_id,
                cook_id: body.cook_id,
                price: body.price,
                status: 'sent'
            }]);
        if (error) throw error;
        return { ok: true };
    }

    // 3. ACEITAR OFERTA
    if (endpoint === '/requests/confirm-offer') {
        const { error } = await supabase
            .from('orders')
            .update({ 
                cook_id: body.cook_id, 
                offer_price: body.final_price,
                status: 'accepted'
            })
            .eq('id', body.order_id);
        if (error) throw error;
        return { ok: true };
    }

    // 4. CHAT
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