package br.com.saldo.account;

import br.com.saldo.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/** Token de uso único enviado por e-mail (confirmação de e-mail ou redefinição de senha). Salvo só como hash. */
@Entity
@Table(name = "user_tokens")
@Getter
@Setter
@NoArgsConstructor
public class UserToken extends BaseEntity {

    public enum Type { VERIFY_EMAIL, RESET_PASSWORD }

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Type type;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;
}
