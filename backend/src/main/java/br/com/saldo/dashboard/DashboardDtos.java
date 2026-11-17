package br.com.saldo.dashboard;

import br.com.saldo.card.CardDtos.CardResponse;
import br.com.saldo.common.Category;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

public final class DashboardDtos {

    private DashboardDtos() {}

    /** Saldo previsto do mês: renda − contas − faturas − dia a dia. */
    public record Balance(
            BigDecimal income,
            BigDecimal bills,
            BigDecimal cards,
            BigDecimal daily,
            BigDecimal projected,
            BigDecimal freePercent
    ) {}

    public record CategoryTotal(Category category, BigDecimal amount, BigDecimal percent) {}

    /** Para onde vai o dinheiro no mês (contas + cartões + dia a dia). */
    public record Spending(BigDecimal total, List<CategoryTotal> categories) {}

    public record MonthAmount(YearMonth month, BigDecimal amount) {}

    public record CardsSummary(BigDecimal totalInvoices, List<CardResponse> cards, List<MonthAmount> next) {}

    public enum ItemKind { BILL, INVOICE }

    public record UpcomingItem(UUID id, ItemKind kind, String description, BigDecimal amount, int dueDay, boolean paid) {}

    public record Upcoming(
            BigDecimal totalPending,
            int paidCount,
            int totalCount,
            List<Integer> dueDays,
            List<UpcomingItem> items
    ) {}

    public record HousingItem(String description, Category category, BigDecimal amount) {}

    public record Housing(
            BigDecimal amount,
            BigDecimal income,
            BigDecimal percent,
            int referencePercent,
            List<HousingItem> items
    ) {}

    public record DashboardResponse(
            YearMonth month,
            Balance balance,
            Spending spending,
            CardsSummary cards,
            Upcoming upcoming,
            Housing housing,
            BigDecimal reserveTotal
    ) {}
}
