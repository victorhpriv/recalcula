package br.com.saldo.card;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

import static org.assertj.core.api.Assertions.assertThat;

class InvoiceCalculatorTest {

    @Test
    void compraAntesDoFechamentoVenceNoMesmoCiclo() {
        // fecha dia 28, vence dia 5 do mês seguinte
        assertThat(InvoiceCalculator.firstDueMonth(LocalDate.of(2026, 11, 10), 28, 5)).isEqualTo(YearMonth.of(2026, 12));
    }

    @Test
    void compraNoDiaDoFechamentoVaiParaOProximoCiclo() {
        assertThat(InvoiceCalculator.firstDueMonth(LocalDate.of(2026, 11, 28), 28, 5)).isEqualTo(YearMonth.of(2027, 1));
    }

    @Test
    void vencimentoDepoisDoFechamentoNoMesmoMes() {
        // fecha dia 2, vence dia 12
        assertThat(InvoiceCalculator.firstDueMonth(LocalDate.of(2026, 11, 1), 2, 12)).isEqualTo(YearMonth.of(2026, 11));
        assertThat(InvoiceCalculator.firstDueMonth(LocalDate.of(2026, 11, 3), 2, 12)).isEqualTo(YearMonth.of(2026, 12));
    }

    @Test
    void parcelasSomamOTotalComSobraNaPrimeira() {
        var list = InvoiceCalculator.installments(new BigDecimal("100.00"), 3, YearMonth.of(2026, 12));
        assertThat(list).hasSize(3);
        assertThat(list.get(0).amount()).isEqualByComparingTo("33.34");
        assertThat(list.get(1).amount()).isEqualByComparingTo("33.33");
        assertThat(list.get(2).dueMonth()).isEqualTo(YearMonth.of(2027, 2));
    }

    @Test
    void fechamentoEmMesCurtoUsaUltimoDia() {
        assertThat(InvoiceCalculator.closingDate(YearMonth.of(2027, 3), 31, 10)).isEqualTo(LocalDate.of(2027, 2, 28));
    }
}
