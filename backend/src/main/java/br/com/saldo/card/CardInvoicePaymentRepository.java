package br.com.saldo.card;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.YearMonth;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CardInvoicePaymentRepository extends JpaRepository<CardInvoicePayment, UUID> {

    List<CardInvoicePayment> findByCardIdIn(Collection<UUID> cardIds);

    Optional<CardInvoicePayment> findByCardIdAndReferenceMonth(UUID cardId, YearMonth referenceMonth);
}
