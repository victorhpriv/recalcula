package br.com.saldo.bill;

import br.com.saldo.common.Category;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.util.UUID;

public final class BillDtos {

    private BillDtos() {}

    public record BillRequest(
            @NotBlank @Size(max = 120) String description,
            @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal amount,
            @Min(1) @Max(31) int dueDay,
            @NotNull Category category,
            boolean housing,
            boolean recurring,
            @NotNull YearMonth startMonth,
            YearMonth endMonth
    ) {}

    public record BillResponse(
            UUID id,
            String description,
            BigDecimal amount,
            int dueDay,
            Category category,
            boolean housing,
            boolean recurring,
            YearMonth startMonth,
            YearMonth endMonth,
            boolean paid,
            Instant paidAt
    ) {}
}
