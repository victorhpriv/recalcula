# Saldo

App de controle financeiro pessoal: saldo previsto do mês, contas a pagar, cartões com parcelas, gastos do dia a dia, gastos por categoria, custo de moradia e reserva.

**Stack:** Java 21 · Spring Boot 3.5 · Spring Security (JWT) · JPA/Hibernate · PostgreSQL · Flyway · Angular 21 · PrimeNG 21 · Docker Compose

---

## Como rodar

### Opção 1: tudo com Docker (mais simples)

```bash
cp .env.example .env
# edite o .env: defina DB_PASSWORD e JWT_SECRET (gere com: openssl rand -base64 48)
docker compose up --build
```

- App: **http://localhost:8081**
- Landing page: **http://localhost:8080**

### Opção 2: desenvolvimento local

**Banco:**
```bash
docker compose up db -d
```

**Backend** (porta 8080; o perfil `dev` já traz um JWT_SECRET de desenvolvimento):
```bash
cd backend
DB_PASSWORD=<a mesma do .env> mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
Swagger no perfil dev: http://localhost:8080/swagger-ui.html

**Frontend** (porta 4200, com proxy de `/api` para o 8080):
```bash
cd frontend
npm install
npm start
```

**Landing page** (estática, sem build):
```bash
cd landing
python -m http.server 8080   # ou abra o index.html no navegador
```
O endereço do app usado nos botões fica em `landing/assets/config.js`.

**Testes do backend:** `mvn test`

**E-mails em desenvolvimento:** sem `MAIL_HOST`, os e-mails de confirmação e de recuperação de senha não são enviados; o link aparece no log da API (`[E-MAIL SIMULADO]`).

---

## Funcionalidades

| Tela | O que faz |
|---|---|
| **Visão geral** | Saldo previsto (renda − contas − faturas − dia a dia), para onde vai o dinheiro (gastos por categoria), cartões e próximas faturas, contas a pagar com filtro por dia de vencimento, moradia vs. referência de 30% da renda e total da reserva |
| **Fluxo de caixa** | Gastos e entradas do dia a dia, agrupados por dia e por categoria |
| **Cartões** | Cartões com fechamento/vencimento, compras parceladas, fatura do mês, próximas 6 faturas, limite usado/livre, marcar fatura como paga |
| **Contas** | Contas fixas (todo mês, com mês final opcional) ou avulsas, categoria, marcação de custo de moradia e status de pagamento por mês |
| **Reserva** | Objetivos com meta, aportes e resgates |
| **Renda** | Salário e outras rendas, fixas ou avulsas |
| **Minha conta** | Nome, troca de senha, confirmação de e-mail, exportação dos dados (JSON) e exclusão da conta |
| **Acesso** | Cadastro com aceite dos termos, login, "esqueci minha senha" com link por e-mail e confirmação de e-mail |

**Visual:** ilustrações próprias em SVG (`frontend/public/illustrations`), cor e ícone por categoria, estados vazios ilustrados, checklist de primeiros passos, valores com contagem animada, tema claro/escuro e layout responsivo. É um **PWA**: pode ser instalado no celular e no computador (a interface fica em cache; dados da API nunca são cacheados).

O botão **Adicionar** no topo lança gasto, conta, compra no cartão ou renda de qualquer tela. O seletor de mês vale para o app inteiro.

---

## Segurança

- **Senhas** com BCrypt (custo 12) e política mínima (8+ caracteres, letras e números).
- **Access token JWT** (HS256) de 15 min, guardado **só em memória** no frontend (fora do localStorage, o que protege contra roubo via XSS).
- **Refresh token** opaco em cookie `HttpOnly` + `Secure` + `SameSite=Strict`, restrito a `/api/auth`, **rotacionado a cada uso** e salvo no banco **apenas como hash SHA-256**. Reuso de token revogado (sinal de roubo) encerra todas as sessões do usuário.
- **Força bruta:** bloqueio de 15 min após 5 tentativas erradas; mesmo tempo de resposta para e-mail existente ou não.
- **Isolamento de dados:** todo registro pertence a um `user_id` obtido do token, nunca do cliente; recursos de outro usuário retornam 404.
- **Validação** com Bean Validation em todos os DTOs; erros no padrão RFC 7807 sem stack trace.
- **CORS** restrito às origens configuradas + checagem de `Origin` nos endpoints que usam cookie.
- **Headers** CSP, `X-Frame-Options: DENY`, `nosniff` e `Referrer-Policy` (no Spring e no nginx).
- **Cartões:** número, validade e CVV não são armazenados.
- **Recuperação de senha e confirmação de e-mail** com tokens de uso único (guardados só como hash), validade curta e limite de 3 e-mails por hora; a resposta de "esqueci a senha" é a mesma exista ou não a conta.
- **LGPD:** aceite registrado dos termos, exportação de dados e exclusão definitiva da conta pelo próprio usuário.
- Segredos só por variável de ambiente; containers com usuário sem privilégios.

> Em produção, sirva tudo por **HTTPS** e mantenha `COOKIE_SECURE=true` (o padrão).

---

## Estrutura

```
backend/   API Spring Boot, organizada por funcionalidade (br.com.saldo)
  auth/        login, cadastro, JWT, refresh token, proteção contra força bruta
  income/  bill/  card/  cashflow/  reserve/  dashboard/
  common/      entidade base, Money, Recurrence, categorias, tratamento de erros
  db/migration Flyway (V1__init.sql)

  account/     minha conta, tokens de e-mail, exportação e exclusão (LGPD)
  mail/        envio de e-mails (SMTP ou log em desenvolvimento) e templates

