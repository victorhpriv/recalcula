package br.com.saldo.account;

import br.com.saldo.account.AccountDtos.AccountResponse;
import br.com.saldo.auth.AuthService;
import br.com.saldo.auth.AuthService.UserRegisteredEvent;
import br.com.saldo.auth.LoginAttemptService;
import br.com.saldo.auth.RefreshTokenService;
import br.com.saldo.bill.BillPaymentRepository;
import br.com.saldo.bill.BillRepository;
import br.com.saldo.card.CardInvoicePaymentRepository;
import br.com.saldo.card.CardPurchaseRepository;
import br.com.saldo.card.CreditCard;
import br.com.saldo.card.CreditCardRepository;
import br.com.saldo.cashflow.CashEntryRepository;
import br.com.saldo.common.BusinessException;
import br.com.saldo.common.RateLimiter;
import br.com.saldo.config.AppProperties;
import br.com.saldo.income.IncomeRepository;
import br.com.saldo.mail.EmailTemplates;
import br.com.saldo.mail.MailService;
import br.com.saldo.reserve.ReserveMovementRepository;
import br.com.saldo.reserve.SavingsGoal;
import br.com.saldo.reserve.SavingsGoalRepository;
import br.com.saldo.user.User;
import br.com.saldo.user.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/** Conta do usuário: confirmação de e-mail, recuperação de senha, perfil e direitos da LGPD. */
@Slf4j
@Service
public class AccountService {

    private static final Duration VERIFY_TTL = Duration.ofHours(48);
    private static final Duration RESET_TTL = Duration.ofHours(1);

    private final UserRepository users;
    private final AccountTokenService tokens;
    private final MailService mail;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokens;
    private final LoginAttemptService loginAttempts;
    private final AuthService authService;
    private final AppProperties props;
    private final Clock clock;
    private final IncomeRepository incomes;
    private final BillRepository bills;
    private final BillPaymentRepository billPayments;
    private final CreditCardRepository cards;
    private final CardPurchaseRepository purchases;
    private final CardInvoicePaymentRepository invoicePayments;
    private final CashEntryRepository cashEntries;
    private final SavingsGoalRepository goals;
    private final ReserveMovementRepository movements;
    private final RateLimiter emailLimiter;

    public AccountService(UserRepository users, AccountTokenService tokens, MailService mail, PasswordEncoder passwordEncoder,
                          RefreshTokenService refreshTokens, LoginAttemptService loginAttempts, AuthService authService,
                          AppProperties props, Clock clock, IncomeRepository incomes, BillRepository bills,
                          BillPaymentRepository billPayments, CreditCardRepository cards, CardPurchaseRepository purchases,
                          CardInvoicePaymentRepository invoicePayments, CashEntryRepository cashEntries,
                          SavingsGoalRepository goals, ReserveMovementRepository movements) {
        this.users = users;
        this.tokens = tokens;
        this.mail = mail;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokens = refreshTokens;
        this.loginAttempts = loginAttempts;
        this.authService = authService;
        this.props = props;
        this.clock = clock;
        this.incomes = incomes;
        this.bills = bills;
        this.billPayments = billPayments;
        this.cards = cards;
        this.purchases = purchases;
        this.invoicePayments = invoicePayments;
        this.cashEntries = cashEntries;
        this.goals = goals;
        this.movements = movements;
        // No máximo 3 e-mails por endereço a cada hora (evita spam e abuso).
        this.emailLimiter = new RateLimiter(3, Duration.ofHours(1), clock);
    }

    // ---------------- confirmação de e-mail ----------------

    @TransactionalEventListener
    public void onUserRegistered(UserRegisteredEvent event) {
        users.findById(event.userId()).ifPresent(this::sendVerification);
    }

    @Transactional
    public void resendVerification(User current) {
        if (current.isEmailVerified()) {
            return;
        }
        if (!emailLimiter.tryAcquire("verify:" + current.getId())) {
            throw new BusinessException("Aguarde um pouco antes de pedir outro e-mail.");
        }
        sendVerification(current);
    }

    @Transactional
    public void verifyEmail(String token) {
        UUID userId = tokens.consume(token, UserToken.Type.VERIFY_EMAIL);
        users.findById(userId).ifPresent(u -> {
            if (u.getEmailVerifiedAt() == null) {
                u.setEmailVerifiedAt(clock.instant());
            }
        });
    }

    private void sendVerification(User user) {
        String raw = tokens.issue(user.getId(), UserToken.Type.VERIFY_EMAIL, VERIFY_TTL);
        String url = props.frontendUrl() + "/confirmar-email?token=" + raw;
        String html = EmailTemplates.action(firstName(user), "Confirme seu e-mail",
                "Falta pouco! Confirme seu e-mail para proteger sua conta e poder recuperá-la se esquecer a senha.",
                "Confirmar e-mail", url, "O link vale por 48 horas.");
        sendAsync(user.getEmail(), "Confirme seu e-mail no Recalcula", html);
    }

    // ---------------- recuperação de senha ----------------

