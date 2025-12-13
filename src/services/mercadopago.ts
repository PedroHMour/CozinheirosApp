// src/services/mercadopago.ts
import { MP_PUBLIC_KEY } from '../constants/Config';

interface CardData {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  docType: string;
  docNumber: string;
}

// Exportação nomeada correta
export const MercadoPagoService = {
  async createCardToken(card: CardData) {
    try {
      console.log("🔄 Criando token do cartão...");
      
      const response = await fetch(
        `https://api.mercadopago.com/v1/card_tokens?public_key=${MP_PUBLIC_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            card_number: card.cardNumber.replace(/\s/g, ''),
            cardholder: {
              name: card.cardholderName,
              identification: {
                type: card.docType,
                number: card.docNumber.replace(/\D/g, '')
              }
            },
            expiration_month: parseInt(card.cardExpirationMonth),
            expiration_year: parseInt(card.cardExpirationYear),
            security_code: card.securityCode,
          }),
        }
      );

      const data = await response.json();

      if (data.status >= 400) {
        console.error("Erro MP:", data);
        throw new Error(data.message || "Verifique os dados do cartão.");
      }

      return data.id; 
    } catch (error: any) {
      console.error("Erro ao tokenizar:", error);
      throw error;
    }
  }
};