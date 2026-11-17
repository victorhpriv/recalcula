package br.com.saldo.dashboard;

import br.com.saldo.dashboard.DashboardDtos.DashboardResponse;
import br.com.saldo.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService service;
    private final CurrentUser currentUser;

    @GetMapping
    public DashboardResponse dashboard(@RequestParam YearMonth month) {
        return service.build(currentUser.get(), month);
    }
}
