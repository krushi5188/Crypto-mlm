
const { pool } = require('../config/database');
const User = require('../models/User');
const { generateReferralCode } = require('../utils/generateReferralCode');
const { ethers } = require('ethers');
const TronWeb = require('tronweb');
const { USDT_ABI, USDT_ADDRESSES, PLATFORM_WALLET_ADDRESS, SIGNUP_FEE_USDT } = require('../config/constants');


const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY } // Use environment variable for API key
});

const bscProvider = new ethers.JsonRpcProvider('https://bsc-dataseed.bnbchain.org');

class TransactionVerifierService {
    static async verifyPendingTransactions() {
        const pendingResult = await pool.query("SELECT * FROM pending_registrations WHERE status = 'unverified'");

        for (const registration of pendingResult.rows) {
            try {
                const isVerified = await this.verifyTransaction(registration.transaction_hash, registration.chain, registration.wallet_address);

                if (isVerified) {
                    const referrer = await User.findByReferralCode(registration.referral_code);
                    if (!referrer) {
                        throw new Error(`Referrer not found for code: ${registration.referral_code}`);
                    }
                    await User.create({
                        wallet_address: registration.wallet_address,
                        username: `user_${registration.wallet_address.slice(-6)}`,
                        email: null, // No email for wallet-only signup
                        password_hash: null, // No password for wallet-only signup
                        referral_code: await generateReferralCode(),
                        referred_by_id: referrer.id,
                        role: 'member',
                        approval_status: 'approved', // Auto-approved after payment
                    });

                    await pool.query("UPDATE pending_registrations SET status = 'verified' WHERE id = $1", [registration.id]);
                } else {
                    await pool.query("UPDATE pending_registrations SET status = 'failed' WHERE id = $1", [registration.id]);
                }
            } catch (error) {
                console.error(`Error processing registration for wallet ${registration.wallet_address} with tx ${registration.transaction_hash}:`, error);
                await pool.query("UPDATE pending_registrations SET status = 'failed' WHERE id = $1", [registration.id]);
            }
        }
    }

    static async verifyTransaction(txHash, chain, userWalletAddress) {
        try {
            if (chain === 'TRON') {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to allow transaction propagation
                const txInfo = await tronWeb.trx.getTransactionInfo(txHash);

                if (!txInfo || !txInfo.log) return false;

                const transferEvent = txInfo.log.find(log => {
                    const decoded = tronWeb.coder.decodeEvent(USDT_ABI, log.data);
                    return decoded && decoded.name === 'Transfer' &&
                           tronWeb.address.fromHex(decoded.result.to) === PLATFORM_WALLET_ADDRESS.TRON &&
                           tronWeb.address.fromHex(decoded.result.from) === userWalletAddress;
                });

                if (!transferEvent) return false;

                const decoded = tronWeb.coder.decodeEvent(USDT_ABI, transferEvent.data);
                const amount = parseFloat(tronWeb.fromSun(decoded.result.value));

                return amount >= SIGNUP_FEE_USDT;

            } else if (chain === 'BSC') {
                const receipt = await bscProvider.getTransactionReceipt(txHash);
                if (!receipt || receipt.status !== 1) return false;

                const usdtInterface = new ethers.Interface(USDT_ABI);
                const transferLog = receipt.logs.find(log => log.address.toLowerCase() === USDT_ADDRESSES.BSC.toLowerCase());

                if (!transferLog) return false;

                const decodedLog = usdtInterface.parseLog(transferLog);

                const from = decodedLog.args.from;
                const to = decodedLog.args.to;
                const value = decodedLog.args.value;

                if (from.toLowerCase() !== userWalletAddress.toLowerCase() || to.toLowerCase() !== PLATFORM_WALLET_ADDRESS.BSC.toLowerCase()) {
                    return false;
                }

                const usdtContract = new ethers.Contract(USDT_ADDRESSES.BSC, USDT_ABI, bscProvider);
                const decimals = await usdtContract.decimals();
                const amount = parseFloat(ethers.formatUnits(value, decimals));

                return amount >= SIGNUP_FEE_USDT;
            }
            return false;
        } catch (error) {
            console.error(`Error verifying transaction ${txHash} on ${chain}:`, error);
            return false;
        }
    }
}

module.exports = TransactionVerifierService;
