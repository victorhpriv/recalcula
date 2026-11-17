package br.com.saldo.income;

import br.com.saldo.income.Income.IncomeType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.UUID;

public final class IncomeDtos {

    private IncomeDtos() {}

    public record IncomeRequest(
            @NotBlank @Size(max = 120) String description,
            @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal amount,
            @NotNull IncomeType type,
            boolean recurring,
            @NotNull YearMonth startMonth,
            YearMonth endMonth
    ) {}

    public record IncomeResponse(
            UUID id,
            String description,
            BigDecimal amount,
            IncomeType type,
            boolean recurring,
            YearMonth startMonth,
            YearMonth endMonth,
            boolean activeInMonth
    ) {}
}
