package br.com.saldo.income;

import br.com.saldo.common.Money;
import br.com.saldo.common.NotFoundException;
import br.com.saldo.common.Recurrence;
import br.com.saldo.income.IncomeDtos.IncomeRequest;
import br.com.saldo.income.IncomeDtos.IncomeResponse;
import br.com.saldo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IncomeService {

    private final IncomeRepository repository;

    @Transactional(readOnly = true)
    public List<IncomeResponse> list(User current, YearMonth month) {
        return repository.findByUserIdOrderByCreatedAtAsc(current.getId()).stream()
                .map(i -> toResponse(i, month))
                .toList();
    }

    @Transactional
    public IncomeResponse create(User current, IncomeRequest req) {
        Income income = new Income();
        income.setUserId(current.getId());
        apply(income, req);
        repository.save(income);
        return toResponse(income, req.startMonth());
    }

    @Transactional
    public IncomeResponse update(User current, UUID id, IncomeRequest req) {
        Income income = find(current, id);
        apply(income, req);
        return toResponse(income, req.startMonth());
    }

    @Transactional
    public void delete(User current, UUID id) {
        repository.delete(find(current, id));
    }

    /** Renda total do usuário no mês. */
    @Transactional(readOnly = true)
    public BigDecimal totalFor(UUID userId, YearMonth month) {
        return Money.sum(repository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .filter(i -> i.getRecurrence().isActiveIn(month))
                .toList(), Income::getAmount);
    }

    private static void apply(Income income, IncomeRequest req) {
        income.setDescription(req.description().trim());
        income.setAmount(Money.of(req.amount()));
        income.setType(req.type());
        income.setRecurrence(Recurrence.of(req.recurring(), req.startMonth(), req.endMonth()));
    }

    private Income find(User current, UUID id) {
        return repository.findByIdAndUserId(id, current.getId())
                .orElseThrow(() -> new NotFoundException("Renda"));
    }

    private static IncomeResponse toResponse(Income i, YearMonth month) {
        Recurrence r = i.getRecurrence();
        return new IncomeResponse(i.getId(), i.getDescription(), i.getAmount(), i.getType(),
                r.isRecurring(), r.getStartMonth(), r.getEndMonth(), month != null && r.isActiveIn(month));
    }
}
