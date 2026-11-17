package br.com.saldo.auth;

public class InvalidRefreshTokenException extends RuntimeException {
    public InvalidRefreshTokenException() {
        super("Refresh token inválido");
    }
}
