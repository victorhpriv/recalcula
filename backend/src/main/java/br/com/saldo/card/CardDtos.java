package br.com.saldo.card;

import br.com.saldo.common.Category;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

public final class CardDtos {

    private CardDtos() {}

    public enum InvoiceStatus { ABERTA, FECHADA, PAGA, VENCIDA }

    public record CardRequest(
            @NotBlank @Size(max = 60) String name,
            @NotBlank @Size(max = 60) String bank,
            @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor inválida") String color,
            @NotNull @DecimalMin("0") @Digits(integer = 12, fraction = 2) BigDecimal creditLimit,
            @Min(1) @Max(31) int closingDay,
            @Min(1) @Max(31) int dueDay
    ) {}

    public record PurchaseRequest(
            @NotBlank @Size(max = 120) String description,
            @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal totalAmount,
            @Min(1) @Max(48) int installments,
            @NotNull @PastOrPresent LocalDate purchaseDate,
            @NotNull Category category
    ) {}

    public record InvoiceSummary(
            YearMonth month,
            BigDecimal amount,
            InvoiceStatus status,
            LocalDate closingDate,
            LocalDate dueDate
    ) {}

    public record CardResponse(
            UUID id,
            String name,
            String bank,
            String color,
            BigDecimal creditLimit,
            BigDecimal used,
            BigDecimal available,
            int closingDay,
            int dueDay,
            InvoiceSummary invoice
    ) {}

    public record InvoiceItem(
            UUID purchaseId,
            String description,
            Category category,
            LocalDate purchaseDate,
            int installmentNumber,
            int installments,
            BigDecimal amount
    ) {}

    public record InvoiceResponse(UUID cardId, String cardName, InvoiceSummary summary, List<InvoiceItem> items) {}

    public record PurchaseResponse(
            UUID id,
            UUID cardId,
            String description,
            BigDecimal totalAmount,
            int installments,
            LocalDate purchaseDate,
            Category category,
            YearMonth firstDueMonth
    ) {}
}
