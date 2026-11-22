import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-auth-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="logo"><img src="favicon.svg" width="34" height="34" alt="" /> Recalcula</div>
    <div class="mock" aria-hidden="true">
      <div class="m-card m-balance">
        <div class="m-l">Saldo previsto</div>
        <div class="m-v">R$ 3.099<small>,60</small></div>
        <div class="m-bar"><span style="width: 42%; background: #1e2e7a"></span><span style="width: 25%; background: #2f5bea"></span><span style="width: 8%; background: #9db4ff"></span><span style="width: 25%; background: #22a45d"></span></div>
        <div class="m-ok">↗ 24,8% da renda livre</div>
      </div>
      <div class="m-cc"><span>Meu cartão</span><div class="m-chip"></div><b>•••• fatura R$ 2.410,50</b></div>
      <div class="m-card m-cat">
        <img src="3d/bar-chart.webp" width="44" height="44" alt="" />
        <div><div class="m-l">Maior gasto</div><b>Moradia · 49%</b></div>
      </div>
      <img class="m-ill m-ill-1" src="3d/purse.webp" width="92" height="92" alt="" />
      <img class="m-ill m-ill-2" src="3d/money-bag.webp" width="78" height="78" alt="" />
    </div>
    <div style="position: relative; z-index: 1">
      <h1>Saiba quanto sobra antes do mês acabar.</h1>
      <p>Contas, cartões, gastos do dia a dia e reserva em um só lugar, com o saldo previsto sempre atualizado.</p>
      <div class="features">
        <div><img src="3d/bar-chart.webp" width="30" height="30" alt="" /> Veja para onde vai o seu dinheiro</div>
        <div><img src="3d/credit-card.webp" width="30" height="30" alt="" /> Faturas e parcelas calculadas automaticamente</div>
        <div><img src="3d/shield.webp" width="30" height="30" alt="" /> Seus dados protegidos e só seus</div>
      </div>
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; justify-content: space-between; }
  h1 { font-size: 2.4rem; line-height: 1.1; max-width: 420px; }
  p { opacity: 0.85; max-width: 420px; line-height: 1.5; }
  .logo { display: flex; align-items: center; gap: 0.6rem; font-weight: 700; font-size: 1.05rem; }
  .logo img { border-radius: 10px; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2); }
  .features { margin-top: 1.5rem; }
  .mock { position: relative; height: 300px; margin: 1rem 0; z-index: 1; }
  .m-card { position: absolute; background: #fff; color: #151a2d; border-radius: 18px; padding: 1rem 1.1rem;
    box-shadow: 0 24px 48px -20px rgba(10, 20, 80, 0.55); animation: float 6s ease-in-out infinite; }
  .m-balance { left: 0; top: 30px; width: 300px; }
  .m-l { font-size: 0.7rem; color: #9aa1b2; font-weight: 600; }
  .m-v { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; small { font-size: 0.9rem; color: #9aa1b2; } }
  .m-bar { display: flex; gap: 3px; height: 7px; margin: 0.7rem 0 0.5rem; span { border-radius: 9px; } }
  .m-ok { font-size: 0.72rem; color: #22a45d; font-weight: 700; }
  .m-cc { position: absolute; left: 230px; top: 150px; width: 230px; height: 140px; border-radius: 18px; padding: 1rem;
    background: linear-gradient(135deg, #3a3f52, #151a2d); box-shadow: 0 24px 48px -18px rgba(0, 0, 0, 0.6);
    display: flex; flex-direction: column; justify-content: space-between; font-size: 0.78rem; transform: rotate(-6deg);
    animation: float 7s ease-in-out infinite; animation-delay: -2s; }
  .m-chip { width: 32px; height: 23px; border-radius: 5px; background: linear-gradient(135deg, #fff3c4, #d9b44a); }
  .m-cat { left: 10px; top: 210px; display: flex; gap: 0.6rem; align-items: center; font-size: 0.8rem; animation-delay: -4s; }
  .m-ill { position: absolute; filter: drop-shadow(0 16px 24px rgba(0, 0, 0, 0.25)); animation: float 5s ease-in-out infinite; }
  .m-ill-1 { left: 330px; top: 0; animation-delay: -1s; }
  .m-ill-2 { left: 420px; top: 90px; animation-delay: -3s; }
  @keyframes float { 0%, 100% { translate: 0 0; } 50% { translate: 0 -8px; } }
  @media (max-width: 1100px) { .m-ill, .m-cc { display: none; } }
  @media (prefers-reduced-motion: reduce) { .m-card, .m-cc, .m-ill { animation: none; } }
  .features { display: grid; gap: 0.75rem; position: relative; z-index: 1; }
  .features div { display: flex; gap: 0.6rem; align-items: center; font-size: 0.9rem; }
  .features img { background: rgba(255, 255, 255, 0.18); padding: 0.3rem; border-radius: 10px; box-sizing: content-box; }
  `,
})
export class AuthHero {}
