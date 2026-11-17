package br.com.saldo.card;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface CardPurchaseRepository extends JpaRepository<CardPurchase, UUID> {

    List<CardPurchase> findByCardIdInOrderByPurchaseDateDesc(Collection<UUID> cardIds);

    List<CardPurchase> findByCardIdOrderByPurchaseDateDesc(UUID cardId);
}
