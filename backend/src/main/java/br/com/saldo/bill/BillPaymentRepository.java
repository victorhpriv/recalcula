package br.com.saldo.bill;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.YearMonth;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BillPaymentRepository extends JpaRepository<BillPayment, UUID> {

    @Query("select p from BillPayment p where p.billId in :billIds and p.referenceMonth = :month")
    List<BillPayment> findForMonth(@Param("billIds") Collection<UUID> billIds, @Param("month") YearMonth month);

    Optional<BillPayment> findByBillIdAndReferenceMonth(UUID billId, YearMonth referenceMonth);

    List<BillPayment> findByBillIdIn(Collection<UUID> billIds);
}
