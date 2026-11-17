package br.com.saldo.bill;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BillRepository extends JpaRepository<Bill, UUID> {

    List<Bill> findByUserIdOrderByDueDayAscDescriptionAsc(UUID userId);

    Optional<Bill> findByIdAndUserId(UUID id, UUID userId);
}
