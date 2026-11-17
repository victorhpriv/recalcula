package br.com.saldo.cashflow;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CashEntryRepository extends JpaRepository<CashEntry, UUID> {

    List<CashEntry> findByUserIdAndEntryDateBetweenOrderByEntryDateDescCreatedAtDesc(UUID userId, LocalDate from, LocalDate to);

    Optional<CashEntry> findByIdAndUserId(UUID id, UUID userId);

    List<CashEntry> findByUserIdOrderByEntryDateAsc(UUID userId);
}
