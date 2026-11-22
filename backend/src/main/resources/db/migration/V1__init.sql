-- Recalcula - schema inicial (controle financeiro pessoal)
-- Todos os dados pertencem a um usuário (user_id). Um futuro módulo de "contas compartilhadas"
-- pode ser adicionado com novas tabelas sem alterar estas.

CREATE TABLE users (
    id            UUID PRIMARY KEY,
    name          VARCHAR(80)  NOT NULL,
    email         VARCHAR(160) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL
);
CREATE UNIQUE INDEX ux_users_email ON users (LOWER(email));

CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX ix_refresh_tokens_user ON refresh_tokens (user_id);

CREATE TABLE incomes (
    id          UUID PRIMARY KEY,
    user_id     UUID           NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    description VARCHAR(120)   NOT NULL,
    amount      NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    type        VARCHAR(20)    NOT NULL,
    recurring   BOOLEAN        NOT NULL,
    start_month DATE           NOT NULL,
    end_month   DATE,
    created_at  TIMESTAMPTZ    NOT NULL,
    updated_at  TIMESTAMPTZ    NOT NULL
);
CREATE INDEX ix_incomes_user ON incomes (user_id);

CREATE TABLE bills (
    id          UUID PRIMARY KEY,
    user_id     UUID           NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    description VARCHAR(120)   NOT NULL,
    amount      NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    due_day     INTEGER        NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    category    VARCHAR(20)    NOT NULL,
    housing     BOOLEAN        NOT NULL DEFAULT FALSE,
    recurring   BOOLEAN        NOT NULL,
    start_month DATE           NOT NULL,
    end_month   DATE,
    created_at  TIMESTAMPTZ    NOT NULL,
    updated_at  TIMESTAMPTZ    NOT NULL
);
CREATE INDEX ix_bills_user ON bills (user_id);

CREATE TABLE bill_payments (
    id              UUID PRIMARY KEY,
    bill_id         UUID        NOT NULL REFERENCES bills (id) ON DELETE CASCADE,
    reference_month DATE        NOT NULL,
    paid_at         TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL,
    CONSTRAINT ux_bill_payment UNIQUE (bill_id, reference_month)
);

CREATE TABLE credit_cards (
    id           UUID PRIMARY KEY,
    user_id      UUID           NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name         VARCHAR(60)    NOT NULL,
    bank         VARCHAR(60)    NOT NULL,
    color        VARCHAR(9)     NOT NULL,
    credit_limit NUMERIC(14, 2) NOT NULL CHECK (credit_limit >= 0),
    closing_day  INTEGER        NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day      INTEGER        NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    archived     BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ    NOT NULL,
    updated_at   TIMESTAMPTZ    NOT NULL
);
CREATE INDEX ix_cards_user ON credit_cards (user_id);

CREATE TABLE card_purchases (
    id            UUID PRIMARY KEY,
    card_id       UUID           NOT NULL REFERENCES credit_cards (id) ON DELETE CASCADE,
    description   VARCHAR(120)   NOT NULL,
    total_amount  NUMERIC(14, 2) NOT NULL CHECK (total_amount > 0),
    installments  INTEGER        NOT NULL CHECK (installments BETWEEN 1 AND 48),
    purchase_date DATE           NOT NULL,
    category      VARCHAR(20)    NOT NULL,
    created_at    TIMESTAMPTZ    NOT NULL,
    updated_at    TIMESTAMPTZ    NOT NULL
);
CREATE INDEX ix_purchases_card ON card_purchases (card_id);

CREATE TABLE card_invoice_payments (
    id              UUID PRIMARY KEY,
    card_id         UUID        NOT NULL REFERENCES credit_cards (id) ON DELETE CASCADE,
    reference_month DATE        NOT NULL,
    paid_at         TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL,
    CONSTRAINT ux_invoice_payment UNIQUE (card_id, reference_month)
);

CREATE TABLE cash_entries (
    id          UUID PRIMARY KEY,
    user_id     UUID           NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type        VARCHAR(10)    NOT NULL,
    description VARCHAR(120)   NOT NULL,
    amount      NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    entry_date  DATE           NOT NULL,
    category    VARCHAR(20)    NOT NULL,
    created_at  TIMESTAMPTZ    NOT NULL,
    updated_at  TIMESTAMPTZ    NOT NULL
);
CREATE INDEX ix_cash_entries_user_date ON cash_entries (user_id, entry_date);

CREATE TABLE savings_goals (
    id            UUID PRIMARY KEY,
    user_id       UUID           NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name          VARCHAR(80)    NOT NULL,
    target_amount NUMERIC(14, 2) NOT NULL CHECK (target_amount > 0),
    color         VARCHAR(9)     NOT NULL,
    created_at    TIMESTAMPTZ    NOT NULL,
    updated_at    TIMESTAMPTZ    NOT NULL
);
CREATE INDEX ix_goals_user ON savings_goals (user_id);

CREATE TABLE reserve_movements (
    id            UUID PRIMARY KEY,
    goal_id       UUID           NOT NULL REFERENCES savings_goals (id) ON DELETE CASCADE,
    amount        NUMERIC(14, 2) NOT NULL CHECK (amount <> 0),
    description   VARCHAR(120),
    movement_date DATE           NOT NULL,
    created_at    TIMESTAMPTZ    NOT NULL,
    updated_at    TIMESTAMPTZ    NOT NULL
);
CREATE INDEX ix_movements_goal ON reserve_movements (goal_id);
