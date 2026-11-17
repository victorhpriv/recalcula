package br.com.saldo.bill;

import br.com.saldo.common.BaseEntity;
import br.com.saldo.common.Category;
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
import java.time.YearMonth;
import java.util.UUID;

/** Conta a pagar, fixa (todo mês) ou avulsa. */
@Entity
@Table(name = "bills")
@Getter
@Setter
@NoArgsConstructor
public class Bill extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 120)
    private String description;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "due_day", nullable = false)
    private int dueDay;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;

    /** Entra no cálculo de "quanto custa morar". */
    @Column(nullable = false)
    private boolean housing;

    @Embedded
    private Recurrence recurrence;

    public boolean isActiveIn(YearMonth month) {
        return recurrence.isActiveIn(month);
    }
}
