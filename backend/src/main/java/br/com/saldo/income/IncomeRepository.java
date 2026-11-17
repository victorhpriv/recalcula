package br.com.saldo.income;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IncomeRepository extends JpaRepository<Income, UUID> {

    List<Income> findByUserIdOrderByCreatedAtAsc(UUID userId);

    Optional<Income> findByIdAndUserId(UUID id, UUID userId);
}
