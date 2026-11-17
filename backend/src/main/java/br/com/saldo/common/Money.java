package br.com.saldo.common;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;
import java.util.function.Function;

public final class Money {

    public static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2);
    public static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private Money() {}

    public static BigDecimal of(BigDecimal value) {
        return value == null ? ZERO : value.setScale(2, RoundingMode.HALF_EVEN);
    }

    public static <T> BigDecimal sum(Collection<T> items, Function<T, BigDecimal> mapper) {
        return of(items.stream().map(mapper).reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    /** Percentual (0-100) de part sobre total, com 1 casa decimal. */
    public static BigDecimal percent(BigDecimal part, BigDecimal total) {
        if (total == null || total.signum() == 0) {
            return BigDecimal.ZERO.setScale(1);
        }
        return part.multiply(HUNDRED).divide(total, 1, RoundingMode.HALF_EVEN);
    }
}
