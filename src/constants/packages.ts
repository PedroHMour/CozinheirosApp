// src/constants/packages.ts
import { ServicePackage } from "../types";

export const PACKAGES: ServicePackage[] = [
    {
        id: 'basic',
        label: 'Básico',
        price: 20.00,
        description: 'Cozinheiros iniciantes. Preparos simples do dia a dia.',
        commission: 0.11
    },
    {
        id: 'intermediate',
        label: 'Intermediário',
        price: 35.00,
        description: 'Cozinheiros experientes. Pratos com toque especial.',
        commission: 0.11
    },
    {
        id: 'professional',
        label: 'Profissional',
        price: 45.00,
        description: 'Chefs formados. Técnicas avançadas e apresentação.',
        commission: 0.11
    },
    {
        id: 'premium',
        label: 'Premium',
        price: 100.00,
        description: 'Alta gastronomia. Menus completos e exclusivos.',
        commission: 0.11
    }
];

// Função auxiliar para calcular ganhos
export const calculateEarnings = (packageId: string | undefined) => {
    const pack = PACKAGES.find(p => p.id === packageId) || PACKAGES[0];
    
    const fee = pack.price * pack.commission;
    return {
        price: pack.price,
        profit: pack.price - fee
    };
};