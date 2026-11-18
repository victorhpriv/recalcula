import { Category, IncomeType, InvoiceStatus } from '../../core/api/models';

export interface Option<T> {
  label: string;
  value: T;
  icon?: string;
}

/** Rótulo, ilustração 3D (public/3d) e cor de cada categoria. */
export const CATEGORY_META: Record<Category, { label: string; art: string; color: string }> = {
  MORADIA: { label: 'Moradia', art: 'house', color: '#4a6fa5' },
  ALIMENTACAO: { label: 'Alimentação', art: 'hamburger', color: '#d4793a' },
  MERCADO: { label: 'Mercado', art: 'shopping-cart', color: '#3f9b6e' },
  TRANSPORTE: { label: 'Transporte', art: 'automobile', color: '#3b8fb0' },
  SAUDE: { label: 'Saúde', art: 'stethoscope', color: '#c8506a' },
  EDUCACAO: { label: 'Educação', art: 'graduation-cap', color: '#7a5fb5' },
  LAZER: { label: 'Lazer', art: 'popcorn', color: '#d19a2e' },
  SERVICOS: { label: 'Serviços', art: 'high-voltage', color: '#b39a2a' },
  CARTAO: { label: 'Cartão', art: 'credit-card', color: '#3a4a5c' },
  RESERVA: { label: 'Reserva', art: 'money-bag', color: '#0e7a5c' },
  FAMILIA: { label: 'Família', art: 'heart-with-ribbon', color: '#b85a8a' },
  COMPRAS: { label: 'Compras', art: 'shopping-bags', color: '#9a5fb0' },
  ASSINATURAS: { label: 'Assinaturas', art: 'television', color: '#5a67b5' },
  PETS: { label: 'Pets', art: 'dog-face', color: '#9a6f3a' },
  VIAGEM: { label: 'Viagem', art: 'airplane', color: '#2f8f9a' },
  SALARIO: { label: 'Salário', art: 'dollar-banknote', color: '#0e7a5c' },
  OUTROS: { label: 'Outros', art: 'package', color: '#7b857f' },
};

export function categoryArt(c: Category): string {
  return `3d/${CATEGORY_META[c].art}.webp`;
}

export const CATEGORY_OPTIONS: Option<Category>[] = (Object.keys(CATEGORY_META) as Category[]).map((c) => ({
  label: CATEGORY_META[c].label,
  value: c,
  icon: categoryArt(c),
}));

export const INCOME_TYPE_OPTIONS: Option<IncomeType>[] = [
  { label: 'Salário', value: 'SALARIO' },
  { label: 'Freelance', value: 'FREELANCE' },
  { label: 'Benefício', value: 'BENEFICIO' },
  { label: 'Investimento', value: 'INVESTIMENTO' },
  { label: 'Outro', value: 'OUTRO' },
];

export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; severity: 'info' | 'warn' | 'success' | 'danger' }> = {
  ABERTA: { label: 'Aberta', severity: 'info' },
  FECHADA: { label: 'Fechada', severity: 'warn' },
  PAGA: { label: 'Paga', severity: 'success' },
  VENCIDA: { label: 'Vencida', severity: 'danger' },
};

export const CARD_COLORS = ['#1F2430', '#2F5BEA', '#E8792F', '#8A2BE2', '#0E9F6E', '#D6336C', '#6B7280'];
export const GOAL_COLORS = ['#2F5BEA', '#0E9F6E', '#E8792F', '#D6336C', '#8A2BE2', '#F59E0B'];
