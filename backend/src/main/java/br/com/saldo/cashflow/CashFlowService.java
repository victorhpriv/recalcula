package br.com.saldo.cashflow;

import br.com.saldo.cashflow.CashFlowDtos.CashEntryRequest;
import br.com.saldo.cashflow.CashFlowDtos.CashEntryResponse;
import br.com.saldo.cashflow.CashFlowDtos.CashFlowMonth;
import br.com.saldo.cashflow.CashFlowDtos.CategoryTotal;
import br.com.saldo.common.Category;
import br.com.saldo.common.Money;
import br.com.saldo.common.NotFoundException;
import br.com.saldo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CashFlowService {

    private final CashEntryRepository repository;

    @Transactional(readOnly = true)
    public List<CashEntry> entries(UUID userId, YearMonth month) {
        return repository.findByUserIdAndEntryDateBetweenOrderByEntryDateDescCreatedAtDesc(
                userId, month.atDay(1), month.atEndOfMonth());
    }

    @Transactional(readOnly = true)
    public CashFlowMonth month(User current, YearMonth month) {
        List<CashEntry> list = entries(current.getId(), month);
        BigDecimal in = total(list, CashEntry.Type.ENTRADA);
        BigDecimal out = total(list, CashEntry.Type.SAIDA);

        Map<Category, BigDecimal> byCategory = new EnumMap<>(Category.class);
        list.stream().filter(e -> e.getType() == CashEntry.Type.SAIDA)
                .forEach(e -> byCategory.merge(e.getCategory(), e.getAmount(), BigDecimal::add));
        List<CategoryTotal> categories = byCategory.entrySet().stream()
                .map(e -> new CategoryTotal(e.getKey(), Money.of(e.getValue())))
                .sorted(Comparator.comparing(CategoryTotal::amount).reversed())
                .toList();

        return new CashFlowMonth(month, in, out, Money.of(in.subtract(out)), categories,
                list.stream().map(CashFlowService::toResponse).toList());
    }

    @Transactional
    public CashEntryResponse create(User current, CashEntryRequest req) {
        CashEntry e = new CashEntry();
        e.setUserId(current.getId());
        apply(e, req);
        return toResponse(repository.save(e));
    }

    @Transactional
    public CashEntryResponse update(User current, UUID id, CashEntryRequest req) {
        CashEntry e = find(current, id);
        apply(e, req);
        return toResponse(e);
    }

    @Transactional
    public void delete(User current, UUID id) {
        repository.delete(find(current, id));
    }

    public static BigDecimal total(List<CashEntry> list, CashEntry.Type type) {
        return Money.sum(list.stream().filter(e -> e.getType() == type).toList(), CashEntry::getAmount);
    }

    private CashEntry find(User current, UUID id) {
        return repository.findByIdAndUserId(id, current.getId()).orElseThrow(() -> new NotFoundException("Lançamento"));
    }

    private static void apply(CashEntry e, CashEntryRequest req) {
        e.setType(req.type());
        e.setDescription(req.description().trim());
        e.setAmount(Money.of(req.amount()));
        e.setEntryDate(req.entryDate());
        e.setCategory(req.category());
    }

    private static CashEntryResponse toResponse(CashEntry e) {
        return new CashEntryResponse(e.getId(), e.getType(), e.getDescription(), e.getAmount(), e.getEntryDate(), e.getCategory());
    }
}
