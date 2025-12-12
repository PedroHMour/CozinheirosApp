
// 🎨 Paleta Chefe Local (Adaptada para Estilo Transporte Moderno)
const palette = {
  primary: '#FF6F00',      // Seu Laranja Vibrante
  primaryLight: '#FFF3E0', // Laranja bem suave para fundos
  secondary: '#2196F3',    // Azul para ações secundárias (Chat, info)
  background: '#F4F6F9',   // Cinza azulado muito claro (fundo moderno)
  surface: '#FFFFFF',      // Branco puro para cards
  textMain: '#1A1D1E',     // Quase preto, para leitura nítida
  textSec: '#6B7280',      // Cinza médio para legendas
  success: '#4CAF50',      // Verde sucesso
  error: '#EF4444',        // Vermelho erro
  grayBorder: '#E5E7EB',   // Bordas sutis
};

export const Colors = {
  light: {
    primary: palette.primary,
    primaryLight: palette.primaryLight,
    secondary: palette.secondary,
    background: palette.background,
    card: palette.surface,
    text: palette.textMain,
    textSecondary: palette.textSec,
    border: palette.grayBorder,
    success: palette.success,
    error: palette.error,
    tint: palette.primary,
    icon: '#9CA3AF',
  },
  dark: {
    // Estrutura pronta para modo escuro futuro
    primary: palette.primary,
    background: '#121212',
    card: '#1E1E1E',
    text: '#E5E7EB',
    textSecondary: '#9CA3AF',
    border: '#333333',
    tint: '#FFF',
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 32, // Para o visual "Bottom Sheet" arredondado
  full: 999, // Para botões redondos
};

export const Shadows = {
  // Sombra leve e difusa (Estilo iOS/Material 3)
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  // Sombra para elementos flutuantes sobre o mapa
  float: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  }
};

export const Typography = {
  header: { fontSize: 24, fontWeight: '700' as '700', color: palette.textMain, letterSpacing: -0.5 },
  subHeader: { fontSize: 18, fontWeight: '600' as '600', color: palette.textMain },
  body: { fontSize: 15, fontWeight: '400' as '400', color: palette.textMain, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '500' as '500', color: palette.textSec },
  button: { fontSize: 16, fontWeight: '700' as '700', color: '#FFF' },
};