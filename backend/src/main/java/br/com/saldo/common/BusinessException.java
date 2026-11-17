package br.com.saldo.common;

/** Violação de regra de negócio (HTTP 422). */
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
