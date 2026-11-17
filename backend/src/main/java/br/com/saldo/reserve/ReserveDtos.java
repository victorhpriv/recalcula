package br.com.saldo.reserve;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class ReserveDtos {

    private ReserveDtos() {}

    public record GoalRequest(
            @NotBlank @Size(max = 80) String name,
            @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal targetAmount,
            @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor inválida") String color
    ) {}

    public enum MovementType { APORTE, RESGATE }

    public record MovementRequest(
            @NotNull MovementType type,
            @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal amount,
            @Size(max = 120) String description,
            @NotNull LocalDate movementDate
    ) {}

    public record GoalResponse(UUID id, String name, BigDecimal targetAmount, String color,
                               BigDecimal saved, BigDecimal percent) {}

    public record MovementResponse(UUID id, UUID goalId, String goalName, BigDecimal amount,
                                   String description, LocalDate movementDate) {}

    public record ReserveOverview(BigDecimal total, List<GoalResponse> goals, List<MovementResponse> movements) {}
}
