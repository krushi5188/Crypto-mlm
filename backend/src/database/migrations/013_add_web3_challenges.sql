-- Create a table to store Web3 login challenges
CREATE TABLE web3_challenges (
    wallet_address VARCHAR(42) PRIMARY KEY,
    challenge TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add a trigger to automatically delete old challenges
CREATE OR REPLACE FUNCTION delete_old_challenges()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM web3_challenges WHERE created_at < NOW() - INTERVAL '5 minutes';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delete_old_challenges_trigger
AFTER INSERT ON web3_challenges
EXECUTE FUNCTION delete_old_challenges();
