package br.com.saldo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.YearMonth;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    /** Permite receber ?month=2026-12 como YearMonth nos controllers. */
    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(String.class, YearMonth.class, YearMonth::parse);
    }
}
