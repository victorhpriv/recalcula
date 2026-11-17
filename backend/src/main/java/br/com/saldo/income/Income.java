package br.com.saldo.income;

import br.com.saldo.common.BaseEntity;
import br.com.saldo.common.Recurrence;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "incomes")
@Getter
@Setter
@NoArgsConstructor
public class Income extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 120)
    private String description;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IncomeType type;

    @Embedded
    private Recurrence recurrence;

    public enum IncomeType { SALARIO, FREELANCE, BENEFICIO, INVESTIMENTO, OUTRO }
}
