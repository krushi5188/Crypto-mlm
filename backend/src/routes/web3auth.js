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

        let user = await User.findByWalletAddress(lowerCaseAddress);

        if (!user) {
            return res.status(404).json({ error: 'User not found. Please register first.' });
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

// POST /api/v1/auth/web3/register
router.post('/register', async (req, res) => {
    try {
        const { walletAddress, signature, referralCode } = req.body;
        const lowerCaseAddress = walletAddress.toLowerCase();

        // Basic validation
        if (!walletAddress || !signature || !referralCode) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        // Verify signature (you might want a more secure challenge-response for this)
        const recoveredAddress = ethers.verifyMessage(`Registering with referral code: ${referralCode}`, signature);
        if (recoveredAddress.toLowerCase() !== lowerCaseAddress) {
            return res.status(401).json({ error: 'Invalid signature.' });
        }

        // Check if wallet is already registered
        const existingUser = await User.findByWalletAddress(lowerCaseAddress);
        if (existingUser) {
            return res.status(400).json({ error: 'Wallet address is already registered.' });
        }

        // Validate referral code
        const referrer = await User.findByReferralCode(referralCode);
        if (!referrer) {
            return res.status(400).json({ error: 'Invalid referral code.' });
        }

        const username = `user_${lowerCaseAddress.slice(2, 8)}`;
        const email = `${lowerCaseAddress}@placeholder.email`; // Placeholder

        // Create user
        const newUserId = await User.create({
            wallet_address: lowerCaseAddress,
            username: username,
            email: email,
            password_hash: 'n/a', // Not applicable for web3-only users
            referral_code: await generateReferralCode(),
            referred_by_id: referrer.id,
            role: 'member',
            approval_status: 'pending', // Or 'pending' if you want manual approval
        });

        const newUser = await User.findById(newUserId);
        const token = generateToken(newUser);

        res.status(201).json({ token, user: newUser });

    } catch (error) {
        console.error('Web3 Registration Error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

module.exports = router;
