import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowLeft, AlertCircle, CheckCircle, Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/base/Button'
import Input from '../components/base/Input'
import { ethers } from 'ethers'
import api from '../services/api'
import { useAppKit } from '@reown/appkit/react'

const RegisterPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { web3Register } = useAuth()
  const { open } = useAppKit()

  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')

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

  const handleWeb3Register = async () => {
    try {
      setLoading(true)
      await open()
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const walletAddress = await signer.getAddress()
      const referralCode = searchParams.get('ref')

      const challengeResponse = await api.get(`/auth/web3/challenge?walletAddress=${walletAddress}`)
      const { challenge } = challengeResponse.data

      const signature = await signer.signMessage(challenge)

      const registerResult = await web3Register({ walletAddress, signature, referralCode })

      if (registerResult.success) {
        navigate('/dashboard')
      } else {
        setGeneralError(registerResult.error)
        setLoading(false)
      }
    } catch (error) {
      setGeneralError('Wallet registration failed. Please try again.')
      setLoading(false)
    }
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

          {/* Web3 Register Button */}
          <Button
            fullWidth
            size="lg"
            variant="primary"
            onClick={handleWeb3Register}
            disabled={loading}
            icon={<Wallet className="w-5 h-5" />}
          >
            Sign Up with Wallet
          </Button>

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
