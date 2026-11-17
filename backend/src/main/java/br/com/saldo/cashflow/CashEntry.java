package br.com.saldo.cashflow;

import br.com.saldo.common.BaseEntity;
import br.com.saldo.common.Category;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Lançamento do dia a dia (entrada ou saída avulsa). */
@Entity
@Table(name = "cash_entries")
@Getter
@Setter
@NoArgsConstructor
public class CashEntry extends BaseEntity {

    public enum Type { ENTRADA, SAIDA }

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Type type;

    @Column(nullable = false, length = 120)
    private String description;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;
}
