import { Injectable, computed, signal } from '@angular/core';

import { YearMonthStr } from '../api/models';
import { addMonths, currentMonth, monthLabel } from '../../shared/utils/dates';

export type QuickAddKind = 'cash' | 'bill' | 'purchase' | 'income';

/**
 * Estado global da UI:
 * - mês selecionado (compartilhado por todas as telas);
 * - versão dos dados, incrementada após qualquer alteração para as telas recarregarem;
 * - qual diálogo de "Adicionar" está aberto.
 */
@Injectable({ providedIn: 'root' })
export class AppState {
  readonly month = signal<YearMonthStr>(currentMonth());
  readonly monthLabel = computed(() => monthLabel(this.month()));
  readonly version = signal(0);
  readonly quickAdd = signal<QuickAddKind | null>(null);

  previousMonth(): void {
    this.month.update((m) => addMonths(m, -1));
  }

  nextMonth(): void {
    this.month.update((m) => addMonths(m, 1));
  }

  goToCurrentMonth(): void {
    this.month.set(currentMonth());
  }

  dataChanged(): void {
    this.version.update((v) => v + 1);
  }

  openQuickAdd(kind: QuickAddKind): void {
    this.quickAdd.set(kind);
  }
}
