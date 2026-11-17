package br.com.saldo.auth;

public class AccountLockedException extends RuntimeException {
    public AccountLockedException(long minutes) {
        super("Muitas tentativas de login. Tente novamente em " + minutes + " minuto(s).");
    }
}
