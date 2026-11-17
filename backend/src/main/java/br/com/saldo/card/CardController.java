package br.com.saldo.card;

import br.com.saldo.card.CardDtos.CardRequest;
import br.com.saldo.card.CardDtos.CardResponse;
import br.com.saldo.card.CardDtos.InvoiceResponse;
import br.com.saldo.card.CardDtos.InvoiceSummary;
import br.com.saldo.card.CardDtos.PurchaseRequest;
import br.com.saldo.card.CardDtos.PurchaseResponse;
import br.com.saldo.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardService service;
    private final CurrentUser currentUser;

    @GetMapping
    public List<CardResponse> list(@RequestParam YearMonth month) {
        return service.list(currentUser.get(), month);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CardResponse create(@Valid @RequestBody CardRequest body) {
        return service.create(currentUser.get(), body);
    }

    @PutMapping("/{id}")
    public CardResponse update(@PathVariable UUID id, @Valid @RequestBody CardRequest body) {
        return service.update(currentUser.get(), id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@PathVariable UUID id) {
        service.archive(currentUser.get(), id);
    }

    @GetMapping("/{id}/invoices")
    public List<InvoiceSummary> upcoming(@PathVariable UUID id, @RequestParam YearMonth from,
                                         @RequestParam(defaultValue = "3") int count) {
        return service.upcoming(currentUser.get(), id, from, count);
    }

    @GetMapping("/{id}/invoices/{month}")
    public InvoiceResponse invoice(@PathVariable UUID id, @PathVariable YearMonth month) {
        return service.invoice(currentUser.get(), id, month);
    }

    @PostMapping("/{id}/invoices/{month}/payment")
    public InvoiceSummary pay(@PathVariable UUID id, @PathVariable YearMonth month) {
        return service.payInvoice(currentUser.get(), id, month);
    }

    @DeleteMapping("/{id}/invoices/{month}/payment")
    public InvoiceSummary unpay(@PathVariable UUID id, @PathVariable YearMonth month) {
        return service.unpayInvoice(currentUser.get(), id, month);
    }

    @GetMapping("/{id}/purchases")
    public List<PurchaseResponse> purchases(@PathVariable UUID id) {
        return service.listPurchases(currentUser.get(), id);
    }

    @PostMapping("/{id}/purchases")
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseResponse addPurchase(@PathVariable UUID id, @Valid @RequestBody PurchaseRequest body) {
        return service.addPurchase(currentUser.get(), id, body);
    }

    @PutMapping("/{id}/purchases/{purchaseId}")
    public PurchaseResponse updatePurchase(@PathVariable UUID id, @PathVariable UUID purchaseId,
                                           @Valid @RequestBody PurchaseRequest body) {
        return service.updatePurchase(currentUser.get(), id, purchaseId, body);
    }

    @DeleteMapping("/{id}/purchases/{purchaseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePurchase(@PathVariable UUID id, @PathVariable UUID purchaseId) {
        service.deletePurchase(currentUser.get(), id, purchaseId);
    }
}
