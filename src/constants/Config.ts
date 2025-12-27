// src/constants/Config.ts

// ---------------------------------------------------------
// 1. CONFIGURAÇÕES DE API E BANCO
// ---------------------------------------------------------
export const API_URL = "https://backend-api-production-29fe.up.railway.app";
// export const API_URL = 'http://192.168.100.89:3000'; // Use este se estiver rodando local

export const SUPABASE_URL = 'https://wylggmdtqqwhghxojnqp.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_-r4qaiKpZYHn19cABQ2wmw_2j6nn4ef';

// ---------------------------------------------------------
// 2. MERCADO PAGO (SANDBOX / TESTES)
// ---------------------------------------------------------

// 🔑 TOKEN DO VENDEDOR DE TESTE (Seller ID: 3061309941)
// Esse é o token que você acabou de gerar na conta do vendedor
export const MP_ACCESS_TOKEN = "APP_USR-5983688509217122-121221-ce309a46d1149f8c1016de504ff65d65-3061309941";

// 📧 EMAIL DO COMPRADOR DE TESTE (Buyer ID: 3061309943)
// Formato obrigatório: test_user_{ID}@testuser.com
export const MP_TEST_BUYER_EMAIL = "test_user_3061309943@testuser.com";

// 💰 TAXA DA PLATAFORMA (11%)
export const PLATFORM_FEE_PERCENTAGE = 0.11;