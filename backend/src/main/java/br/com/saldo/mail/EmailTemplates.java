package br.com.saldo.mail;

import org.springframework.web.util.HtmlUtils;

/** Templates HTML simples e compatíveis com a maioria dos clientes de e-mail. */
public final class EmailTemplates {

    private EmailTemplates() {}

    public static String action(String name, String title, String text, String buttonLabel, String url, String footer) {
        String safeName = HtmlUtils.htmlEscape(name);
        return """
                <!doctype html>
                <html lang="pt-BR"><body style="margin:0;background:#f3f5fa;font-family:Arial,Helvetica,sans-serif;color:#151a2d">
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="padding:32px 12px">
                <tr><td align="center">
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px">
                <tr><td>
                <div style="font-weight:800;font-size:20px;color:#2f5bea;margin-bottom:24px">Saldo</div>
                <h1 style="font-size:22px;margin:0 0 12px">%s</h1>
                <p style="font-size:15px;line-height:1.55;color:#5b6275;margin:0 0 8px">Olá, %s!</p>
                <p style="font-size:15px;line-height:1.55;color:#5b6275;margin:0 0 24px">%s</p>
                <a href="%s" style="display:inline-block;background:#2f5bea;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:10px">%s</a>
                <p style="font-size:12px;line-height:1.5;color:#9aa1b2;margin:28px 0 0">%s<br>Se o botão não funcionar, copie este link: <br><span style="color:#2f5bea;word-break:break-all">%s</span></p>
                </td></tr></table>
                </td></tr></table>
                </body></html>
                """.formatted(title, safeName, text, url, buttonLabel, footer, url);
    }
}
