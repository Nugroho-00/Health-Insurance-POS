-- Transaction registry + idempotency enforcement
CREATE TABLE idempotency_keys (
    id               UUID PRIMARY KEY,
    wix_order_id     VARCHAR(255) UNIQUE NOT NULL,
    status           VARCHAR(20) DEFAULT 'PENDING',
    amount           DECIMAL(19, 4),
    currency         VARCHAR(10),
    description      VARCHAR(255),
    customer_email   VARCHAR(255),
    response_payload JSONB,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Immutable double-entry ledger (never updated or deleted)
CREATE TABLE ledger_entries (
    id             UUID PRIMARY KEY,
    transaction_id UUID NOT NULL,
    account_type   VARCHAR(50),
    amount         DECIMAL(19, 4) NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);