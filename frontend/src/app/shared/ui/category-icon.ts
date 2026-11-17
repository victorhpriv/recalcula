import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Category } from '../../core/api/models';
import { CATEGORY_META } from '../utils/labels';

/** Ícone da categoria em um quadrado com a cor da categoria. */
@Component({
  selector: 'app-category-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="ci" [style.--c]="meta().color" [style.width.px]="size()" [style.height.px]="size()" [attr.title]="meta().label"><i [class]="meta().icon"></i></span>`,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; }
    .ci { display: grid; place-items: center; border-radius: 30%; color: var(--c);
      background: color-mix(in srgb, var(--c) 13%, transparent); }
    i { font-size: 0.82rem; }
  `,
})
export class CategoryIcon {
  readonly category = input.required<Category>();
  readonly size = input(34);
  protected readonly meta = computed(() => CATEGORY_META[this.category()]);
}
