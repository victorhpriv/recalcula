package br.com.saldo.reserve;

import br.com.saldo.common.BusinessException;
import br.com.saldo.common.Money;
import br.com.saldo.common.NotFoundException;
import br.com.saldo.reserve.ReserveDtos.GoalRequest;
import br.com.saldo.reserve.ReserveDtos.GoalResponse;
import br.com.saldo.reserve.ReserveDtos.MovementRequest;
import br.com.saldo.reserve.ReserveDtos.MovementResponse;
import br.com.saldo.reserve.ReserveDtos.MovementType;
import br.com.saldo.reserve.ReserveDtos.ReserveOverview;
import br.com.saldo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReserveService {

    private final SavingsGoalRepository goals;
    private final ReserveMovementRepository movements;

    @Transactional(readOnly = true)
    public ReserveOverview overview(User current) {
        List<SavingsGoal> goalList = goals.findByUserIdOrderByCreatedAtAsc(current.getId());
        List<UUID> ids = goalList.stream().map(SavingsGoal::getId).toList();
        List<ReserveMovement> moves = ids.isEmpty() ? List.of()
                : movements.findByGoalIdInOrderByMovementDateDescCreatedAtDesc(ids);

        Map<UUID, BigDecimal> savedByGoal = moves.stream().collect(Collectors.groupingBy(
                ReserveMovement::getGoalId, Collectors.reducing(BigDecimal.ZERO, ReserveMovement::getAmount, BigDecimal::add)));
        Map<UUID, SavingsGoal> goalMap = goalList.stream().collect(Collectors.toMap(SavingsGoal::getId, Function.identity()));

        List<GoalResponse> goalResponses = goalList.stream().map(g -> {
            BigDecimal saved = Money.of(savedByGoal.getOrDefault(g.getId(), BigDecimal.ZERO));
            return new GoalResponse(g.getId(), g.getName(), g.getTargetAmount(), g.getColor(), saved,
                    Money.percent(saved, g.getTargetAmount()));
        }).toList();

        List<MovementResponse> recent = moves.stream().limit(50)
                .map(m -> new MovementResponse(m.getId(), m.getGoalId(), goalMap.get(m.getGoalId()).getName(),
                        m.getAmount(), m.getDescription(), m.getMovementDate()))
                .toList();

        return new ReserveOverview(Money.sum(goalResponses, GoalResponse::saved), goalResponses, recent);
    }

    @Transactional
    public void createGoal(User current, GoalRequest req) {
        SavingsGoal g = new SavingsGoal();
        g.setUserId(current.getId());
        apply(g, req);
        goals.save(g);
    }

    @Transactional
    public void updateGoal(User current, UUID id, GoalRequest req) {
        apply(findGoal(current, id), req);
    }

    @Transactional
    public void deleteGoal(User current, UUID id) {
        goals.delete(findGoal(current, id));
    }

    @Transactional
    public void addMovement(User current, UUID goalId, MovementRequest req) {
        findGoal(current, goalId);
        BigDecimal amount = Money.of(req.amount());
        if (req.type() == MovementType.RESGATE) {
            BigDecimal saved = movements.findByGoalIdInOrderByMovementDateDescCreatedAtDesc(List.of(goalId)).stream()
                    .map(ReserveMovement::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            if (amount.compareTo(saved) > 0) {
                throw new BusinessException("Saldo insuficiente nesta reserva");
            }
            amount = amount.negate();
        }
        ReserveMovement m = new ReserveMovement();
        m.setGoalId(goalId);
        m.setAmount(amount);
        m.setDescription(req.description() == null ? null : req.description().trim());
        m.setMovementDate(req.movementDate());
        movements.save(m);
    }

    @Transactional
    public void deleteMovement(User current, UUID goalId, UUID movementId) {
        findGoal(current, goalId);
        ReserveMovement m = movements.findById(movementId)
                .filter(x -> x.getGoalId().equals(goalId))
                .orElseThrow(() -> new NotFoundException("Movimentação"));
        movements.delete(m);
    }

    private SavingsGoal findGoal(User current, UUID id) {
        return goals.findByIdAndUserId(id, current.getId()).orElseThrow(() -> new NotFoundException("Reserva"));
    }

    private static void apply(SavingsGoal g, GoalRequest req) {
        g.setName(req.name().trim());
        g.setTargetAmount(Money.of(req.targetAmount()));
        g.setColor(req.color());
    }
}
