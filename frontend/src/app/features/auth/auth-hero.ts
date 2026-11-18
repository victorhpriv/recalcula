import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BRAND } from '../../core/brand';

/** Painel lateral das telas de acesso: marca, a pergunta que o produto responde e um exemplo do mês. */
@Component({
  selector: 'app-auth-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="logo"><img src="favicon.svg" width="28" height="28" alt="" /> {{ brand.name }}</div>

    <div class="pitch">
      <h1>Quanto sobra até o fim do mês?</h1>
      <p>Cadastre sua renda, suas contas e seus cartões. O {{ brand.name }} mostra o saldo previsto dia a dia, antes de o mês acabar.</p>
    </div>

    <figure class="example" aria-label="Exemplo: saldo previsto de R$ 3.099,60 no fim do mês">
      <div class="ex-head">
        <span>Saldo previsto em 30 de novembro</span>
        <b>R$ 3.099,60</b>
      </div>
      <svg viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
        <path class="fill" d="M0,14 L66,16 L66,46 L132,48 L132,52 L200,54 L266,57 L266,88 L333,90 L333,98 L400,100 L400,120 L0,120 Z" />
        <path class="ln" d="M0,14 L66,16 L66,46 L132,48 L132,52 L200,54 L266,57 L266,88 L333,90 L333,98 L400,100" />
      </svg>
      <figcaption>
        <span>Aluguel, dia 5</span><span>Cartão, dia 20</span><span>Fim do mês</span>
      </figcaption>
    </figure>

    <ul class="points">
      <li>Faturas e parcelas calculadas pela data de fechamento do cartão</li>
      <li>Lembrete de cada conta pelo dia do vencimento</li>
      <li>Seus dados ficam só com você. Exporte ou apague quando quiser</li>
    </ul>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 2.5rem; justify-content: space-between; }
    .logo { display: flex; align-items: center; gap: 0.55rem; font-weight: 750; font-size: 1.1rem; letter-spacing: -0.02em; }
    .logo img { border-radius: 7px; box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18); }
    h1 { font-size: clamp(2rem, 3.2vw, 2.8rem); line-height: 1.05; letter-spacing: -0.035em; font-weight: 750; max-width: 13ch; margin: 0 0 1rem; }
    p { color: rgba(236, 245, 240, 0.72); max-width: 44ch; line-height: 1.55; margin: 0; font-size: 0.98rem; }
    .example { margin: 0; padding: 1.1rem 1.2rem 0.9rem; border-radius: 14px; background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1); max-width: 460px; }
    .ex-head { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; font-size: 0.8rem; color: rgba(236, 245, 240, 0.65); }
    .ex-head b { font-size: 1.35rem; color: #fff; font-weight: 700; letter-spacing: -0.02em; }
    svg { display: block; width: 100%; height: 110px; margin-top: 0.8rem; }
    .ln { fill: none; stroke: #7fd8b4; stroke-width: 2; vector-effect: non-scaling-stroke; stroke-linejoin: round; }
    .fill { fill: rgba(127, 216, 180, 0.1); }
    figcaption { display: flex; justify-content: space-between; font-size: 0.7rem; color: rgba(236, 245, 240, 0.5); margin-top: 0.5rem; }
    .points { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.65rem; max-width: 46ch; }
    .points li { position: relative; padding-left: 1.4rem; font-size: 0.88rem; color: rgba(236, 245, 240, 0.8); line-height: 1.45; }
    .points li::before { content: ''; position: absolute; left: 0; top: 0.42em; width: 0.6rem; height: 0.35rem;
      border-left: 2px solid #7fd8b4; border-bottom: 2px solid #7fd8b4; transform: rotate(-45deg); }
  `,
})
export class AuthHero {
  protected readonly brand = BRAND;
}
