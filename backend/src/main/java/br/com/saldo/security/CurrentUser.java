package br.com.saldo.security;

import br.com.saldo.user.User;
import br.com.saldo.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Resolve o usuário autenticado a partir do JWT.
 * Todas as consultas usam este id como dono dos dados: o cliente nunca informa de quem é o recurso,
 * o que impede um usuário de acessar dados de outro.
 */
@Component
@RequiredArgsConstructor
public class CurrentUser {

    private final UserRepository users;

    public UUID id() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken token) {
            return UUID.fromString(token.getToken().getSubject());
        }
        throw new AuthenticationCredentialsNotFoundException("Usuário não autenticado");
    }

    public User get() {
        return users.findById(id())
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException("Usuário não encontrado"));
    }
}
