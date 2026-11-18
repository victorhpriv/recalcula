import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';

const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Exibe valores em reais no estilo "R$ 5.304,28", com centavos menores e contagem animada. */
@Component({
  selector: 'app-money',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="money" [class]="size()" [class.neg]="negative()" [attr.aria-label]="label()">
      @if (approx()) { <span class="approx">≈</span> }
      <span class="cur" aria-hidden="true">R$</span>
      <span class="int" aria-hidden="true">{{ parts().int }}</span><span class="cents" aria-hidden="true">,{{ parts().cents }}</span>
    </span>
  `,
  styles: `
    .money { font-variant-numeric: proportional-nums; display: inline-flex; align-items: baseline; gap: 0.16em; font-weight: 700; letter-spacing: -0.035em; color: var(--app-text); white-space: nowrap; }
    .cur { color: var(--app-text-3); font-weight: 500; font-size: 0.5em; margin-right: 0.12em; letter-spacing: 0; }
    .cents { font-size: 0.5em; color: var(--app-text-3); font-weight: 500; margin-left: -0.1em; letter-spacing: 0; }
    .approx { font-size: 0.6em; color: var(--app-text-2); }
    .neg .int, .neg .cents { color: var(--app-red); }
    .xl { font-size: 3rem; }
    .lg { font-size: 1.75rem; }
    .md { font-size: 1.25rem; }
    .sm { font-size: 1rem; }
  `,
})
export class Money {
  readonly value = input<number | null | undefined>(0);
  readonly size = input<'xl' | 'lg' | 'md' | 'sm'>('lg');
  readonly approx = input(false);
  /** Desliga a animação de contagem. */
  readonly static = input(false);

  private readonly shown = signal(0);
  private frame = 0;
  private initialized = false;

  protected readonly negative = computed(() => (this.value() ?? 0) < 0);
  protected readonly label = computed(() =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(this.value() ?? 0),
  );
  protected readonly parts = computed(() => {
    const v = this.shown();
    const [int, cents] = Math.abs(v).toFixed(2).split('.');
    return { int: (v < 0 ? '-' : '') + Number(int).toLocaleString('pt-BR'), cents };
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.frame));
    effect(() => {
      const target = this.value() ?? 0;
      untracked(() => this.animateTo(target));
    });
  }

  private animateTo(target: number): void {
    cancelAnimationFrame(this.frame);
    const from = this.shown();
    // Primeira exibição sem animação; anima só quando o valor muda (ex.: troca de mês).
    if (!this.initialized || REDUCED_MOTION || this.static() || from === target) {
      this.initialized = true;
      this.shown.set(target);
      return;
    }
    const start = performance.now();
    const duration = 650;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      this.shown.set(t === 1 ? target : from + (target - from) * eased);
      if (t < 1) this.frame = requestAnimationFrame(step);
    };
    this.frame = requestAnimationFrame(step);
  }
}
