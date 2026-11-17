package br.com.saldo.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;
import java.util.List;

/**
 * Configurações tipadas da aplicação (prefixo "app" no application.yml).
 */
@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        @NotBlank String zoneId,
        @NotBlank String frontendUrl,
        @NotBlank String mailFrom,
        @Valid @NotNull Jwt jwt,
        @Valid @NotNull Cors cors,
        @Valid @NotNull Cookie cookie,
        @Valid @NotNull Login login
) {
    public record Jwt(
            @NotBlank(message = "Defina a variável JWT_SECRET (openssl rand -base64 48)") String secret,
            @NotBlank String issuer,
            @NotNull Duration accessTokenTtl,
            @NotNull Duration refreshTokenTtl
    ) {}

    public record Cors(@NotEmpty List<String> allowedOrigins) {}

    public record Cookie(boolean secure) {}

    public record Login(@Min(1) int maxAttempts, @NotNull Duration lockDuration) {}
}
