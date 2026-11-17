import { IsoDate, YearMonthStr } from '../../core/api/models';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const pad = (n: number) => String(n).padStart(2, '0');

export function currentMonth(): YearMonthStr {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function addMonths(m: YearMonthStr, delta: number): YearMonthStr {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthLabel(m: YearMonthStr): string {
  const [y, mo] = m.split('-').map(Number);
  return `${MONTHS[mo - 1]} ${y}`;
}

export function monthShort(m: YearMonthStr): string {
  const [y, mo] = m.split('-').map(Number);
  return `${MONTHS_SHORT[mo - 1]} ${String(y).slice(2)}`;
}

export function monthName(m: YearMonthStr): string {
  return MONTHS[Number(m.split('-')[1]) - 1];
}

/** Date (do DatePicker) → "2026-12" */
export function toYearMonth(d: Date): YearMonthStr {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** "2026-12" → Date no dia 1 */
export function fromYearMonth(m: YearMonthStr): Date {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1);
}

/** Date → "2026-12-05" (sem conversão de fuso) */
export function toIsoDate(d: Date): IsoDate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromIsoDate(s: IsoDate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayInMonth(m: YearMonthStr): Date {
  const now = new Date();
  return toYearMonth(now) === m ? now : fromYearMonth(m);
}
