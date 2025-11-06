-- Migration to create a unified transactions table for manual adjustments
-- and other financial events, replacing the need for separate logs.

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount DECIMAL(18, 6) NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'injection', 'deduction', 'referral_commission', 'withdrawal'
    description TEXT,
    balance_after DECIMAL(18, 6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Optional: Link to the admin who performed the action
    admin_id INTEGER REFERENCES users(id)
);

-- Index for faster querying of user transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Comment on the table for clarity
COMMENT ON TABLE transactions IS 'Records all financial transactions, including manual adjustments, commissions, and withdrawals.';
