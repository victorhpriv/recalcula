import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canMatch: [guestGuard],
    title: 'Entrar · Recalcula',
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    path: 'cadastro',
    canMatch: [guestGuard],
    title: 'Criar conta · Recalcula',
    loadComponent: () => import('./features/auth/register').then((m) => m.Register),
  },
  {
    path: 'esqueci-senha',
    canMatch: [guestGuard],
    title: 'Esqueci minha senha · Recalcula',
    loadComponent: () => import('./features/auth/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'redefinir-senha',
    title: 'Nova senha · Recalcula',
    loadComponent: () => import('./features/auth/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'confirmar-email',
    title: 'Confirmar e-mail · Recalcula',
    loadComponent: () => import('./features/auth/verify-email').then((m) => m.VerifyEmail),
  },
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', title: 'Visão geral', loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage) },
      { path: 'fluxo', title: 'Fluxo de caixa', loadComponent: () => import('./features/cash-flow/cash-flow').then((m) => m.CashFlowPage) },
      { path: 'cartoes', title: 'Cartões', loadComponent: () => import('./features/cards/cards').then((m) => m.CardsPage) },
      { path: 'reserva', title: 'Reserva', loadComponent: () => import('./features/reserve/reserve').then((m) => m.ReservePage) },
      { path: 'renda', title: 'Renda', loadComponent: () => import('./features/incomes/incomes').then((m) => m.IncomesPage) },
      { path: 'conta', title: 'Minha conta', loadComponent: () => import('./features/account/account').then((m) => m.AccountPage) },
      { path: 'contas', title: 'Contas', loadComponent: () => import('./features/bills/bills').then((m) => m.BillsPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
