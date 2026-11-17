package br.com.saldo.common;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.YearMonth;

/**
 * Período de vigência de um lançamento mensal.
 * Recorrente: vale de startMonth até endMonth (ou indefinidamente).
 * Avulso: vale apenas em startMonth.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Recurrence {

    @Column(name = "recurring", nullable = false)
    private boolean recurring;

    @Column(name = "start_month", nullable = false)
    private YearMonth startMonth;

    @Column(name = "end_month")
    private YearMonth endMonth;

    public boolean isActiveIn(YearMonth month) {
        if (!recurring) {
            return startMonth.equals(month);
        }
        return !month.isBefore(startMonth) && (endMonth == null || !month.isAfter(endMonth));
    }

    public static Recurrence of(boolean recurring, YearMonth start, YearMonth end) {
        if (end != null && end.isBefore(start)) {
            throw new BusinessException("O mês final não pode ser anterior ao mês inicial");
        }
        return new Recurrence(recurring, start, recurring ? end : null);
    }
}
