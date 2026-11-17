package br.com.saldo.auth;

import br.com.saldo.config.AppProperties;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Proteção contra força bruta: após N falhas para o mesmo e-mail, bloqueia por um período.
 * Em memória (suficiente para uma instância). Para múltiplas instâncias, mover para Redis.
 */
@Service
public class LoginAttemptService {

    private record Attempts(int count, Instant lockedUntil) {}

    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();
    private final int maxAttempts;
    private final Duration lockDuration;
    private final Clock clock;

    public LoginAttemptService(AppProperties props, Clock clock) {
        this.maxAttempts = props.login().maxAttempts();
        this.lockDuration = props.login().lockDuration();
        this.clock = clock;
    }

    public void checkNotLocked(String email) {
        Attempts a = attempts.get(key(email));
        Instant now = clock.instant();
        if (a != null && a.lockedUntil() != null && a.lockedUntil().isAfter(now)) {
            long minutes = Math.max(1, Duration.between(now, a.lockedUntil()).toMinutes());
            throw new AccountLockedException(minutes);
        }
    }

    public void loginFailed(String email) {
        attempts.compute(key(email), (k, a) -> {
            int count = (a == null || isExpiredLock(a)) ? 1 : a.count() + 1;
            Instant lockedUntil = count >= maxAttempts ? clock.instant().plus(lockDuration) : null;
            return new Attempts(count, lockedUntil);
        });
    }

    public void loginSucceeded(String email) {
        attempts.remove(key(email));
    }

    @Scheduled(fixedDelay = 900_000)
    void cleanup() {
        attempts.entrySet().removeIf(e -> isExpiredLock(e.getValue()));
    }

    private boolean isExpiredLock(Attempts a) {
        return a.lockedUntil() != null && a.lockedUntil().isBefore(clock.instant());
    }

    private static String key(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
