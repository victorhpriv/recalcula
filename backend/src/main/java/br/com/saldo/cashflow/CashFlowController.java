package br.com.saldo.cashflow;

import br.com.saldo.cashflow.CashFlowDtos.CashEntryRequest;
import br.com.saldo.cashflow.CashFlowDtos.CashEntryResponse;
import br.com.saldo.cashflow.CashFlowDtos.CashFlowMonth;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/cash-flow")
@RequiredArgsConstructor
public class CashFlowController {

    private final CashFlowService service;
    private final CurrentUser currentUser;

    @GetMapping
    public CashFlowMonth month(@RequestParam YearMonth month) {
        return service.month(currentUser.get(), month);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CashEntryResponse create(@Valid @RequestBody CashEntryRequest body) {
        return service.create(currentUser.get(), body);
    }

    @PutMapping("/{id}")
    public CashEntryResponse update(@PathVariable UUID id, @Valid @RequestBody CashEntryRequest body) {
        return service.update(currentUser.get(), id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(currentUser.get(), id);
    }
}
