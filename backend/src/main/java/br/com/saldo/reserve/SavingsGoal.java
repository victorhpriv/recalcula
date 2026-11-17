package br.com.saldo.reserve;

import br.com.saldo.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/** Caixinha/objetivo da reserva (ex.: emergência, viagem). */
@Entity
@Table(name = "savings_goals")
@Getter
@Setter
@NoArgsConstructor
public class SavingsGoal extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "target_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal targetAmount;

    @Column(nullable = false, length = 9)
    private String color;
}
