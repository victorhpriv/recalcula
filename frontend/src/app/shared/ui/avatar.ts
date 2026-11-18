import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="av" [style.background]="color()" [style.width.px]="size()" [style.height.px]="size()"
    [style.font-size.px]="size() * 0.45" [attr.title]="name()">{{ initial() }}</span>`,
  styles: `
    .av { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; color: #fff;
      font-weight: 700; border: 2px solid var(--app-surface); flex-shrink: 0; }
  `,
})
export class Avatar {
  readonly name = input('');
  readonly color = input('var(--app-primary)');
  readonly size = input(28);
  protected readonly initial = computed(() => (this.name().trim()[0] ?? '?').toUpperCase());
}
