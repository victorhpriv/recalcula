package br.com.saldo.account;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface UserTokenRepository extends JpaRepository<UserToken, UUID> {

    Optional<UserToken> findByTokenHashAndType(String tokenHash, UserToken.Type type);

    /** Invalida tokens anteriores do mesmo tipo (só o último link enviado vale). */
    @Modifying
    @Query("update UserToken t set t.usedAt = :now where t.userId = :userId and t.type = :type and t.usedAt is null")
    int invalidateAll(@Param("userId") UUID userId, @Param("type") UserToken.Type type, @Param("now") Instant now);

    @Modifying
    @Query("delete from UserToken t where t.expiresAt < :limit")
    int deleteExpired(@Param("limit") Instant limit);
}
