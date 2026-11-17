import { Pipe, PipeTransform } from '@angular/core';
import { monthLabel, monthShort } from './dates';

@Pipe({ name: 'month' })
export class MonthPipe implements PipeTransform {
  transform(value: string | null | undefined, format: 'long' | 'short' = 'long'): string {
    if (!value) return '';
    return format === 'short' ? monthShort(value) : monthLabel(value);
  }
}
