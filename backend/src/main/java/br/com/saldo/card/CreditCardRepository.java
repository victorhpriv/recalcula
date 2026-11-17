package br.com.saldo.card;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CreditCardRepository extends JpaRepository<CreditCard, UUID> {

    List<CreditCard> findByUserIdAndArchivedFalseOrderByCreatedAtAsc(UUID userId);

    Optional<CreditCard> findByIdAndUserIdAndArchivedFalse(UUID id, UUID userId);

    List<CreditCard> findByUserIdOrderByCreatedAtAsc(UUID userId);
}
