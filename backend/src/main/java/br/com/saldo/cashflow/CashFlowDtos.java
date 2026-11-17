package br.com.saldo.cashflow;

import br.com.saldo.common.Category;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

public final class CashFlowDtos {

    private CashFlowDtos() {}

    public record CashEntryRequest(
            @NotNull CashEntry.Type type,
            @NotBlank @Size(max = 120) String description,
            @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal amount,
            @NotNull LocalDate entryDate,
            @NotNull Category category
    ) {}

    public record CashEntryResponse(
            UUID id,
            CashEntry.Type type,
            String description,
            BigDecimal amount,
            LocalDate entryDate,
            Category category
    ) {}

    public record CategoryTotal(Category category, BigDecimal amount) {}

    public record CashFlowMonth(
            YearMonth month,
            BigDecimal totalIn,
            BigDecimal totalOut,
            BigDecimal balance,
            List<CategoryTotal> outByCategory,
            List<CashEntryResponse> entries
    ) {}
}
