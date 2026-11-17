package br.com.saldo.reserve;

import br.com.saldo.reserve.ReserveDtos.GoalRequest;
import br.com.saldo.reserve.ReserveDtos.MovementRequest;
import br.com.saldo.reserve.ReserveDtos.ReserveOverview;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/reserve")
@RequiredArgsConstructor
public class ReserveController {

    private final ReserveService service;
    private final CurrentUser currentUser;

    @GetMapping
    public ReserveOverview overview() {
        return service.overview(currentUser.get());
    }

    @PostMapping("/goals")
    @ResponseStatus(HttpStatus.CREATED)
    public ReserveOverview createGoal(@Valid @RequestBody GoalRequest body) {
        service.createGoal(currentUser.get(), body);
        return service.overview(currentUser.get());
    }

    @PutMapping("/goals/{id}")
    public ReserveOverview updateGoal(@PathVariable UUID id, @Valid @RequestBody GoalRequest body) {
        service.updateGoal(currentUser.get(), id, body);
        return service.overview(currentUser.get());
    }

    @DeleteMapping("/goals/{id}")
    public ReserveOverview deleteGoal(@PathVariable UUID id) {
        service.deleteGoal(currentUser.get(), id);
        return service.overview(currentUser.get());
    }

    @PostMapping("/goals/{id}/movements")
    @ResponseStatus(HttpStatus.CREATED)
    public ReserveOverview addMovement(@PathVariable UUID id, @Valid @RequestBody MovementRequest body) {
        service.addMovement(currentUser.get(), id, body);
        return service.overview(currentUser.get());
    }

    @DeleteMapping("/goals/{goalId}/movements/{movementId}")
    public ReserveOverview deleteMovement(@PathVariable UUID goalId, @PathVariable UUID movementId) {
        service.deleteMovement(currentUser.get(), goalId, movementId);
        return service.overview(currentUser.get());
    }
}
