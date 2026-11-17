package br.com.saldo.common;

import org.junit.jupiter.api.Test;

import java.time.YearMonth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RecurrenceTest {

    @Test
    void recorrenteValeDoInicioAteOFim() {
        var r = Recurrence.of(true, YearMonth.of(2026, 3), YearMonth.of(2026, 6));
        assertThat(r.isActiveIn(YearMonth.of(2026, 2))).isFalse();
        assertThat(r.isActiveIn(YearMonth.of(2026, 3))).isTrue();
        assertThat(r.isActiveIn(YearMonth.of(2026, 6))).isTrue();
        assertThat(r.isActiveIn(YearMonth.of(2026, 7))).isFalse();
    }

    @Test
    void recorrenteSemFimValeParaSempre() {
        var r = Recurrence.of(true, YearMonth.of(2026, 1), null);
        assertThat(r.isActiveIn(YearMonth.of(2030, 12))).isTrue();
    }

    @Test
    void avulsaValeSoNoMesInicial() {
        var r = Recurrence.of(false, YearMonth.of(2026, 5), YearMonth.of(2026, 9));
        assertThat(r.isActiveIn(YearMonth.of(2026, 5))).isTrue();
        assertThat(r.isActiveIn(YearMonth.of(2026, 6))).isFalse();
        assertThat(r.getEndMonth()).isNull();
    }

    @Test
    void fimAntesDoInicioEhRejeitado() {
        assertThatThrownBy(() -> Recurrence.of(true, YearMonth.of(2026, 5), YearMonth.of(2026, 1)))
                .isInstanceOf(BusinessException.class);
    }
}
