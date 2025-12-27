import { PLATFORM_FEE_PERCENTAGE } from '../constants/Config';
import { mercadoPagoService } from './mercadopago';
import { supabase } from './supabase';

export const api = {
  // --- GET (BUSCAR DADOS) ---
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

  // --- POST (ENVIAR DADOS) ---
  post: async (endpoint: string, body: any) => {
    
    // --- AUTENTICAÇÃO REAL (CORRIGIDA) ---
    if (endpoint === '/login' || endpoint === '/signup' || endpoint === '/auth/google') {
       
       // 1. Verifica se o usuário já existe no banco
       const { data: existingUser } = await supabase
           .from('users')
           .select('*')
           .eq('email', body.email)
           .maybeSingle();

       // 2. LOGIN: Se existe, retorna os dados REAIS do banco (onde type está correto)
       if (existingUser) {
           // Atualiza foto ou nome se vierem novos (opcional)
           if (body.photo || body.name) {
               await supabase.from('users').update({ 
                   photo: body.photo || existingUser.photo,
                   name: body.name || existingUser.name
               }).eq('id', existingUser.id);
           }
           
           // RETORNA O USUÁRIO DO BANCO (com type correto: 'cook' ou 'client')
           return { user: existingUser, token: 'session_token_simulated' };
       } 

       // 3. SIGNUP: Se não existe, cria um novo
       else {
           const userData = {
               name: body.name || 'Usuário',
               email: body.email,
               type: body.type || 'client', // Só usa 'client' se for cadastro novo sem tipo
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

    // 1. CRIAR CHAMADO
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

    // 4. CRIAR PIX
    if (endpoint === '/payments/create') {
        const { order_id, amount, client_email, client_name, client_id } = body;

        const platformFee = parseFloat((amount * PLATFORM_FEE_PERCENTAGE).toFixed(2));
        const chefNet = parseFloat((amount - platformFee).toFixed(2));

        const mpResponse = await mercadoPagoService.createPixPayment({
            transaction_amount: amount,
            description: `Pedido #${order_id} - Chefe Local`,
            payer_email: client_email,
            payer_name: client_name
        });

        const { error } = await supabase
            .from('payments')
            .insert([{
                order_id: order_id,
                payer_id: client_id,
                total_amount: amount,
                platform_fee: platformFee,
                chef_net_amount: chefNet,
                mp_payment_id: mpResponse.id.toString(),
                mp_status: mpResponse.status,
                qr_code_base64: mpResponse.qr_code, 
                ticket_url: mpResponse.ticket_url
            }]);
        
        if (error) throw error;
        return { ok: true, payment: mpResponse };
    }

    // 5. CHECAR PAGAMENTO
    if (endpoint === '/payments/check') {
        const { payment_id, order_id } = body;
        
        const status = await mercadoPagoService.getPaymentStatus(payment_id);
        
        if (status === 'approved') {
            await supabase
                .from('payments')
                .update({ mp_status: 'approved' })
                .eq('mp_payment_id', payment_id.toString());
            
            await supabase
                .from('orders')
                .update({ status: 'scheduled' }) 
                .eq('id', order_id);
            
            return { approved: true };
        }
        return { approved: false, status: status };
    }

    // 6. CHAT
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