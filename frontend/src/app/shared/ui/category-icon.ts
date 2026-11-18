import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Category } from '../../core/api/models';
import { CATEGORY_META, categoryArt } from '../utils/labels';

/** Ícone 3D da categoria sobre um fundo suave com a cor da categoria. */
@Component({
  selector: 'app-category-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="ci" [style.--c]="meta().color" [style.width.px]="size()" [style.height.px]="size()" [attr.title]="meta().label">
      <img [src]="src()" [width]="size() * 0.66" [height]="size() * 0.66" alt="" draggable="false" />
    </span>
  `,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; }
    .ci { display: grid; place-items: center; border-radius: 32%;
      background: color-mix(in srgb, var(--c) 12%, transparent);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 14%, transparent);
      transition: transform 0.25s cubic-bezier(.2,.8,.2,1); }
    img { display: block; filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.12)); }
    :host-context(.list-row:hover) .ci, :host-context(tr:hover) .ci { transform: scale(1.08) rotate(-4deg); }
  `,
})
export class CategoryIcon {
  readonly category = input.required<Category>();
  readonly size = input(36);
  protected readonly meta = computed(() => CATEGORY_META[this.category()]);
  protected readonly src = computed(() => categoryArt(this.category()));
}
