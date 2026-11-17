package br.com.saldo.account;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class AccountDtos {

    private AccountDtos() {}

    static final String PASSWORD_REGEX = "^(?=.*[A-Za-z])(?=.*\\d).+$";
    static final String PASSWORD_MSG = "A senha deve conter letras e números";

    public record ForgotPasswordRequest(@NotBlank @Email @Size(max = 160) String email) {}

    public record ResetPasswordRequest(
            @NotBlank @Size(max = 100) String token,
            @NotBlank @Size(min = 8, max = 72) @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MSG) String password
    ) {}

    public record VerifyEmailRequest(@NotBlank @Size(max = 100) String token) {}

    public record UpdateProfileRequest(@NotBlank @Size(max = 80) String name) {}

    public record ChangePasswordRequest(
            @NotBlank @Size(max = 72) String currentPassword,
            @NotBlank @Size(min = 8, max = 72) @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MSG) String newPassword
    ) {}

    public record DeleteAccountRequest(@NotBlank @Size(max = 72) String password) {}

    public record AccountResponse(UUID id, String name, String email, boolean emailVerified, Instant createdAt) {}
}
