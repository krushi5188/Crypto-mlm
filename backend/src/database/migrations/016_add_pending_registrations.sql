-- Create a table to track pending registrations
CREATE TABLE pending_registrations (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(255) NOT NULL UNIQUE,
    referral_code VARCHAR(255) NOT NULL,
    transaction_hash VARCHAR(255) NOT NULL UNIQUE,
    chain VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'unverified',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_pending_registrations_updated_at
BEFORE UPDATE ON pending_registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
