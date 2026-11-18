import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';
import { I } from './icons';
import { IllustrationName } from './illustration';

const ICON: Partial<Record<IllustrationName, LucideIconData>> = {
  card: I.CreditCard,
  receipt: I.ReceiptText,
  piggy: I.PiggyBank,
  money: I.Wallet,
  flow: I.ArrowLeftRight,
  chart: I.TrendingUp,
};

/** Estado vazio: diz o que falta e oferece a ação para resolver. Projete o botão dentro. */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <span class="ic"><lucide-icon [img]="icon()" [size]="compact() ? 18 : 20" [strokeWidth]="1.8" /></span>
    <div class="t">{{ title() }}</div>
    @if (text()) { <div class="d">{{ text() }}</div> }
    <div class="a"><ng-content /></div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 2rem 1rem; gap: 0.3rem; }
    :host(.compact) { padding: 1.25rem 0.75rem; }
    .ic { width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center; margin-bottom: 0.4rem;
      color: var(--app-text-2); background: var(--app-surface-2); border: 1px solid var(--app-border); }
    .t { font-weight: 650; font-size: 0.92rem; }
    .d { color: var(--app-text-2); font-size: 0.82rem; max-width: 320px; line-height: 1.5; }
    .a:not(:empty) { margin-top: 0.8rem; }
  `,
  host: { '[class.compact]': 'compact()' },
})
export class EmptyState {
  readonly illustration = input<IllustrationName>('empty');
  readonly title = input.required<string>();
  readonly text = input<string>('');
  readonly compact = input(false);
  protected readonly icon = computed(() => ICON[this.illustration()] ?? I.Inbox);
}
