
const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const crypto = require('crypto');
const User = require('../models/User');
const { pool } = require('../config/database');
const { generateToken } = require('../utils/jwtToken');

// GET /api/v1/auth/web3/challenge
router.get('/challenge', async (req, res) => {
    try {
        const { walletAddress } = req.query;
        if (!walletAddress || !ethers.isAddress(walletAddress)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const challenge = crypto.randomBytes(32).toString('hex');
        const lowerCaseAddress = walletAddress.toLowerCase();

        await pool.query(
            'INSERT INTO web3_challenges (wallet_address, challenge) VALUES ($1, $2) ON CONFLICT (wallet_address) DO UPDATE SET challenge = $2, created_at = NOW()',
            [lowerCaseAddress, challenge]
        );

        res.json({ challenge });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate challenge' });
    }
});

// POST /api/v1/auth/web3/verify
router.post('/verify', async (req, res) => {
    try {
        const { walletAddress, signature, referralCode, transactionHash, chain } = req.body;
        const lowerCaseAddress = walletAddress.toLowerCase();

        const challengeResult = await pool.query('SELECT challenge FROM web3_challenges WHERE wallet_address = $1', [lowerCaseAddress]);
        const challenge = challengeResult.rows[0]?.challenge;

        if (!challenge) {
            return res.status(400).json({ error: 'No challenge found or challenge expired.' });
        }

        const recoveredAddress = ethers.verifyMessage(challenge, signature);

        if (recoveredAddress.toLowerCase() !== lowerCaseAddress) {
            return res.status(401).json({ error: 'Invalid signature.' });
        }

        // Clean up the challenge
        await pool.query('DELETE FROM web3_challenges WHERE wallet_address = $1', [lowerCaseAddress]);

        let user = await User.findByWalletAddress(lowerCaseAddress);

        // If user exists, it's a login
        if (user) {
            const token = generateToken(user);
            return res.json({ token, user, message: 'Login successful' });
        }

        // If user does not exist, it's a registration
        if (!referralCode || !transactionHash || !chain) {
            return res.status(400).json({ error: 'Missing required fields for registration.' });
        }

        // Save to pending_registrations to be verified by the background service
        await pool.query(
            'INSERT INTO pending_registrations (wallet_address, referral_code, transaction_hash, chain) VALUES ($1, $2, $3, $4)',
            [lowerCaseAddress, referralCode, transactionHash, chain]
        );

        res.status(202).json({
            success: true,
            message: 'Registration submitted. Please check back in a few minutes for verification.'
        });

    } catch (error) {
        console.error('Web3 Verify Error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// POST /api/v1/auth/web3/link
router.post('/link', async (req, res) => {
    try {
        const { walletAddress, signature, message } = req.body;
        const userId = req.user.id; // From authenticate middleware

        const recoveredAddress = ethers.verifyMessage(message, signature);

        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Check if wallet is already linked to another account
        const existingUser = await User.findByWalletAddress(walletAddress);
        if (existingUser && existingUser.id !== userId) {
            return res.status(400).json({ error: 'Wallet is already linked to another account.' });
        }

        await User.updateProfile(userId, { wallet_address: walletAddress });

        res.json({ success: true, message: 'Wallet linked successfully.' });

    } catch (error) {
        res.status(500).json({ error: 'Failed to link wallet' });
    }
});

// POST /api/v1/auth/web3/submit-registration
router.post('/submit-registration', async (req, res) => {
    try {
        const { walletAddress, referralCode, transactionHash, chain } = req.body;

        // Basic validation
        if (!walletAddress || !referralCode || !transactionHash || !chain) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        // Check if wallet is already registered
        const existingUser = await User.findByWalletAddress(walletAddress);
        if (existingUser) {
            return res.status(400).json({ error: 'Wallet address is already registered.' });
        }

        // Validate referral code
        const referrer = await User.findByReferralCode(referralCode);
        if (!referrer) {
            return res.status(400).json({ error: 'Invalid referral code.' });
        }

        // Save to pending_registrations
        await pool.query(
            'INSERT INTO pending_registrations (wallet_address, referral_code, transaction_hash, chain) VALUES ($1, $2, $3, $4)',
            [walletAddress, referralCode, transactionHash, chain]
        );

        res.status(202).json({ success: true, message: 'Registration submitted and is being verified.' });

    } catch (error) {
        console.error('Submit Registration Error:', error);
        res.status(500).json({ error: 'Registration submission failed' });
    }
});

// GET /api/v1/auth/web3/registration-status
router.get('/registration-status', async (req, res) => {
    try {
        const { walletAddress } = req.query;

        // Check if user exists
        const user = await User.findByWalletAddress(walletAddress);
        if (user) {
            const token = generateToken(user);
            return res.json({ status: 'verified', token, user });
        }

        // Check pending_registrations
        const pendingResult = await pool.query('SELECT status FROM pending_registrations WHERE wallet_address = $1', [walletAddress]);
        const pendingStatus = pendingResult.rows[0]?.status;

        if (pendingStatus) {
            return res.json({ status: pendingStatus });
        }

        return res.status(404).json({ status: 'not_found' });

    } catch (error) {
        console.error('Registration Status Error:', error);
        res.status(500).json({ error: 'Failed to get registration status' });
    }
});


module.exports = router;
