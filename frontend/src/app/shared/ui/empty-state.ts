import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Illustration, IllustrationName } from './illustration';

/** Estado vazio ilustrado. Projete um botão de ação dentro, se quiser. */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Illustration],
  template: `
    <app-illustration [name]="illustration()" [size]="compact() ? 64 : 96" />
    <div class="t">{{ title() }}</div>
    @if (text()) { <div class="d">{{ text() }}</div> }
    <div class="a"><ng-content /></div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 1.75rem 1rem; gap: 0.35rem; }
    .t { font-weight: 700; font-size: 0.92rem; margin-top: 0.5rem; }
    .d { color: var(--app-text-2); font-size: 0.8rem; max-width: 300px; line-height: 1.45; }
    .a:not(:empty) { margin-top: 0.75rem; }
  `,
  host: { '[class.compact]': 'compact()' },
})
export class EmptyState {
  readonly illustration = input<IllustrationName>('empty');
  readonly title = input.required<string>();
  readonly text = input<string>('');
  readonly compact = input(false);
}
