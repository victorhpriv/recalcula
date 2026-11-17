package br.com.saldo.auth;

import br.com.saldo.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Refresh tokens opacos com rotação.
 * Se um token já revogado for reutilizado (sinal de roubo), todas as sessões do usuário são encerradas.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final RefreshTokenRepository repository;
    private final AppProperties props;

    public record Rotation(UUID userId, String newToken) {}

    @Transactional
    public String issue(UUID userId) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        RefreshToken token = new RefreshToken();
        token.setUserId(userId);
        token.setTokenHash(hash(raw));
        token.setExpiresAt(Instant.now().plus(props.jwt().refreshTokenTtl()));
        repository.save(token);
        return raw;
    }

    @Transactional(noRollbackFor = InvalidRefreshTokenException.class)
    public Rotation rotate(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new InvalidRefreshTokenException();
        }
        RefreshToken token = repository.findByTokenHash(hash(raw))
                .orElseThrow(InvalidRefreshTokenException::new);

        if (token.isRevoked()) {
            log.warn("Reutilização de refresh token detectada para o usuário {}", token.getUserId());
            repository.revokeAllByUserId(token.getUserId());
            throw new InvalidRefreshTokenException();
        }
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidRefreshTokenException();
        }
        token.setRevoked(true);
        return new Rotation(token.getUserId(), issue(token.getUserId()));
    }

    @Transactional
    public void revoke(String raw) {
        if (raw == null || raw.isBlank()) {
            return;
        }
        repository.findByTokenHash(hash(raw)).ifPresent(t -> t.setRevoked(true));
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public void revokeAll(UUID userId) {
        repository.revokeAllByUserId(userId);
    }

    @Scheduled(cron = "0 0 4 * * *")
    @Transactional
    public void purgeExpired() {
        int removed = repository.deleteExpired(Instant.now());
        log.info("Refresh tokens expirados removidos: {}", removed);
    }

    static String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
