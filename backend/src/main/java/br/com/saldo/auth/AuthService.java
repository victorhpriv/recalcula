package br.com.saldo.auth;

import br.com.saldo.auth.dto.AuthDtos.AuthResponse;
import br.com.saldo.auth.dto.AuthDtos.LoginRequest;
import br.com.saldo.auth.dto.AuthDtos.MeResponse;
import br.com.saldo.auth.dto.AuthDtos.RegisterRequest;
import br.com.saldo.common.BusinessException;
import br.com.saldo.user.User;
import br.com.saldo.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    public record Session(AuthResponse response, String refreshToken) {}

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final RefreshTokenService refreshTokens;
    private final LoginAttemptService loginAttempts;
    private final org.springframework.context.ApplicationEventPublisher emailEvents;

    /** Disparado após o cadastro; o envio do e-mail de confirmação acontece depois do commit. */
    public record UserRegisteredEvent(UUID userId) {}

    /** Hash fictício para igualar o tempo de resposta quando o e-mail não existe (evita enumeração). */
    private volatile String dummyHash;

    @Transactional
    public Session register(RegisterRequest req) {
        String email = normalize(req.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Não foi possível concluir o cadastro com este e-mail");
        }
        User user = new User();
        user.setName(req.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setTermsAcceptedAt(java.time.Instant.now());
        users.save(user);
        emailEvents.publishEvent(new UserRegisteredEvent(user.getId()));
        return newSession(user);
    }

    @Transactional
    public Session login(LoginRequest req) {
        String email = normalize(req.email());
        loginAttempts.checkNotLocked(email);

        User user = users.findByEmailIgnoreCase(email).orElse(null);
        String hash = user != null ? user.getPasswordHash() : dummyHash();
        boolean matches = passwordEncoder.matches(req.password(), hash);

        if (user == null || !matches) {
            loginAttempts.loginFailed(email);
            throw new InvalidCredentialsException();
        }
        loginAttempts.loginSucceeded(email);
        return newSession(user);
    }

    @Transactional(noRollbackFor = InvalidRefreshTokenException.class)
    public Session refresh(String rawRefreshToken) {
        RefreshTokenService.Rotation rotation = refreshTokens.rotate(rawRefreshToken);
        User user = users.findById(rotation.userId()).orElseThrow(InvalidRefreshTokenException::new);
        return new Session(buildResponse(user), rotation.newToken());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokens.revoke(rawRefreshToken);
    }

    public MeResponse me(User user) {
        return toMe(user);
    }

    /** Nova sessão para um usuário já autenticado (ex.: após trocar a senha). */
    @Transactional
    public Session newSession(User user) {
        String refresh = refreshTokens.issue(user.getId());
        return new Session(buildResponse(user), refresh);
    }

    private AuthResponse buildResponse(User user) {
        return new AuthResponse(tokenService.createAccessToken(user), tokenService.accessTokenTtlSeconds(), toMe(user));
    }

    private static MeResponse toMe(User user) {
        return new MeResponse(user.getId(), user.getName(), user.getEmail(), user.isEmailVerified());
    }

    private String dummyHash() {
        if (dummyHash == null) {
            dummyHash = passwordEncoder.encode(UUID.randomUUID().toString());
        }
        return dummyHash;
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
