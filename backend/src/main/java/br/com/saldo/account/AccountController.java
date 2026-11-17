package br.com.saldo.account;

import br.com.saldo.account.AccountDtos.AccountResponse;
import br.com.saldo.account.AccountDtos.ChangePasswordRequest;
import br.com.saldo.account.AccountDtos.DeleteAccountRequest;
import br.com.saldo.account.AccountDtos.UpdateProfileRequest;
import br.com.saldo.auth.AuthCookies;
import br.com.saldo.auth.AuthService;
import br.com.saldo.auth.dto.AuthDtos.AuthResponse;
import br.com.saldo.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService service;
    private final AuthCookies cookies;
    private final CurrentUser currentUser;

    @GetMapping
    public AccountResponse details() {
        return service.details(currentUser.get());
    }

    @PutMapping("/profile")
    public AccountResponse updateProfile(@Valid @RequestBody UpdateProfileRequest body) {
        return service.updateProfile(currentUser.get(), body.name());
    }

    @PutMapping("/password")
    public ResponseEntity<AuthResponse> changePassword(@Valid @RequestBody ChangePasswordRequest body) {
        AuthService.Session session = service.changePassword(currentUser.get(), body.currentPassword(), body.newPassword());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookies.refresh(session.refreshToken()))
                .body(session.response());
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification() {
        service.resendVerification(currentUser.get());
        return ResponseEntity.accepted().build();
    }

    @GetMapping(value = "/export", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> export() {
        String filename = "saldo-meus-dados-" + LocalDate.now() + ".json";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(service.export(currentUser.get()));
    }

    /** POST (e não DELETE) para poder enviar a senha no corpo com segurança. */
    @PostMapping("/delete")
    public ResponseEntity<Void> delete(@Valid @RequestBody DeleteAccountRequest body) {
        service.deleteAccount(currentUser.get(), body.password());
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookies.clear()).build();
    }
}
