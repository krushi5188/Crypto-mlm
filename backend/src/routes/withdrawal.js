const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireInstructor } = require('../middleware/roleAuth');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');

// @route   POST /api/withdrawals
// @desc    Request a new withdrawal
// @access  Private
router.post('/', authenticate, async (req, res) => {
    const { amount, wallet_address, chain } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.balance < amount) {
            return res.status(400).json({ msg: 'Insufficient balance' });
        }

        const newWithdrawal = await Withdrawal.create({
            user_id: userId,
            amount,
            wallet_address,
            chain,
        });

        // Deduct from user's balance
        await User.updateBalanceOnly(userId, user.balance - amount);

        res.json(newWithdrawal);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/withdrawals
// @desc    Get user's withdrawal history
// @access  Private
router.get('/', authenticate, async (req, res) => {
    try {
        const withdrawals = await Withdrawal.getUserWithdrawals(req.user.id);
        res.json(withdrawals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/withdrawals/admin
// @desc    Get all withdrawals (admin)
// @access  Instructor
router.get('/admin', requireInstructor, async (req, res) => {
    try {
        const withdrawals = await Withdrawal.getAllWithdrawals(req.query);
        res.json(withdrawals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/withdrawals/admin/:id
// @desc    Update a withdrawal status (admin)
// @access  Instructor
router.put('/admin/:id', requireInstructor, async (req, res) => {
    const { status, transaction_hash, rejected_reason } = req.body;
    const withdrawalId = req.params.id;

    try {
        const withdrawal = await Withdrawal.getById(withdrawalId);
        if (!withdrawal) {
            return res.status(404).json({ msg: 'Withdrawal not found' });
        }

        const updatedWithdrawal = await Withdrawal.updateStatus(withdrawalId, status, {
            transaction_hash,
            rejected_reason,
            approved_by: req.user.id
        });

        // If rejected, refund the user's balance
        if (status === 'rejected') {
            const user = await User.findById(withdrawal.user_id);
            await User.updateBalanceOnly(withdrawal.user_id, user.balance + withdrawal.amount);
        }

        res.json(updatedWithdrawal);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
