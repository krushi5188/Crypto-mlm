
import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, User, ArrowLeft, AlertCircle, CheckCircle, Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/base/Button'
import Input from '../components/base/Input'
import { useAppKit, useAppKitProvider } from '@reown/appkit/react'
import { ethers } from 'ethers'
import TronWeb from 'tronweb'
import api from '../services/api'
import { USDT_ADDRESSES, PLATFORM_WALLET_ADDRESS, SIGNUP_FEE_USDT, USDT_ABI } from '../config/constants'


const RegisterPage = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { web3Login } = useAuth()
    const { open } = useAppKit()
    const { walletProvider } = useAppKitProvider("eip155");


    const [formData, setFormData] = useState({
        walletAddress: '',
        referralCode: searchParams.get('ref') || '',
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [generalError, setGeneralError] = useState('')
    const [signer, setSigner] = useState(null)
    const [isPending, setIsPending] = useState(false)
    const [chain, setChain] = useState('BSC') // Default to BSC

    // Redirect if no referral code
    useEffect(() => {
        const ref = searchParams.get('ref')
        if (!ref) {
            setGeneralError('Registration requires an invitation. Please use a referral link.')
            setTimeout(() => {
                navigate('/')
            }, 3000)
        }
    }, [searchParams, navigate])

    useEffect(() => {
        const interval = setInterval(() => {
            if (chain === 'TRON' && window.tronWeb && window.tronWeb.ready) {
                setFormData(prev => ({ ...prev, walletAddress: window.tronWeb.defaultAddress.base58 }));
            }
        }, 500);
        return () => clearInterval(interval);
    }, [chain]);

    const handleConnectWallet = async () => {
        try {
            await open();
            if (!walletProvider) {
                throw new Error("Wallet provider not available.");
            }
            const provider = new ethers.BrowserProvider(walletProvider);
            const signer = await provider.getSigner();
            const walletAddress = await signer.getAddress();
            setSigner(signer);
            setFormData(prev => ({ ...prev, walletAddress }));
        } catch (error) {
            setGeneralError('Failed to connect wallet. Please try again.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!signer && chain === 'BSC') {
            setGeneralError('Please connect your wallet first.');
            return;
        }
        if (!window.tronWeb && chain === 'TRON') {
            setGeneralError('Please connect your Tron wallet (e.g., TronLink).');
            return;
        }

        setLoading(true);
        setGeneralError('');

        try {
            let tx;
            let walletAddr = formData.walletAddress;

            if (chain === 'BSC') {
                const usdtContract = new ethers.Contract(USDT_ADDRESSES.BSC, USDT_ABI, signer);
                const decimals = await usdtContract.decimals();
                const amount = ethers.parseUnits(SIGNUP_FEE_USDT.toString(), decimals);
                tx = await usdtContract.transfer(PLATFORM_WALLET_ADDRESS.BSC, amount);
            } else if (chain === 'TRON') {
                if (!window.tronWeb || !window.tronWeb.ready) {
                    throw new Error('TronLink is not connected or not ready.');
                }
                const tronWeb = window.tronWeb;
                walletAddr = tronWeb.defaultAddress.base58;
                const usdtContract = await tronWeb.contract().at(USDT_ADDRESSES.TRON);
                const decimals = await usdtContract.decimals().call();
                const amount = SIGNUP_FEE_USDT * (10 ** decimals);
                const txHash = await usdtContract.transfer(PLATFORM_WALLET_ADDRESS.TRON, amount).send({
                    feeLimit: 100000000
                });
                tx = { hash: txHash }; // Adapt to expected structure
            }

            // 2. Submit registration
            await api.post('/auth/web3/submit-registration', {
                walletAddress: walletAddr,
                referralCode: formData.referralCode,
                transactionHash: tx.hash,
                chain: chain,
            });

            setIsPending(true); // Show pending message

            // 3. Poll for status
            const interval = setInterval(async () => {
                try {
                    const statusResponse = await api.get(`/auth/web3/registration-status?walletAddress=${walletAddr}`);
                    if (statusResponse.data.status === 'verified') {
                        clearInterval(interval);
                        const { token } = statusResponse.data;
                        const loginResult = await web3Login({ token });
                        if (loginResult.success) {
                            navigate('/dashboard');
                        } else {
                            setGeneralError(loginResult.error);
                            setIsPending(false);
                            setLoading(false);
                        }
                    } else if (statusResponse.data.status === 'failed') {
                        clearInterval(interval);
                        setGeneralError('Payment verification failed. Please try again.');
                        setIsPending(false);
                        setLoading(false);
                    }
                } catch (error) {
                    clearInterval(interval);
                    setGeneralError('An error occurred while checking your registration status.');
                    setIsPending(false);
                    setLoading(false);
                }
            }, 5000);

        } catch (error) {
            console.error(error);
            const errorMessage = error.message || (error.response?.data?.error) || 'An error occurred during signup. Please try again.';
            setGeneralError(errorMessage);
            setLoading(false);
        }
    };


  // Show pending approval message
  if (isPending) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center"
        >
            <div className="w-16 h-16 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">
            Registration Submitted
            </h1>
            <p className="text-gray-400 mb-6">
            Your account is now pending approval from an admin. Please check back later.
            </p>
            <Button onClick={() => navigate('/')}>
            Back to Home
            </Button>
        </motion.div>
        </div>
    )
    }

  // Show error if no referral code
  if (!searchParams.get('ref')) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Invitation Required
          </h1>
          <p className="text-gray-400 mb-6">
            Atlas Network is invitation-only. Please use a referral link from an existing member.
          </p>
          <Button onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </motion.div>

        {/* Register Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white bg-opacity-5 backdrop-blur-sm border border-white border-opacity-10 rounded-2xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-black font-bold text-2xl">A</span>
            </div>
            <h1 className="text-4xl font-display font-bold text-white mb-2">
              Join Atlas Network
            </h1>
            <p className="text-gray-400">
              Create your account and start building your network
            </p>
          </div>

          {/* Invitation Badge */}
          <div className="mb-6 p-4 rounded-xl bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-400">You've been invited!</p>
              <p className="text-xs text-gray-400 mt-1">Referral code verified</p>
            </div>
          </div>

          {/* General Error */}
          {generalError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{generalError}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {formData.walletAddress ? (
              <Input
                label="Wallet Address"
                type="text"
                name="walletAddress"
                value={formData.walletAddress}
                readOnly
                disabled
                icon={<Wallet className="w-5 h-5" />}
              />
            ) : (
              <Button
                type="button"
                fullWidth
                size="lg"
                variant="secondary"
                onClick={handleConnectWallet}
                icon={<Wallet className="w-5 h-5" />}
                disabled={chain === 'TRON'}
              >
                {chain === 'TRON' ? 'Use TronLink Wallet' : 'Connect Wallet'}
              </Button>
            )}

            <Input
              label="Referral Code"
              type="text"
              name="referralCode"
              value={formData.referralCode}
              required
              disabled
            />

            <div className="flex gap-4">
                <Button type="button" onClick={() => setChain('TRON')} variant={chain === 'TRON' ? 'primary' : 'secondary'} fullWidth>TRON</Button>
                <Button type="button" onClick={() => setChain('BSC')} variant={chain === 'BSC' ? 'primary' : 'secondary'} fullWidth>BSC</Button>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              disabled={loading || !signer}
            >
              Create Account and Pay Fee
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-white hover:text-gray-300 transition-colors font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 text-center text-sm text-gray-400"
        >
          <p>
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-white hover:text-gray-300 transition-colors">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-white hover:text-gray-300 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default RegisterPage
