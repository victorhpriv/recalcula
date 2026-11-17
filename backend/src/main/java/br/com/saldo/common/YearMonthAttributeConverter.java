package br.com.saldo.common;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.time.LocalDate;
import java.time.YearMonth;

/** Persiste YearMonth como DATE (primeiro dia do mês). */
@Converter(autoApply = true)
public class YearMonthAttributeConverter implements AttributeConverter<YearMonth, LocalDate> {

    @Override
    public LocalDate convertToDatabaseColumn(YearMonth value) {
        return value == null ? null : value.atDay(1);
    }

    @Override
    public YearMonth convertToEntityAttribute(LocalDate value) {
        return value == null ? null : YearMonth.from(value);
    }
}
