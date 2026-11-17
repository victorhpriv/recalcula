package br.com.saldo.card;

import br.com.saldo.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.YearMonth;
import java.util.UUID;

@Entity
@Table(name = "card_invoice_payments")
@Getter
@Setter
@NoArgsConstructor
public class CardInvoicePayment extends BaseEntity {

    @Column(name = "card_id", nullable = false)
    private UUID cardId;

    /** Mês de vencimento da fatura. */
    @Column(name = "reference_month", nullable = false)
    private YearMonth referenceMonth;

    @Column(name = "paid_at", nullable = false)
    private Instant paidAt;
}
