package br.com.saldo.card;

import br.com.saldo.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Cartão de crédito. Não armazenamos número, CVV nem validade: apenas apelido, banco e regras da fatura.
 */
@Entity
@Table(name = "credit_cards")
@Getter
@Setter
@NoArgsConstructor
public class CreditCard extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(nullable = false, length = 60)
    private String bank;

    @Column(nullable = false, length = 9)
    private String color;

    @Column(name = "credit_limit", nullable = false, precision = 14, scale = 2)
    private BigDecimal creditLimit;

    @Column(name = "closing_day", nullable = false)
    private int closingDay;

    @Column(name = "due_day", nullable = false)
    private int dueDay;

    @Column(nullable = false)
    private boolean archived;
}
