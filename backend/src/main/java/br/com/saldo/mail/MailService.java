package br.com.saldo.mail;

/** Envio de e-mails transacionais. */
public interface MailService {

    void send(String to, String subject, String html);
}
