package br.com.saldo.common;

/**
 * Recurso inexistente ou não pertencente ao usuário (HTTP 404).
 * Usar 404 também para recursos de outro casal evita revelar que eles existem.
 */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String resource) {
        super(resource + " não encontrado(a)");
    }
}
