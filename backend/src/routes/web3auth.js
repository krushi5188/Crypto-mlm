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

// POST /api/v1/auth/web3/register
router.post('/register', async (req, res) => {
    try {
        const { walletAddress, signature, referralCode } = req.body;

        if (!referralCode) {
            return res.status(400).json({ error: 'Referral code is required' });
        }

        const referrer = await User.findByReferralCode(referralCode);
        if (!referrer) {
            return res.status(400).json({ error: 'Invalid referral code' });
        }

        const lowerCaseAddress = walletAddress.toLowerCase();
        const challengeResult = await pool.query('SELECT challenge FROM web3_challenges WHERE wallet_address = $1', [lowerCaseAddress]);
        const challenge = challengeResult.rows[0]?.challenge;

        if (!challenge) {
            return res.status(400).json({ error: 'No challenge found. Please try again' });
        }

        const recoveredAddress = ethers.verifyMessage(challenge, signature);

        if (recoveredAddress.toLowerCase() !== lowerCaseAddress) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        await pool.query('DELETE FROM web3_challenges WHERE wallet_address = $1', [lowerCaseAddress]);

        let user = await User.findByWalletAddress(lowerCaseAddress);
        if (user) {
            return res.status(400).json({ error: 'A user with this wallet already exists' });
        }

        const newReferralCode = await User.generateReferralCode();
        const userId = await User.create({
            wallet_address: lowerCaseAddress,
            username: `user_${lowerCaseAddress.slice(2, 8)}`,
            email: `${lowerCaseAddress}@placeholder.email`,
            password_hash: 'web3_user',
            referral_code: newReferralCode,
            referred_by: referrer.id,
            role: 'member',
        });

        user = await User.findById(userId);
        const token = generateToken(user);
        res.status(201).json({ token, user });

    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/v1/auth/web3/login
router.post('/login', async (req, res) => {
    try {
        const { walletAddress, signature } = req.body;
        const lowerCaseAddress = walletAddress.toLowerCase();

        const challengeResult = await pool.query('SELECT challenge FROM web3_challenges WHERE wallet_address = $1', [lowerCaseAddress]);
        const challenge = challengeResult.rows[0]?.challenge;

        if (!challenge) {
            return res.status(400).json({ error: 'No challenge found for this address' });
        }

        const recoveredAddress = ethers.verifyMessage(challenge, signature);

        if (recoveredAddress.toLowerCase() !== lowerCaseAddress) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        await pool.query('DELETE FROM web3_challenges WHERE wallet_address = $1', [lowerCaseAddress]);

        const user = await User.findByWalletAddress(lowerCaseAddress);

        if (!user) {
            return res.status(404).json({ error: 'User not found. Please register' });
        }

        const token = generateToken(user);
        res.json({ token, user });

    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
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

module.exports = router;
