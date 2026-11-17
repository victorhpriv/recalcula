package br.com.saldo.reserve;

import br.com.saldo.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Aporte (valor positivo) ou resgate (valor negativo) em um objetivo. */
@Entity
@Table(name = "reserve_movements")
@Getter
@Setter
@NoArgsConstructor
public class ReserveMovement extends BaseEntity {

    @Column(name = "goal_id", nullable = false)
    private UUID goalId;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(length = 120)
    private String description;

    @Column(name = "movement_date", nullable = false)
    private LocalDate movementDate;
}
