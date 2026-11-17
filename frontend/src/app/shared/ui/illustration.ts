import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IllustrationName =
  | 'wallet' | 'calendar' | 'card' | 'house' | 'chart' | 'piggy' | 'money' | 'receipt' | 'flow' | 'empty' | 'rocket';

/** Ilustrações próprias (SVG em /public/illustrations), sem dependência de bancos de imagem. */
@Component({
  selector: 'app-illustration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<img [src]="'illustrations/' + name() + '.svg'" [width]="size()" [height]="size()" alt="" aria-hidden="true" decoding="async" />`,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; }
    img { display: block; transition: transform 0.35s cubic-bezier(.2,.8,.2,1); filter: drop-shadow(0 8px 14px rgba(20, 40, 120, 0.12)); }
    :host(.float) img { animation: float 5s ease-in-out infinite; }
    :host-context(.panel:hover) img { transform: translateY(-3px) rotate(-2deg); }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    @media (prefers-reduced-motion: reduce) { img { transition: none; animation: none !important; } }
  `,
})
export class Illustration {
  readonly name = input.required<IllustrationName>();
  readonly size = input(64);
}
