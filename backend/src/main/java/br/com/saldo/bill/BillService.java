package br.com.saldo.bill;

import br.com.saldo.bill.BillDtos.BillRequest;
import br.com.saldo.bill.BillDtos.BillResponse;
import br.com.saldo.common.BusinessException;
import br.com.saldo.common.Money;
import br.com.saldo.common.NotFoundException;
import br.com.saldo.common.Recurrence;
import br.com.saldo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillService {

    private final BillRepository repository;
    private final BillPaymentRepository payments;
    private final Clock clock;

    /** Contas do usuário. Com mês: só as vigentes no mês, com status de pagamento. */
    @Transactional(readOnly = true)
    public List<BillResponse> list(User current, YearMonth month) {
        List<Bill> bills = month == null ? all(current.getId()) : activeIn(current.getId(), month);
        Map<UUID, BillPayment> paid = month == null ? Map.of() : paymentsFor(bills, month);
        return bills.stream().map(b -> toResponse(b, paid.get(b.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public List<Bill> activeIn(UUID userId, YearMonth month) {
        return all(userId).stream().filter(b -> b.isActiveIn(month)).toList();
    }

    @Transactional(readOnly = true)
    public Set<UUID> paidBillIds(List<Bill> bills, YearMonth month) {
        return paymentsFor(bills, month).keySet();
    }

    @Transactional
    public BillResponse create(User current, BillRequest req) {
        Bill bill = new Bill();
        bill.setUserId(current.getId());
        apply(bill, req);
        repository.save(bill);
        return toResponse(bill, null);
    }

    @Transactional
    public BillResponse update(User current, UUID id, BillRequest req) {
        Bill bill = find(current, id);
        apply(bill, req);
        return toResponse(bill, null);
    }

    @Transactional
    public void delete(User current, UUID id) {
        repository.delete(find(current, id));
    }

    @Transactional
    public BillResponse markPaid(User current, UUID id, YearMonth month) {
        Bill bill = find(current, id);
        if (!bill.isActiveIn(month)) {
            throw new BusinessException("Esta conta não está vigente no mês informado");
        }
        BillPayment payment = payments.findByBillIdAndReferenceMonth(id, month).orElseGet(() -> {
            BillPayment p = new BillPayment();
            p.setBillId(id);
            p.setReferenceMonth(month);
            p.setPaidAt(clock.instant());
            return payments.save(p);
        });
        return toResponse(bill, payment);
    }

    @Transactional
    public BillResponse markUnpaid(User current, UUID id, YearMonth month) {
        Bill bill = find(current, id);
        payments.findByBillIdAndReferenceMonth(id, month).ifPresent(payments::delete);
        return toResponse(bill, null);
    }

    private List<Bill> all(UUID userId) {
        return repository.findByUserIdOrderByDueDayAscDescriptionAsc(userId);
    }

    private static void apply(Bill bill, BillRequest req) {
        bill.setDescription(req.description().trim());
        bill.setAmount(Money.of(req.amount()));
        bill.setDueDay(req.dueDay());
        bill.setCategory(req.category());
        bill.setHousing(req.housing());
        bill.setRecurrence(Recurrence.of(req.recurring(), req.startMonth(), req.endMonth()));
    }

    private Bill find(User current, UUID id) {
        return repository.findByIdAndUserId(id, current.getId())
                .orElseThrow(() -> new NotFoundException("Conta"));
    }

    private Map<UUID, BillPayment> paymentsFor(List<Bill> bills, YearMonth month) {
        if (bills.isEmpty()) {
            return Map.of();
        }
        List<UUID> ids = bills.stream().map(Bill::getId).toList();
        return payments.findForMonth(ids, month).stream()
                .collect(Collectors.toMap(BillPayment::getBillId, Function.identity()));
    }

    private static BillResponse toResponse(Bill b, BillPayment payment) {
        Recurrence r = b.getRecurrence();
        return new BillResponse(b.getId(), b.getDescription(), b.getAmount(), b.getDueDay(), b.getCategory(),
                b.isHousing(), r.isRecurring(), r.getStartMonth(), r.getEndMonth(),
                payment != null, payment != null ? payment.getPaidAt() : null);
    }
}
