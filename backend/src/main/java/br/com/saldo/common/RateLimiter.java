package br.com.saldo.common;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limitador simples em memória (janela deslizante): no máximo N ações por chave dentro da janela.
 * Suficiente para uma instância; para várias, trocar por Redis.
 */
public class RateLimiter {

    private final int max;
    private final Duration window;
    private final Clock clock;
    private final Map<String, Deque<Instant>> hits = new ConcurrentHashMap<>();

    public RateLimiter(int max, Duration window, Clock clock) {
        this.max = max;
        this.window = window;
        this.clock = clock;
    }

    /** Registra a tentativa e retorna false se o limite foi excedido. */
    public boolean tryAcquire(String key) {
        Instant now = clock.instant();
        Instant limit = now.minus(window);
        Deque<Instant> q = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (q) {
            while (!q.isEmpty() && q.peekFirst().isBefore(limit)) {
                q.pollFirst();
            }
            if (q.size() >= max) {
                return false;
            }
            q.addLast(now);
            return true;
        }
    }

    public void cleanup() {
        Instant limit = clock.instant().minus(window);
        hits.entrySet().removeIf(e -> {
            synchronized (e.getValue()) {
                return e.getValue().isEmpty() || e.getValue().peekLast().isBefore(limit);
            }
        });
    }
}
