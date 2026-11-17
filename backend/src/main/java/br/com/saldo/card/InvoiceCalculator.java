package br.com.saldo.card;

import br.com.saldo.common.Money;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

/**
 * Regras de fatura (funções puras, fáceis de testar).
 * - Compra feita ANTES do dia de fechamento entra na fatura que fecha no mesmo mês;
 *   no dia do fechamento ou depois, entra na fatura do mês seguinte.
 * - Se o vencimento é depois do fechamento no calendário, vence no mesmo mês do fechamento;
 *   caso contrário, no mês seguinte.
 * - Parcelas: valor total / n, com a sobra de centavos na primeira parcela.
 */
public final class InvoiceCalculator {

    private InvoiceCalculator() {}

    public record Installment(int number, int total, YearMonth dueMonth, BigDecimal amount) {}

    public static YearMonth firstDueMonth(LocalDate purchaseDate, int closingDay, int dueDay) {
        YearMonth purchaseMonth = YearMonth.from(purchaseDate);
        int effectiveClosing = clamp(purchaseMonth, closingDay);
        YearMonth closingMonth = purchaseDate.getDayOfMonth() < effectiveClosing ? purchaseMonth : purchaseMonth.plusMonths(1);
        return dueDay > closingDay ? closingMonth : closingMonth.plusMonths(1);
    }

    public static List<Installment> installments(BigDecimal total, int count, YearMonth firstDue) {
        BigDecimal base = total.divide(BigDecimal.valueOf(count), 2, RoundingMode.DOWN);
        BigDecimal remainder = total.subtract(base.multiply(BigDecimal.valueOf(count)));
        List<Installment> list = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            BigDecimal amount = i == 0 ? base.add(remainder) : base;
            list.add(new Installment(i + 1, count, firstDue.plusMonths(i), Money.of(amount)));
        }
        return list;
    }

    public static List<Installment> installmentsOf(CardPurchase p, CreditCard card) {
        return installments(p.getTotalAmount(), p.getInstallments(),
                firstDueMonth(p.getPurchaseDate(), card.getClosingDay(), card.getDueDay()));
    }

    public static LocalDate dueDate(YearMonth dueMonth, int dueDay) {
        return dueMonth.atDay(clamp(dueMonth, dueDay));
    }

    public static LocalDate closingDate(YearMonth dueMonth, int closingDay, int dueDay) {
        YearMonth closingMonth = dueDay > closingDay ? dueMonth : dueMonth.minusMonths(1);
        return closingMonth.atDay(clamp(closingMonth, closingDay));
    }

    private static int clamp(YearMonth month, int day) {
        return Math.min(day, month.lengthOfMonth());
    }
}
