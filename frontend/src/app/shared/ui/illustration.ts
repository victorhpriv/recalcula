import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Ilustrações 3D (Fluent Emoji, MIT) com nomes semânticos usados no app. */
const ART = {
  wallet: 'purse',
  calendar: 'spiral-calendar',
  card: 'credit-card',
  house: 'house',
  chart: 'bar-chart',
  piggy: 'money-bag',
  money: 'dollar-banknote',
  receipt: 'receipt',
  flow: 'chart-increasing',
  empty: 'inbox-tray',
  rocket: 'rocket',
  shield: 'shield',
  party: 'party-popper',
  check: 'check-mark-button',
  sparkles: 'sparkles',
  bell: 'bell',
  coin: 'coin',
  target: 'bullseye',
  envelope: 'envelope',
  key: 'key',
  lock: 'locked',
  wave: 'waving-hand',
  trophy: 'trophy',
  search: 'magnifying-glass-tilted-left',
  wings: 'money-with-wings',
  bulb: 'light-bulb',
} as const;

export type IllustrationName = keyof typeof ART;

@Component({
  selector: 'app-illustration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<img [src]="src()" [width]="size()" [height]="size()" alt="" aria-hidden="true" decoding="async" draggable="false" />`,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; }
    img { display: block; transition: transform 0.45s cubic-bezier(.2,.8,.2,1); filter: drop-shadow(0 10px 14px rgba(20, 40, 120, 0.14)); user-select: none; }
    :host(.float) img { animation: float 5s ease-in-out infinite; }
    :host-context(.panel:hover) img { transform: translateY(-4px) rotate(-4deg) scale(1.04); }
    @keyframes float { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-7px) rotate(-3deg); } }
    @media (prefers-reduced-motion: reduce) { img { transition: none; animation: none !important; } }
  `,
})
export class Illustration {
  readonly name = input.required<IllustrationName>();
  readonly size = input(64);
  protected readonly src = computed(() => `3d/${ART[this.name()]}.webp`);
}
