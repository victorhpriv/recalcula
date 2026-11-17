// Tipos espelhando os DTOs da API Spring. Datas/meses trafegam como string ISO ("2026-12", "2026-12-05").

export type YearMonthStr = string;
export type IsoDate = string;

export type Category =
  | 'MORADIA' | 'ALIMENTACAO' | 'MERCADO' | 'TRANSPORTE' | 'SAUDE' | 'EDUCACAO' | 'LAZER' | 'SERVICOS'
  | 'CARTAO' | 'RESERVA' | 'FAMILIA' | 'COMPRAS' | 'ASSINATURAS' | 'PETS' | 'VIAGEM' | 'SALARIO' | 'OUTROS';
export type IncomeType = 'SALARIO' | 'FREELANCE' | 'BENEFICIO' | 'INVESTIMENTO' | 'OUTRO';
export type InvoiceStatus = 'ABERTA' | 'FECHADA' | 'PAGA' | 'VENCIDA';
export type CashEntryType = 'ENTRADA' | 'SAIDA';

// ---------- auth ----------
export interface Me {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
}

export interface Account extends Me {
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: Me;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
  acceptTerms: boolean;
}

// ---------- renda ----------
export interface IncomeRequest {
  description: string;
  amount: number;
  type: IncomeType;
  recurring: boolean;
  startMonth: YearMonthStr;
  endMonth?: YearMonthStr | null;
}

export interface Income extends IncomeRequest {
  id: string;
  activeInMonth: boolean;
}

// ---------- contas ----------
export interface BillRequest {
  description: string;
  amount: number;
  dueDay: number;
  category: Category;
  housing: boolean;
  recurring: boolean;
  startMonth: YearMonthStr;
  endMonth?: YearMonthStr | null;
}

export interface Bill extends BillRequest {
  id: string;
  paid: boolean;
  paidAt: string | null;
}

// ---------- cartões ----------
export interface CardRequest {
  name: string;
  bank: string;
  color: string;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
}

export interface InvoiceSummary {
  month: YearMonthStr;
  amount: number;
  status: InvoiceStatus;
  closingDate: IsoDate;
  dueDate: IsoDate;
}

export interface Card extends CardRequest {
  id: string;
  used: number;
  available: number;
  invoice: InvoiceSummary;
}

export interface InvoiceItem {
  purchaseId: string;
  description: string;
  category: Category;
  purchaseDate: IsoDate;
  installmentNumber: number;
  installments: number;
  amount: number;
}

export interface Invoice {
  cardId: string;
  cardName: string;
  summary: InvoiceSummary;
  items: InvoiceItem[];
}

export interface PurchaseRequest {
  description: string;
  totalAmount: number;
  installments: number;
  purchaseDate: IsoDate;
  category: Category;
}

export interface Purchase extends PurchaseRequest {
  id: string;
  cardId: string;
  firstDueMonth: YearMonthStr;
}

// ---------- fluxo de caixa ----------
export interface CashEntryRequest {
  type: CashEntryType;
  description: string;
  amount: number;
  entryDate: IsoDate;
  category: Category;
}

export interface CashEntry extends CashEntryRequest {
  id: string;
}

export interface CashFlowMonth {
  month: YearMonthStr;
  totalIn: number;
  totalOut: number;
  balance: number;
  outByCategory: { category: Category; amount: number }[];
  entries: CashEntry[];
}

// ---------- reserva ----------
export interface GoalRequest {
  name: string;
  targetAmount: number;
  color: string;
}

export interface Goal extends GoalRequest {
  id: string;
  saved: number;
  percent: number;
}

export interface MovementRequest {
  type: 'APORTE' | 'RESGATE';
  amount: number;
  description?: string | null;
  movementDate: IsoDate;
}

export interface Movement {
  id: string;
  goalId: string;
  goalName: string;
  amount: number;
  description: string | null;
  movementDate: IsoDate;
}

export interface ReserveOverview {
  total: number;
  goals: Goal[];
  movements: Movement[];
}

// ---------- dashboard ----------
export interface Balance {
  income: number;
  bills: number;
  cards: number;
  daily: number;
  projected: number;
  freePercent: number;
}

export interface UpcomingItem {
  id: string;
  kind: 'BILL' | 'INVOICE';
  description: string;
  amount: number;
  dueDay: number;
  paid: boolean;
}

export interface Dashboard {
  month: YearMonthStr;
  balance: Balance;
  spending: {
    total: number;
    categories: { category: Category; amount: number; percent: number }[];
  };
  cards: {
    totalInvoices: number;
    cards: Card[];
    next: { month: YearMonthStr; amount: number }[];
  };
  upcoming: {
    totalPending: number;
    paidCount: number;
    totalCount: number;
    dueDays: number[];
    items: UpcomingItem[];
  };
  housing: {
    amount: number;
    income: number;
    percent: number;
    referencePercent: number;
    items: { description: string; category: Category; amount: number }[];
  };
  reserveTotal: number;
}

/** Corpo de erro RFC 7807 retornado pela API. */
export interface ProblemDetail {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string>;
}
