package br.com.saldo.mail;

import br.com.saldo.config.AppProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

import java.nio.charset.StandardCharsets;

@Slf4j
@Configuration
public class MailConfig {

    /**
     * Com MAIL_HOST definido, envia via SMTP; sem ele (desenvolvimento), apenas registra o e-mail no log
     * para que os links de confirmação/recuperação possam ser copiados.
     */
    @Bean
    MailService mailService(Environment env, ObjectProvider<JavaMailSender> sender, AppProperties props) {
        String host = env.getProperty("spring.mail.host", "");
        if (host.isBlank()) {
            log.warn("MAIL_HOST não configurado: e-mails serão apenas registrados no log.");
            return (to, subject, html) -> log.info("[E-MAIL SIMULADO] para={} assunto={}\n{}", to, subject, html);
        }
        JavaMailSender mailSender = sender.getObject();
        return (to, subject, html) -> {
            try {
                var message = mailSender.createMimeMessage();
                var helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
                helper.setFrom(props.mailFrom());
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(html, true);
                mailSender.send(message);
            } catch (Exception e) {
                // Não propaga: falha de e-mail não deve derrubar a requisição do usuário.
                log.error("Falha ao enviar e-mail '{}' para {}", subject, to, e);
            }
        };
    }
}
