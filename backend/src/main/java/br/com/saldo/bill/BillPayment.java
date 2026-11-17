package br.com.saldo.bill;

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

/** Registro de que uma conta foi paga em determinado mês. */
@Entity
@Table(name = "bill_payments")
@Getter
@Setter
@NoArgsConstructor
public class BillPayment extends BaseEntity {

    @Column(name = "bill_id", nullable = false)
    private UUID billId;

    @Column(name = "reference_month", nullable = false)
    private YearMonth referenceMonth;

    @Column(name = "paid_at", nullable = false)
    private Instant paidAt;
}
