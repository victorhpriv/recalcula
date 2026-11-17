package br.com.saldo.auth;

import br.com.saldo.config.AppProperties;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.time.Duration;

/** Cookie do refresh token: HttpOnly, SameSite=Strict, restrito a /api/auth. */
@Component
@RequiredArgsConstructor
public class AuthCookies {

    public static final String REFRESH_COOKIE = "saldo_rt";
    private static final String COOKIE_PATH = "/api/auth";

    private final AppProperties props;

    public String refresh(String value) {
        return build(value, props.jwt().refreshTokenTtl());
    }

    public String clear() {
        return build("", Duration.ZERO);
    }

    /** Defesa extra contra CSRF nos endpoints que usam o cookie. */
    public void assertAllowedOrigin(HttpServletRequest request) {
        String origin = request.getHeader(HttpHeaders.ORIGIN);
        if (origin != null && !props.cors().allowedOrigins().contains(origin)) {
            throw new AccessDeniedException("Origem não permitida");
        }
    }

    private String build(String value, Duration maxAge) {
        return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(props.cookie().secure())
                .sameSite("Strict")
                .path(COOKIE_PATH)
                .maxAge(maxAge)
                .build()
                .toString();
    }
}
