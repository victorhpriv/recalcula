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
  icon: string;
  link: string;
}

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, ButtonModule, SplitButtonModule, ToastModule,
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

  protected readonly menu: NavItem[] = [
    { label: 'Visão geral', icon: 'pi pi-th-large', link: '/' },
    { label: 'Fluxo de caixa', icon: 'pi pi-arrow-right-arrow-left', link: '/fluxo' },
    { label: 'Cartões', icon: 'pi pi-credit-card', link: '/cartoes' },
    { label: 'Contas', icon: 'pi pi-receipt', link: '/contas' },
    { label: 'Reserva', icon: 'pi pi-wallet', link: '/reserva' },
  ];

  protected readonly settings: NavItem[] = [
    { label: 'Renda', icon: 'pi pi-money-bill', link: '/renda' },
    { label: 'Minha conta', icon: 'pi pi-user', link: '/conta' },
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

  protected closeQuickAdd(open: boolean): void {
    if (!open) this.state.quickAdd.set(null);
  }

  protected pickMonth(date: Date, popover: { hide: () => void }): void {
    this.state.month.set(toYearMonth(date));
    popover.hide();
  }
}
