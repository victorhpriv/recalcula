package br.com.saldo.account;

import br.com.saldo.common.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserTokenRepository repository;
    private final Clock clock;

    /**
     * Gera um novo token (invalidando os anteriores do mesmo tipo) e retorna o valor puro para o link.
     * REQUIRES_NEW: também é chamado após o commit do cadastro (listener de evento).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String issue(UUID userId, UserToken.Type type, Duration ttl) {
        repository.invalidateAll(userId, type, clock.instant());
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        UserToken token = new UserToken();
        token.setUserId(userId);
        token.setType(type);
        token.setTokenHash(hash(raw));
        token.setExpiresAt(clock.instant().plus(ttl));
        repository.save(token);
        return raw;
    }

    /** Consome o token e retorna o id do usuário; falha se inválido, usado ou expirado. */
    @Transactional
    public UUID consume(String raw, UserToken.Type type) {
        UserToken token = repository.findByTokenHashAndType(hash(raw), type)
                .filter(t -> t.getUsedAt() == null && t.getExpiresAt().isAfter(clock.instant()))
                .orElseThrow(() -> new BusinessException("Link inválido ou expirado. Solicite um novo."));
        token.setUsedAt(clock.instant());
        return token.getUserId();
    }

    @Scheduled(cron = "0 30 4 * * *")
    @Transactional
    public void purgeExpired() {
        repository.deleteExpired(clock.instant().minus(Duration.ofDays(1)));
    }

    static String hash(String raw) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
