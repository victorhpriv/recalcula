import { Category, IncomeType, InvoiceStatus } from '../../core/api/models';

export interface Option<T> {
  label: string;
  value: T;
  icon?: string;
}

/** Rótulo, ilustração 3D (public/3d) e cor de cada categoria. */
export const CATEGORY_META: Record<Category, { label: string; art: string; color: string }> = {
  MORADIA: { label: 'Moradia', art: 'house', color: '#2f5bea' },
  ALIMENTACAO: { label: 'Alimentação', art: 'hamburger', color: '#e8792f' },
  MERCADO: { label: 'Mercado', art: 'shopping-cart', color: '#16a34a' },
  TRANSPORTE: { label: 'Transporte', art: 'automobile', color: '#0ea5e9' },
  SAUDE: { label: 'Saúde', art: 'stethoscope', color: '#e5486b' },
  EDUCACAO: { label: 'Educação', art: 'graduation-cap', color: '#7c3aed' },
  LAZER: { label: 'Lazer', art: 'popcorn', color: '#f59e0b' },
  SERVICOS: { label: 'Serviços', art: 'high-voltage', color: '#eab308' },
  CARTAO: { label: 'Cartão', art: 'credit-card', color: '#1e2e7a' },
  RESERVA: { label: 'Reserva', art: 'money-bag', color: '#22a45d' },
  FAMILIA: { label: 'Família', art: 'heart-with-ribbon', color: '#db2777' },
  COMPRAS: { label: 'Compras', art: 'shopping-bags', color: '#c026d3' },
  ASSINATURAS: { label: 'Assinaturas', art: 'television', color: '#6366f1' },
  PETS: { label: 'Pets', art: 'dog-face', color: '#a16207' },
  VIAGEM: { label: 'Viagem', art: 'airplane', color: '#0891b2' },
  SALARIO: { label: 'Salário', art: 'dollar-banknote', color: '#22a45d' },
  OUTROS: { label: 'Outros', art: 'package', color: '#6b7280' },
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
