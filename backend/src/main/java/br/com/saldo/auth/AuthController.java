package br.com.saldo.auth;

import br.com.saldo.account.AccountDtos.ForgotPasswordRequest;
import br.com.saldo.account.AccountDtos.ResetPasswordRequest;
import br.com.saldo.account.AccountDtos.VerifyEmailRequest;
import br.com.saldo.account.AccountService;
import br.com.saldo.auth.dto.AuthDtos.AuthResponse;
import br.com.saldo.auth.dto.AuthDtos.LoginRequest;
import br.com.saldo.auth.dto.AuthDtos.MeResponse;
import br.com.saldo.auth.dto.AuthDtos.RegisterRequest;
import br.com.saldo.security.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AccountService accountService;
    private final AuthCookies cookies;
    private final CurrentUser currentUser;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest body) {
        return withCookie(HttpStatus.CREATED, authService.register(body));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest body) {
        return withCookie(HttpStatus.OK, authService.login(body));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = AuthCookies.REFRESH_COOKIE, required = false) String token, HttpServletRequest request) {
        cookies.assertAllowedOrigin(request);
        return withCookie(HttpStatus.OK, authService.refresh(token));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = AuthCookies.REFRESH_COOKIE, required = false) String token, HttpServletRequest request) {
        cookies.assertAllowedOrigin(request);
        authService.logout(token);
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookies.clear()).build();
    }

    @GetMapping("/me")
    public MeResponse me() {
        return authService.me(currentUser.get());
    }

    /** Sempre 202, exista ou não o e-mail (não revela quem tem conta). */
    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest body) {
        accountService.forgotPassword(body.email());
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest body) {
        accountService.resetPassword(body.token(), body.password());
    }

    @PostMapping("/verify-email")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void verifyEmail(@Valid @RequestBody VerifyEmailRequest body) {
        accountService.verifyEmail(body.token());
    }

    private ResponseEntity<AuthResponse> withCookie(HttpStatus status, AuthService.Session session) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, cookies.refresh(session.refreshToken()))
                .body(session.response());
    }
}
