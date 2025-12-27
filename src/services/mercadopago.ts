// src/services/mercadopago.ts

// ✅ Importando do SEU arquivo existente
import { supabase } from './supabase';

export const mercadoPagoService = {

  createPixPayment: async (paymentData: { 
    transaction_amount: number; 
    description: string; 
    payer_name: string;
    payer_email: string; // O App manda o email do usuário logado
  }) => {
    try {
      console.log("🚀 [FRONTEND] Solicitando Pix ao Supabase Edge Function...");

      // ⚠️ TRUQUE PARA O TESTE FUNCIONAR AGORA (SANDBOX):
      // Como a Edge Function está usando a chave do VENDEDOR DE TESTE (...9941),
      // o pagador OBRIGATORIAMENTE tem que ser o COMPRADOR DE TESTE (...9943).
      // Se mandarmos seu email real agora, vai dar erro.
      
      const emailParaTeste = "test_user_3061309943@testuser.com"; 

      // Chama a função 'create-pix' que está na nuvem
      const { data, error } = await supabase.functions.invoke('create-pix', {
        body: {
          transaction_amount: paymentData.transaction_amount,
          description: paymentData.description,
          payer_email: emailParaTeste, // <--- Forçando o comprador de teste
          payer_name: paymentData.payer_name
        }
      });

      // 1. Erro de conexão com o Supabase (Rede, URL errada, etc)
      if (error) {
        console.error("❌ [ERRO SUPABASE]:", error);
        throw new Error("Falha ao conectar ao servidor de pagamentos.");
      }

      // 2. Erro retornado pela nossa função (Ex: MP recusou)
      if (!data || !data.ok) {
         console.error("❌ [ERRO MERCADO PAGO]:", data?.error);
         throw new Error(data?.error || "Pagamento não autorizado pelo Mercado Pago.");
      }

      console.log("✅ [SUCESSO] Pix Gerado! ID:", data.payment.id);

      // 3. Retorna os dados limpos para a tela exibir o QR Code
      return {
        id: data.payment.id,
        status: data.payment.status, 
        qr_code: data.payment.qr_code, 
        qr_code_base64: data.payment.qr_code_base64,
        ticket_url: data.payment.ticket_url
      };

    } catch (error: any) {
      console.error('❌ [CATCH SERVICE]:', error);
      throw error;
    }
  },

  // Função auxiliar para verificar status (opcional)
  checkPaymentStatus: async (paymentId: string) => {
      // Por enquanto retorna null, focamos em gerar o QR Code primeiro
      return null;
  }
};