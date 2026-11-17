import { Category, IncomeType, InvoiceStatus } from '../../core/api/models';

export interface Option<T> {
  label: string;
  value: T;
  icon?: string;
}

export const CATEGORY_META: Record<Category, { label: string; icon: string; color: string }> = {
  MORADIA: { label: 'Moradia', icon: 'pi pi-home', color: '#2f5bea' },
  ALIMENTACAO: { label: 'Alimentação', icon: 'pi pi-shopping-bag', color: '#e8792f' },
  MERCADO: { label: 'Mercado', icon: 'pi pi-shopping-cart', color: '#16a34a' },
  TRANSPORTE: { label: 'Transporte', icon: 'pi pi-car', color: '#0ea5e9' },
  SAUDE: { label: 'Saúde', icon: 'pi pi-heart', color: '#e5486b' },
  EDUCACAO: { label: 'Educação', icon: 'pi pi-book', color: '#7c3aed' },
  LAZER: { label: 'Lazer', icon: 'pi pi-face-smile', color: '#f59e0b' },
  SERVICOS: { label: 'Serviços', icon: 'pi pi-bolt', color: '#eab308' },
  CARTAO: { label: 'Cartão', icon: 'pi pi-credit-card', color: '#1e2e7a' },
  RESERVA: { label: 'Reserva', icon: 'pi pi-wallet', color: '#22a45d' },
  FAMILIA: { label: 'Família', icon: 'pi pi-users', color: '#db2777' },
  COMPRAS: { label: 'Compras', icon: 'pi pi-tag', color: '#c026d3' },
  ASSINATURAS: { label: 'Assinaturas', icon: 'pi pi-play-circle', color: '#6366f1' },
  PETS: { label: 'Pets', icon: 'pi pi-star', color: '#a16207' },
  VIAGEM: { label: 'Viagem', icon: 'pi pi-globe', color: '#0891b2' },
  SALARIO: { label: 'Salário', icon: 'pi pi-money-bill', color: '#22a45d' },
  OUTROS: { label: 'Outros', icon: 'pi pi-ellipsis-h', color: '#6b7280' },
};

export const CATEGORY_OPTIONS: Option<Category>[] = (Object.keys(CATEGORY_META) as Category[]).map((c) => ({
  label: CATEGORY_META[c].label,
  value: c,
  icon: CATEGORY_META[c].icon,
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
