import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Account, Bill, BillRequest, Card, CardRequest, CashEntry, CashEntryRequest, CashFlowMonth, Dashboard, GoalRequest,
  Income, IncomeRequest, Invoice, InvoiceSummary, MovementRequest, Purchase, PurchaseRequest, ReserveOverview,
  YearMonthStr,
} from './models';

const month = (m: YearMonthStr) => new HttpParams().set('month', m);

/** Cliente HTTP tipado da API. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  // ---------- dashboard ----------
  dashboard(m: YearMonthStr): Observable<Dashboard> {
    return this.http.get<Dashboard>('/api/dashboard', { params: month(m) });
  }

  // ---------- conta ----------
  account(): Observable<Account> {
    return this.http.get<Account>('/api/account');
  }
  updateProfile(name: string): Observable<Account> {
    return this.http.put<Account>('/api/account/profile', { name });
  }
  resendVerification(): Observable<void> {
    return this.http.post<void>('/api/account/resend-verification', null);
  }
  exportData(): Observable<Blob> {
    return this.http.get('/api/account/export', { responseType: 'blob' });
  }
  deleteAccount(password: string): Observable<void> {
    return this.http.post<void>('/api/account/delete', { password }, { withCredentials: true });
  }

  // ---------- renda ----------
  incomes(m?: YearMonthStr): Observable<Income[]> {
    return this.http.get<Income[]>('/api/incomes', { params: m ? month(m) : undefined });
  }
  createIncome(body: IncomeRequest): Observable<Income> {
    return this.http.post<Income>('/api/incomes', body);
  }
  updateIncome(id: string, body: IncomeRequest): Observable<Income> {
    return this.http.put<Income>(`/api/incomes/${id}`, body);
  }
  deleteIncome(id: string): Observable<void> {
    return this.http.delete<void>(`/api/incomes/${id}`);
  }

  // ---------- contas ----------
  bills(m?: YearMonthStr): Observable<Bill[]> {
    return this.http.get<Bill[]>('/api/bills', { params: m ? month(m) : undefined });
  }
  createBill(body: BillRequest): Observable<Bill> {
    return this.http.post<Bill>('/api/bills', body);
  }
  updateBill(id: string, body: BillRequest): Observable<Bill> {
    return this.http.put<Bill>(`/api/bills/${id}`, body);
  }
  deleteBill(id: string): Observable<void> {
    return this.http.delete<void>(`/api/bills/${id}`);
  }
  payBill(id: string, m: YearMonthStr): Observable<Bill> {
    return this.http.post<Bill>(`/api/bills/${id}/payments`, null, { params: month(m) });
  }
  unpayBill(id: string, m: YearMonthStr): Observable<Bill> {
    return this.http.delete<Bill>(`/api/bills/${id}/payments`, { params: month(m) });
  }

  // ---------- cartões ----------
  cards(m: YearMonthStr): Observable<Card[]> {
    return this.http.get<Card[]>('/api/cards', { params: month(m) });
  }
  createCard(body: CardRequest): Observable<Card> {
    return this.http.post<Card>('/api/cards', body);
  }
  updateCard(id: string, body: CardRequest): Observable<Card> {
    return this.http.put<Card>(`/api/cards/${id}`, body);
  }
  archiveCard(id: string): Observable<void> {
    return this.http.delete<void>(`/api/cards/${id}`);
  }
  invoice(cardId: string, m: YearMonthStr): Observable<Invoice> {
    return this.http.get<Invoice>(`/api/cards/${cardId}/invoices/${m}`);
  }
  upcomingInvoices(cardId: string, from: YearMonthStr, count = 3): Observable<InvoiceSummary[]> {
    return this.http.get<InvoiceSummary[]>(`/api/cards/${cardId}/invoices`, {
      params: new HttpParams().set('from', from).set('count', count),
    });
  }
  payInvoice(cardId: string, m: YearMonthStr): Observable<InvoiceSummary> {
    return this.http.post<InvoiceSummary>(`/api/cards/${cardId}/invoices/${m}/payment`, null);
  }
  unpayInvoice(cardId: string, m: YearMonthStr): Observable<InvoiceSummary> {
    return this.http.delete<InvoiceSummary>(`/api/cards/${cardId}/invoices/${m}/payment`);
  }
  purchases(cardId: string): Observable<Purchase[]> {
    return this.http.get<Purchase[]>(`/api/cards/${cardId}/purchases`);
  }
  addPurchase(cardId: string, body: PurchaseRequest): Observable<Purchase> {
    return this.http.post<Purchase>(`/api/cards/${cardId}/purchases`, body);
  }
  updatePurchase(cardId: string, id: string, body: PurchaseRequest): Observable<Purchase> {
    return this.http.put<Purchase>(`/api/cards/${cardId}/purchases/${id}`, body);
  }
  deletePurchase(cardId: string, id: string): Observable<void> {
    return this.http.delete<void>(`/api/cards/${cardId}/purchases/${id}`);
  }

  // ---------- fluxo de caixa ----------
  cashFlow(m: YearMonthStr): Observable<CashFlowMonth> {
    return this.http.get<CashFlowMonth>('/api/cash-flow', { params: month(m) });
  }
  createCashEntry(body: CashEntryRequest): Observable<CashEntry> {
    return this.http.post<CashEntry>('/api/cash-flow', body);
  }
  updateCashEntry(id: string, body: CashEntryRequest): Observable<CashEntry> {
    return this.http.put<CashEntry>(`/api/cash-flow/${id}`, body);
  }
  deleteCashEntry(id: string): Observable<void> {
    return this.http.delete<void>(`/api/cash-flow/${id}`);
  }

  // ---------- reserva ----------
  reserve(): Observable<ReserveOverview> {
    return this.http.get<ReserveOverview>('/api/reserve');
  }
  createGoal(body: GoalRequest): Observable<ReserveOverview> {
    return this.http.post<ReserveOverview>('/api/reserve/goals', body);
  }
  updateGoal(id: string, body: GoalRequest): Observable<ReserveOverview> {
    return this.http.put<ReserveOverview>(`/api/reserve/goals/${id}`, body);
  }
  deleteGoal(id: string): Observable<ReserveOverview> {
    return this.http.delete<ReserveOverview>(`/api/reserve/goals/${id}`);
  }
  addMovement(goalId: string, body: MovementRequest): Observable<ReserveOverview> {
    return this.http.post<ReserveOverview>(`/api/reserve/goals/${goalId}/movements`, body);
  }
  deleteMovement(goalId: string, id: string): Observable<ReserveOverview> {
    return this.http.delete<ReserveOverview>(`/api/reserve/goals/${goalId}/movements/${id}`);
  }
}