frontend/  Angular (standalone components, signals, rxResource)
  core/        auth (service, interceptor, guards), API tipada, estado global, tema
  layout/      shell com menu lateral, seletor de mês e "Adicionar"
  shared/      formulários (diálogos), componentes de UI, pipes e utilitários
  features/    uma pasta por tela
  public/      ilustrações, ícones do PWA e cópias de termos/privacidade

landing/   site estático (HTML/CSS/JS) com SEO, termos e política de privacidade
.github/   CI (testes + build + imagens Docker) e Dependabot
```

> Os textos de **termos** e **privacidade** ficam em `landing/`. Se alterar, copie também para `frontend/public/` (o app linka para eles).

### Endpoints principais

```
POST /api/auth/register | login | refresh | logout      GET /api/auth/me
POST /api/auth/forgot-password | reset-password | verify-email
GET  /api/account   PUT /api/account/profile | password   POST /api/account/resend-verification | delete
GET  /api/account/export
GET  /api/dashboard?month=2026-12
CRUD /api/incomes  /api/bills  /api/cash-flow  /api/cards  /api/cards/{id}/purchases
POST|DELETE /api/bills/{id}/payments?month=
GET  /api/cards/{id}/invoices/{month}   POST|DELETE /api/cards/{id}/invoices/{month}/payment
GET  /api/reserve   /api/reserve/goals/...
```

---

## Antes de lançar

- [ ] Preencher os campos entre colchetes em `landing/termos.html` e `landing/privacidade.html` e revisar com um advogado
- [ ] Escolher domínio (ex.: `saldo.com.br` para a landing e `app.saldo.com.br` para o app) e trocar `saldo.app` nos arquivos da landing
- [ ] Configurar SMTP (Amazon SES, Resend ou Brevo) e o remetente com SPF/DKIM no domínio
- [ ] Subir em produção com HTTPS (`COOKIE_SECURE=true`, `CORS_ORIGINS` e `FRONTEND_URL` com o domínio real)
- [ ] Backup automático do PostgreSQL e teste de restauração
- [ ] Monitoramento de erros (Sentry) e alerta de disponibilidade

## Roadmap

- **Contas compartilhadas (casal/casa):** hoje cada registro pertence a um único `user_id`. Para dividir despesas no futuro, a ideia é criar um módulo novo (grupos, membros, despesas compartilhadas e acertos) com tabelas próprias, sem alterar as tabelas pessoais.
- Testes de integração com Testcontainers (PostgreSQL real).
- Mover o bloqueio de login para Redis se rodar mais de uma instância.
- Importação de extrato/OFX e lembretes de vencimento.
