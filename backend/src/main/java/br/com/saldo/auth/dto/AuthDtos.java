package br.com.saldo.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Size(max = 80) String name,
            @NotBlank @Email @Size(max = 160) String email,
            @NotBlank
            @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres")
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "A senha deve conter letras e números")
            String password,
            @AssertTrue(message = "É preciso aceitar os Termos de Uso e a Política de Privacidade") boolean acceptTerms
    ) {}

    public record LoginRequest(
            @NotBlank @Email @Size(max = 160) String email,
            @NotBlank @Size(max = 72) String password
    ) {}

    public record MeResponse(UUID id, String name, String email, boolean emailVerified) {}

    public record AuthResponse(String accessToken, long expiresIn, MeResponse user) {}
}
