package br.com.saldo.dashboard;

import br.com.saldo.bill.Bill;
import br.com.saldo.bill.BillService;
import br.com.saldo.card.CardDtos.CardResponse;
import br.com.saldo.card.CardDtos.InvoiceItem;
import br.com.saldo.card.CardService;
import br.com.saldo.card.CardService.CardData;
import br.com.saldo.cashflow.CashEntry;
import br.com.saldo.cashflow.CashFlowService;
import br.com.saldo.common.Category;
import br.com.saldo.common.Money;
import br.com.saldo.dashboard.DashboardDtos.Balance;
import br.com.saldo.dashboard.DashboardDtos.CardsSummary;
import br.com.saldo.dashboard.DashboardDtos.CategoryTotal;
import br.com.saldo.dashboard.DashboardDtos.DashboardResponse;
import br.com.saldo.dashboard.DashboardDtos.Housing;
import br.com.saldo.dashboard.DashboardDtos.HousingItem;
import br.com.saldo.dashboard.DashboardDtos.ItemKind;
import br.com.saldo.dashboard.DashboardDtos.MonthAmount;
import br.com.saldo.dashboard.DashboardDtos.Spending;
import br.com.saldo.dashboard.DashboardDtos.Upcoming;
import br.com.saldo.dashboard.DashboardDtos.UpcomingItem;
import br.com.saldo.income.IncomeService;
import br.com.saldo.reserve.ReserveService;
import br.com.saldo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Agrega, em uma única chamada, tudo que a tela "Visão geral" precisa. */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final int HOUSING_REFERENCE_PERCENT = 30;

    private final IncomeService incomes;
    private final BillService bills;
    private final CardService cards;
    private final CashFlowService cashFlow;
    private final ReserveService reserve;

    @Transactional(readOnly = true)
    public DashboardResponse build(User user, YearMonth month) {
        UUID userId = user.getId();
        BigDecimal salary = incomes.totalFor(userId, month);
        List<Bill> monthBills = bills.activeIn(userId, month);
        List<CardData> cardData = cards.cardData(userId);
        List<CashEntry> entries = cashFlow.entries(userId, month);

        return new DashboardResponse(month,
                balance(salary, month, monthBills, cardData, entries),
                spending(month, monthBills, cardData, entries),
                cardsSummary(user, month, cardData),
                upcoming(month, monthBills, cardData),
                housing(salary, monthBills),
                reserve.overview(user).total());
    }

    private Balance balance(BigDecimal salary, YearMonth month, List<Bill> monthBills, List<CardData> cardData,
                            List<CashEntry> entries) {
        BigDecimal income = Money.of(salary.add(CashFlowService.total(entries, CashEntry.Type.ENTRADA)));
        BigDecimal billsTotal = Money.sum(monthBills, Bill::getAmount);
        BigDecimal cardsTotal = Money.sum(cardData, c -> c.invoiceAmount(month));
        BigDecimal daily = CashFlowService.total(entries, CashEntry.Type.SAIDA);
        BigDecimal projected = Money.of(income.subtract(billsTotal).subtract(cardsTotal).subtract(daily));
        return new Balance(income, billsTotal, cardsTotal, daily, projected,
                Money.percent(projected.max(BigDecimal.ZERO), income));
    }

    private Spending spending(YearMonth month, List<Bill> monthBills, List<CardData> cardData, List<CashEntry> entries) {
        Map<Category, BigDecimal> byCategory = new EnumMap<>(Category.class);
        monthBills.forEach(b -> byCategory.merge(b.getCategory(), b.getAmount(), BigDecimal::add));
        for (CardData c : cardData) {
            for (InvoiceItem i : c.items(month)) {
                byCategory.merge(i.category(), i.amount(), BigDecimal::add);
            }
        }
        entries.stream().filter(e -> e.getType() == CashEntry.Type.SAIDA)
                .forEach(e -> byCategory.merge(e.getCategory(), e.getAmount(), BigDecimal::add));

        BigDecimal total = Money.sum(byCategory.values(), v -> v);
        List<CategoryTotal> categories = byCategory.entrySet().stream()
                .map(e -> new CategoryTotal(e.getKey(), Money.of(e.getValue()), Money.percent(e.getValue(), total)))
                .sorted(Comparator.comparing(CategoryTotal::amount).reversed())
                .toList();
        return new Spending(total, categories);
    }

    private CardsSummary cardsSummary(User user, YearMonth month, List<CardData> cardData) {
        List<CardResponse> list = cards.list(user, month);
        List<MonthAmount> next = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            YearMonth m = month.plusMonths(i);
            next.add(new MonthAmount(m, Money.sum(cardData, c -> c.invoiceAmount(m))));
        }
        return new CardsSummary(Money.sum(list, c -> c.invoice().amount()), list, next);
    }

    private Upcoming upcoming(YearMonth month, List<Bill> monthBills, List<CardData> cardData) {
        Set<UUID> paidIds = bills.paidBillIds(monthBills, month);
        List<UpcomingItem> items = new ArrayList<>();
        for (Bill b : monthBills) {
            items.add(new UpcomingItem(b.getId(), ItemKind.BILL, b.getDescription(), b.getAmount(),
                    Math.min(b.getDueDay(), month.lengthOfMonth()), paidIds.contains(b.getId())));
        }
        for (CardData c : cardData) {
            BigDecimal amount = c.invoiceAmount(month);
            if (amount.signum() == 0) continue;
            items.add(new UpcomingItem(c.card().getId(), ItemKind.INVOICE, "Fatura " + c.card().getName(), amount,
                    Math.min(c.card().getDueDay(), month.lengthOfMonth()), c.paidMonths().contains(month)));
        }
        items.sort(Comparator.comparingInt(UpcomingItem::dueDay).thenComparing(UpcomingItem::amount, Comparator.reverseOrder()));

        BigDecimal pending = Money.sum(items.stream().filter(i -> !i.paid()).toList(), UpcomingItem::amount);
        int paidCount = (int) items.stream().filter(UpcomingItem::paid).count();
        List<Integer> dueDays = items.stream().map(UpcomingItem::dueDay).distinct().sorted().toList();
        return new Upcoming(pending, paidCount, items.size(), dueDays, items);
    }

    private Housing housing(BigDecimal salary, List<Bill> monthBills) {
        List<HousingItem> items = monthBills.stream()
                .filter(Bill::isHousing)
                .map(b -> new HousingItem(b.getDescription(), b.getCategory(), b.getAmount()))
                .toList();
        BigDecimal amount = Money.sum(items, HousingItem::amount);
        return new Housing(amount, salary, Money.percent(amount, salary), HOUSING_REFERENCE_PERCENT, items);
    }
}
