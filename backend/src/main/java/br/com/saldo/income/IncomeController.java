package br.com.saldo.income;

import br.com.saldo.income.IncomeDtos.IncomeRequest;
import br.com.saldo.income.IncomeDtos.IncomeResponse;
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
@RequestMapping("/api/incomes")
@RequiredArgsConstructor
public class IncomeController {

    private final IncomeService service;
    private final CurrentUser currentUser;

    @GetMapping
    public List<IncomeResponse> list(@RequestParam(required = false) YearMonth month) {
        return service.list(currentUser.get(), month);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IncomeResponse create(@Valid @RequestBody IncomeRequest body) {
        return service.create(currentUser.get(), body);
    }

    @PutMapping("/{id}")
    public IncomeResponse update(@PathVariable UUID id, @Valid @RequestBody IncomeRequest body) {
        return service.update(currentUser.get(), id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(currentUser.get(), id);
    }
}
