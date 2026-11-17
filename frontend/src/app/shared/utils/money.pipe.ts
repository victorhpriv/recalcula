import { Pipe, PipeTransform } from '@angular/core';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatBRL(value: number | null | undefined): string {
  return BRL.format(value ?? 0);
}

@Pipe({ name: 'brl' })
export class BrlPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatBRL(value);
  }
}
