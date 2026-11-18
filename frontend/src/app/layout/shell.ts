import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { MenuModule } from 'primeng/menu';
import { PopoverModule } from 'primeng/popover';
import { SplitButtonModule } from 'primeng/splitbutton';
import { ToastModule } from 'primeng/toast';

import { AuthService } from '../core/auth/auth.service';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';
import { I } from '../shared/ui/icons';
import { BRAND } from '../core/brand';
import { ApiService } from '../core/api/api.service';
import { AppState, QuickAddKind } from '../core/state/app-state.service';
import { ThemeService } from '../core/theme/theme.service';
import { Avatar } from '../shared/ui/avatar';
import { BillForm } from '../shared/forms/bill-form';
import { CashEntryForm } from '../shared/forms/cash-entry-form';
import { IncomeForm } from '../shared/forms/income-form';
import { PurchaseForm } from '../shared/forms/purchase-form';
import { fromYearMonth, toYearMonth } from '../shared/utils/dates';

interface NavItem {
  label: string;
  icon: LucideIconData;
  link: string;
}

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule, ButtonModule, SplitButtonModule, ToastModule,
    ConfirmDialogModule, MenuModule, PopoverModule, DatePickerModule, Avatar, BillForm, CashEntryForm, IncomeForm,
    PurchaseForm],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly state = inject(AppState);
  protected readonly theme = inject(ThemeService);
  private readonly api = inject(ApiService);

  protected readonly mobileOpen = signal(false);
  protected readonly I = I;
  protected readonly brand = BRAND;

  protected readonly menu: NavItem[] = [
    { label: 'Visão geral', icon: I.LayoutDashboard, link: '/' },
    { label: 'Fluxo de caixa', icon: I.ArrowLeftRight, link: '/fluxo' },
    { label: 'Cartões', icon: I.CreditCard, link: '/cartoes' },
    { label: 'Contas', icon: I.ReceiptText, link: '/contas' },
    { label: 'Reserva', icon: I.PiggyBank, link: '/reserva' },
  ];

  protected readonly settings: NavItem[] = [
    { label: 'Renda', icon: I.Wallet, link: '/renda' },
    { label: 'Minha conta', icon: I.UserRound, link: '/conta' },
  ];

  protected readonly addItems: MenuItem[] = [
    { label: 'Gasto do dia a dia', icon: 'pi pi-shopping-bag', command: () => this.add('cash') },
    { label: 'Conta a pagar', icon: 'pi pi-receipt', command: () => this.add('bill') },
    { label: 'Compra no cartão', icon: 'pi pi-credit-card', command: () => this.add('purchase') },
    { label: 'Renda', icon: 'pi pi-money-bill', command: () => this.add('income') },
  ];

  protected readonly userItems: MenuItem[] = [
    { label: 'Minha conta', icon: 'pi pi-user', routerLink: '/conta' },
    { separator: true },
    { label: 'Sair', icon: 'pi pi-sign-out', command: () => this.auth.logout() },
  ];

  protected readonly monthDate = computed(() => fromYearMonth(this.state.month()));

  // Visibilidade dos diálogos de "Adicionar" derivada do estado global
  protected readonly cashOpen = computed(() => this.state.quickAdd() === 'cash');
  protected readonly billOpen = computed(() => this.state.quickAdd() === 'bill');
  protected readonly purchaseOpen = computed(() => this.state.quickAdd() === 'purchase');
  protected readonly incomeOpen = computed(() => this.state.quickAdd() === 'income');

  protected readonly resent = signal(false);

  protected resendVerification(): void {
    this.api.resendVerification().subscribe(() => this.resent.set(true));
  }

  protected add(kind: QuickAddKind): void {
    this.state.openQuickAdd(kind);
  }

  /** Troca de tema com revelação circular a partir do botão clicado (View Transitions API). */
  protected switchTheme(theme: 'light' | 'dark', event: MouseEvent): void {
    if (this.theme.theme() === theme) return;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduce) {
      this.theme.set(theme);
      return;
    }
    const x = event.clientX;
    const y = event.clientY;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.documentElement.classList.add('theme-transition');
    const transition = doc.startViewTransition(() => this.theme.set(theme));
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 520, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
      ).finished.finally(() => document.documentElement.classList.remove('theme-transition'));
    });
  }

  protected closeQuickAdd(open: boolean): void {
    if (!open) this.state.quickAdd.set(null);
  }

  protected pickMonth(date: Date, popover: { hide: () => void }): void {
    this.state.month.set(toYearMonth(date));
    popover.hide();
  }
}
