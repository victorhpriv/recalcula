package br.com.saldo.common;

import br.com.saldo.auth.AccountLockedException;
import br.com.saldo.auth.InvalidCredentialsException;
import br.com.saldo.auth.InvalidRefreshTokenException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.LinkedHashMap;
import java.util.Map;

/** Respostas de erro padronizadas no formato RFC 7807 (Problem Details). */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(fe -> errors.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Dados inválidos");
        pd.setTitle("Erro de validação");
        pd.setProperty("errors", errors);
        return ResponseEntity.badRequest().body(pd);
    }

    @ExceptionHandler(NotFoundException.class)
    ProblemDetail notFound(NotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Não encontrado", ex.getMessage());
    }

    @ExceptionHandler(BusinessException.class)
    ProblemDetail business(BusinessException ex) {
        return problem(HttpStatus.UNPROCESSABLE_ENTITY, "Regra de negócio", ex.getMessage());
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    ProblemDetail invalidCredentials(InvalidCredentialsException ex) {
        return problem(HttpStatus.UNAUTHORIZED, "Não autorizado", "E-mail ou senha inválidos");
    }

    @ExceptionHandler(InvalidRefreshTokenException.class)
    ProblemDetail invalidRefresh(InvalidRefreshTokenException ex) {
        return problem(HttpStatus.UNAUTHORIZED, "Sessão expirada", "Faça login novamente");
    }

    @ExceptionHandler(AccountLockedException.class)
    ProblemDetail locked(AccountLockedException ex) {
        return problem(HttpStatus.TOO_MANY_REQUESTS, "Muitas tentativas", ex.getMessage());
    }

    @ExceptionHandler(AuthenticationException.class)
    ProblemDetail authentication(AuthenticationException ex) {
        return problem(HttpStatus.UNAUTHORIZED, "Não autorizado", "Autenticação necessária");
    }

    @ExceptionHandler(AccessDeniedException.class)
    ProblemDetail accessDenied(AccessDeniedException ex) {
        return problem(HttpStatus.FORBIDDEN, "Acesso negado", "Você não tem permissão para esta ação");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ProblemDetail typeMismatch(MethodArgumentTypeMismatchException ex) {
        return problem(HttpStatus.BAD_REQUEST, "Parâmetro inválido", "Valor inválido para '" + ex.getName() + "'");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail integrity(DataIntegrityViolationException ex) {
        log.warn("Violação de integridade: {}", ex.getMostSpecificCause().getMessage());
        return problem(HttpStatus.CONFLICT, "Conflito", "A operação conflita com dados existentes");
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail unexpected(Exception ex) {
        log.error("Erro inesperado", ex);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno", "Ocorreu um erro inesperado");
    }

    private static ProblemDetail problem(HttpStatus status, String title, String detail) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setTitle(title);
        return pd;
    }
}
