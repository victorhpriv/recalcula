package br.com.saldo.card;

import br.com.saldo.card.CardDtos.CardRequest;
import br.com.saldo.card.CardDtos.CardResponse;
import br.com.saldo.card.CardDtos.InvoiceItem;
import br.com.saldo.card.CardDtos.InvoiceResponse;
import br.com.saldo.card.CardDtos.InvoiceStatus;
import br.com.saldo.card.CardDtos.InvoiceSummary;
import br.com.saldo.card.CardDtos.PurchaseRequest;
import br.com.saldo.card.CardDtos.PurchaseResponse;
import br.com.saldo.card.InvoiceCalculator.Installment;
import br.com.saldo.common.Money;
import br.com.saldo.common.NotFoundException;
import br.com.saldo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CardService {

    private final CreditCardRepository cards;
    private final CardPurchaseRepository purchases;
    private final CardInvoicePaymentRepository invoicePayments;
    private final Clock clock;

    /** Cartão com suas compras e faturas pagas, para cálculos em memória. */
    public record CardData(CreditCard card, List<CardPurchase> purchases, Set<YearMonth> paidMonths) {

        public List<InvoiceItem> items(YearMonth month) {
            List<InvoiceItem> items = new ArrayList<>();
            for (CardPurchase p : purchases) {
                for (Installment i : InvoiceCalculator.installmentsOf(p, card)) {
                    if (i.dueMonth().equals(month)) {
                        items.add(new InvoiceItem(p.getId(), p.getDescription(), p.getCategory(), p.getPurchaseDate(),
                                i.number(), i.total(), i.amount()));
                    }
                }
            }
            items.sort(Comparator.comparing(InvoiceItem::purchaseDate).reversed());
            return items;
        }

        public BigDecimal invoiceAmount(YearMonth month) {
            return Money.sum(items(month), InvoiceItem::amount);
        }

        /** Limite comprometido: parcelas de faturas ainda não pagas. */
        public BigDecimal used() {
            BigDecimal total = BigDecimal.ZERO;
            for (CardPurchase p : purchases) {
                for (Installment i : InvoiceCalculator.installmentsOf(p, card)) {
                    if (!paidMonths.contains(i.dueMonth())) {
                        total = total.add(i.amount());
                    }
                }
            }
            return Money.of(total);
        }
    }

    // ---------- consultas usadas por outros módulos ----------

    @Transactional(readOnly = true)
    public List<CardData> cardData(UUID userId) {
        return load(cards.findByUserIdAndArchivedFalseOrderByCreatedAtAsc(userId));
    }

    public InvoiceSummary summary(CardData data, YearMonth month) {
        CreditCard c = data.card();
        BigDecimal amount = data.invoiceAmount(month);
        LocalDate closing = InvoiceCalculator.closingDate(month, c.getClosingDay(), c.getDueDay());
        LocalDate due = InvoiceCalculator.dueDate(month, c.getDueDay());
        return new InvoiceSummary(month, amount, status(data.paidMonths().contains(month), amount, closing, due), closing, due);
    }

    // ---------- cartões ----------

    @Transactional(readOnly = true)
    public List<CardResponse> list(User current, YearMonth month) {
        return cardData(current.getId()).stream().map(d -> toResponse(d, month)).toList();
    }

    @Transactional
    public CardResponse create(User current, CardRequest req) {
        CreditCard card = new CreditCard();
        card.setUserId(current.getId());
        apply(card, req);
        cards.save(card);
        return toResponse(new CardData(card, List.of(), Set.of()), YearMonth.now(clock));
    }

    @Transactional
    public CardResponse update(User current, UUID id, CardRequest req) {
        CreditCard card = find(current, id);
        apply(card, req);
        return toResponse(load(List.of(card)).getFirst(), YearMonth.now(clock));
    }

    /** Arquiva (soft delete) para preservar o histórico. */
    @Transactional
    public void archive(User current, UUID id) {
        find(current, id).setArchived(true);
    }

    // ---------- faturas ----------

    @Transactional(readOnly = true)
    public InvoiceResponse invoice(User current, UUID cardId, YearMonth month) {
        CardData data = load(List.of(find(current, cardId))).getFirst();
        return new InvoiceResponse(cardId, data.card().getName(), summary(data, month), data.items(month));
    }

    @Transactional(readOnly = true)
    public List<InvoiceSummary> upcoming(User current, UUID cardId, YearMonth from, int count) {
        CardData data = load(List.of(find(current, cardId))).getFirst();
        int safeCount = Math.clamp(count, 1, 12);
        List<InvoiceSummary> list = new ArrayList<>(safeCount);
        for (int i = 0; i < safeCount; i++) {
            list.add(summary(data, from.plusMonths(i)));
        }
        return list;
    }

    @Transactional
    public InvoiceSummary payInvoice(User current, UUID cardId, YearMonth month) {
        CreditCard card = find(current, cardId);
        if (invoicePayments.findByCardIdAndReferenceMonth(cardId, month).isEmpty()) {
            CardInvoicePayment p = new CardInvoicePayment();
            p.setCardId(cardId);
            p.setReferenceMonth(month);
            p.setPaidAt(clock.instant());
            invoicePayments.save(p);
        }
        return summary(load(List.of(card)).getFirst(), month);
    }

    @Transactional
    public InvoiceSummary unpayInvoice(User current, UUID cardId, YearMonth month) {
        CreditCard card = find(current, cardId);
        invoicePayments.findByCardIdAndReferenceMonth(cardId, month).ifPresent(invoicePayments::delete);
        invoicePayments.flush();
        return summary(load(List.of(card)).getFirst(), month);
    }

    // ---------- compras ----------

    @Transactional(readOnly = true)
    public List<PurchaseResponse> listPurchases(User current, UUID cardId) {
        CreditCard card = find(current, cardId);
        return purchases.findByCardIdOrderByPurchaseDateDesc(cardId).stream().map(p -> toResponse(p, card)).toList();
    }

    @Transactional
    public PurchaseResponse addPurchase(User current, UUID cardId, PurchaseRequest req) {
        CreditCard card = find(current, cardId);
        CardPurchase p = new CardPurchase();
        p.setCardId(cardId);
        apply(p, req);
        purchases.save(p);
        return toResponse(p, card);
    }

    @Transactional
    public PurchaseResponse updatePurchase(User current, UUID cardId, UUID purchaseId, PurchaseRequest req) {
        CreditCard card = find(current, cardId);
        CardPurchase p = findPurchase(cardId, purchaseId);
        apply(p, req);
        return toResponse(p, card);
    }

    @Transactional
    public void deletePurchase(User current, UUID cardId, UUID purchaseId) {
        find(current, cardId);
        purchases.delete(findPurchase(cardId, purchaseId));
    }

    // ---------- helpers ----------

    private List<CardData> load(List<CreditCard> list) {
        if (list.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = list.stream().map(CreditCard::getId).toList();
        Map<UUID, List<CardPurchase>> byCard = purchases.findByCardIdInOrderByPurchaseDateDesc(ids).stream()
                .collect(Collectors.groupingBy(CardPurchase::getCardId));
        Map<UUID, Set<YearMonth>> paid = invoicePayments.findByCardIdIn(ids).stream()
                .collect(Collectors.groupingBy(CardInvoicePayment::getCardId,
                        Collectors.mapping(CardInvoicePayment::getReferenceMonth, Collectors.toSet())));
        return list.stream()
                .map(c -> new CardData(c, byCard.getOrDefault(c.getId(), List.of()), paid.getOrDefault(c.getId(), Set.of())))
                .toList();
    }

    private InvoiceStatus status(boolean paid, BigDecimal amount, LocalDate closing, LocalDate due) {
        LocalDate today = LocalDate.now(clock);
        if (paid) return InvoiceStatus.PAGA;
        if (today.isBefore(closing)) return InvoiceStatus.ABERTA;
        if (!today.isAfter(due)) return InvoiceStatus.FECHADA;
        return amount.signum() == 0 ? InvoiceStatus.PAGA : InvoiceStatus.VENCIDA;
    }

    private CreditCard find(User current, UUID id) {
        return cards.findByIdAndUserIdAndArchivedFalse(id, current.getId())
                .orElseThrow(() -> new NotFoundException("Cartão"));
    }

    private CardPurchase findPurchase(UUID cardId, UUID purchaseId) {
        return purchases.findById(purchaseId)
                .filter(p -> p.getCardId().equals(cardId))
                .orElseThrow(() -> new NotFoundException("Compra"));
    }

    private static void apply(CreditCard card, CardRequest req) {
        card.setName(req.name().trim());
        card.setBank(req.bank().trim());
        card.setColor(req.color());
        card.setCreditLimit(Money.of(req.creditLimit()));
        card.setClosingDay(req.closingDay());
        card.setDueDay(req.dueDay());
    }

    private static void apply(CardPurchase p, PurchaseRequest req) {
        p.setDescription(req.description().trim());
        p.setTotalAmount(Money.of(req.totalAmount()));
        p.setInstallments(req.installments());
        p.setPurchaseDate(req.purchaseDate());
        p.setCategory(req.category());
    }

    private CardResponse toResponse(CardData d, YearMonth month) {
        CreditCard c = d.card();
        BigDecimal used = d.used();
        return new CardResponse(c.getId(), c.getName(), c.getBank(), c.getColor(), c.getCreditLimit(), used,
                Money.of(c.getCreditLimit().subtract(used)), c.getClosingDay(), c.getDueDay(), summary(d, month));
    }

    private static PurchaseResponse toResponse(CardPurchase p, CreditCard card) {
        return new PurchaseResponse(p.getId(), p.getCardId(), p.getDescription(), p.getTotalAmount(), p.getInstallments(),
                p.getPurchaseDate(), p.getCategory(),
                InvoiceCalculator.firstDueMonth(p.getPurchaseDate(), card.getClosingDay(), card.getDueDay()));
    }
}
