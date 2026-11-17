package br.com.saldo.card;

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

/** Compra no cartão, à vista ou parcelada. As parcelas são calculadas, não persistidas. */
@Entity
@Table(name = "card_purchases")
@Getter
@Setter
@NoArgsConstructor
public class CardPurchase extends BaseEntity {

    @Column(name = "card_id", nullable = false)
    private UUID cardId;

    @Column(nullable = false, length = 120)
    private String description;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private int installments;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;
}
