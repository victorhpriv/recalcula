package br.com.saldo.reserve;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SavingsGoalRepository extends JpaRepository<SavingsGoal, UUID> {

    List<SavingsGoal> findByUserIdOrderByCreatedAtAsc(UUID userId);

    Optional<SavingsGoal> findByIdAndUserId(UUID id, UUID userId);
}
