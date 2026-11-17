package br.com.saldo.bill;

import br.com.saldo.bill.BillDtos.BillRequest;
import br.com.saldo.bill.BillDtos.BillResponse;
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
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillService service;
    private final CurrentUser currentUser;

    @GetMapping
    public List<BillResponse> list(@RequestParam(required = false) YearMonth month) {
        return service.list(currentUser.get(), month);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BillResponse create(@Valid @RequestBody BillRequest body) {
        return service.create(currentUser.get(), body);
    }

    @PutMapping("/{id}")
    public BillResponse update(@PathVariable UUID id, @Valid @RequestBody BillRequest body) {
        return service.update(currentUser.get(), id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(currentUser.get(), id);
    }

    @PostMapping("/{id}/payments")
    public BillResponse pay(@PathVariable UUID id, @RequestParam YearMonth month) {
        return service.markPaid(currentUser.get(), id, month);
    }

    @DeleteMapping("/{id}/payments")
    public BillResponse unpay(@PathVariable UUID id, @RequestParam YearMonth month) {
        return service.markUnpaid(currentUser.get(), id, month);
    }
}