    /** Não revela se o e-mail existe: a resposta é sempre a mesma. */
    @Transactional
    public void forgotPassword(String rawEmail) {
        String email = rawEmail.trim().toLowerCase(Locale.ROOT);
        if (!emailLimiter.tryAcquire("reset:" + email)) {
            log.warn("Limite de recuperação de senha atingido para um e-mail");
            return;
        }
        users.findByEmailIgnoreCase(email).ifPresent(user -> {
            String raw = tokens.issue(user.getId(), UserToken.Type.RESET_PASSWORD, RESET_TTL);
            String url = props.frontendUrl() + "/redefinir-senha?token=" + raw;
            String html = EmailTemplates.action(firstName(user), "Redefinir sua senha",
                    "Recebemos um pedido para redefinir a senha da sua conta. Se não foi você, ignore este e-mail: sua senha continua a mesma.",
                    "Criar nova senha", url, "O link vale por 1 hora e só pode ser usado uma vez.");
            sendAsync(user.getEmail(), "Redefinição de senha do Recalcula", html);
        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        UUID userId = tokens.consume(token, UserToken.Type.RESET_PASSWORD);
        User user = users.findById(userId).orElseThrow(() -> new BusinessException("Link inválido ou expirado."));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        // Quem recebeu o link no e-mail também comprova a posse do endereço.
        if (user.getEmailVerifiedAt() == null) {
            user.setEmailVerifiedAt(clock.instant());
        }
        refreshTokens.revokeAll(userId);
        loginAttempts.loginSucceeded(user.getEmail());
    }

    // ---------------- minha conta ----------------

    public AccountResponse details(User current) {
        return new AccountResponse(current.getId(), current.getName(), current.getEmail(), current.isEmailVerified(),
                current.getCreatedAt());
    }

    @Transactional
    public AccountResponse updateProfile(User current, String name) {
        User user = managed(current);
        user.setName(name.trim());
        return details(user);
    }

    /** Troca a senha, encerra as outras sessões e devolve uma nova sessão para este dispositivo. */
    @Transactional
    public AuthService.Session changePassword(User current, String currentPassword, String newPassword) {
        User user = managed(current);
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BusinessException("Senha atual incorreta");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        refreshTokens.revokeAll(user.getId());
        return authService.newSession(user);
    }

    /** Exclusão definitiva da conta e de todos os dados (direito do titular na LGPD). */
    @Transactional
    public void deleteAccount(User current, String password) {
        User user = managed(current);
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BusinessException("Senha incorreta");
        }
        users.delete(user); // as demais tabelas usam ON DELETE CASCADE
        log.info("Conta excluída a pedido do titular: {}", user.getId());
    }

    /** Exportação de todos os dados do usuário em JSON (portabilidade, LGPD). */
    @Transactional(readOnly = true)
    public Map<String, Object> export(User current) {
        UUID userId = current.getId();
        List<UUID> billIds = bills.findByUserIdOrderByDueDayAscDescriptionAsc(userId).stream().map(b -> b.getId()).toList();
        List<CreditCard> cardList = cards.findByUserIdOrderByCreatedAtAsc(userId);
        List<UUID> cardIds = cardList.stream().map(CreditCard::getId).toList();
        List<SavingsGoal> goalList = goals.findByUserIdOrderByCreatedAtAsc(userId);
        List<UUID> goalIds = goalList.stream().map(SavingsGoal::getId).toList();

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", current.getId());
        profile.put("name", current.getName());
        profile.put("email", current.getEmail());
        profile.put("emailVerifiedAt", current.getEmailVerifiedAt());
        profile.put("termsAcceptedAt", current.getTermsAcceptedAt());
        profile.put("createdAt", current.getCreatedAt());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("exportedAt", Instant.now(clock));
        data.put("profile", profile);
        data.put("incomes", incomes.findByUserIdOrderByCreatedAtAsc(userId));
        data.put("bills", bills.findByUserIdOrderByDueDayAscDescriptionAsc(userId));
        data.put("billPayments", billIds.isEmpty() ? List.of() : billPayments.findByBillIdIn(billIds));
        data.put("cards", cardList);
        data.put("cardPurchases", cardIds.isEmpty() ? List.of() : purchases.findByCardIdInOrderByPurchaseDateDesc(cardIds));
        data.put("cardInvoicePayments", cardIds.isEmpty() ? List.of() : invoicePayments.findByCardIdIn(cardIds));
        data.put("cashEntries", cashEntries.findByUserIdOrderByEntryDateAsc(userId));
        data.put("savingsGoals", goalList);
        data.put("reserveMovements", goalIds.isEmpty() ? List.of() : movements.findByGoalIdInOrderByMovementDateDescCreatedAtDesc(goalIds));
        return data;
    }

    @Scheduled(fixedDelay = 3_600_000)
    void cleanupLimiter() {
        emailLimiter.cleanup();
    }

    private User managed(User current) {
        return users.findById(current.getId()).orElseThrow(() -> new BusinessException("Conta não encontrada"));
    }

    private void sendAsync(String to, String subject, String html) {
        // Fora da thread da requisição: resposta rápida e tempo igual exista ou não o e-mail.
        CompletableFuture.runAsync(() -> mail.send(to, subject, html));
    }

    private static String firstName(User user) {
        return user.getName().trim().split("\\s+")[0];
    }
}
