import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowLeft, AlertCircle, Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/base/Button'
import Input from '../components/base/Input'
import { ethers } from 'ethers'
import api from '../services/api'
import { useAppKit, useAppKitProvider } from '@reown/appkit/react'


const LoginPage = () => {
  const navigate = useNavigate()
  const { login, web3Login } = useAuth()
  const { open } = useAppKit()
  const { walletProvider } = useAppKitProvider("eip155");

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [adminLoginVisible, setAdminLoginVisible] = useState(false)
  const [logoClicks, setLogoClicks] = useState(0)


  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);
    if (newClicks >= 5) {
      setAdminLoginVisible(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (generalError) {
      setGeneralError('')
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setGeneralError('')

    const result = await login(formData)

    if (result.success) {
      // Redirect based on user role
      if (result.user.role === 'instructor') {
        navigate('/admin/analytics')
      } else {
        navigate('/dashboard')
      }
    } else {
      setGeneralError(result.error)
      setLoading(false)
    }
  }

  const handleWeb3Login = async () => {
    try {
      setLoading(true);
      await open();
      if (!walletProvider) {
        throw new Error("Wallet provider not available.");
      }
      const provider = new ethers.BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      // 1. Get challenge
      const challengeResponse = await api.get(`/auth/web3/challenge?walletAddress=${walletAddress}`);
      const { challenge } = challengeResponse.data;

      // 2. Sign challenge
      const signature = await signer.signMessage(challenge);

      // 3. Login
      const loginResult = await web3Login({ walletAddress, signature });

      if (loginResult.success) {
        if (loginResult.user.role === 'instructor') {
          navigate('/admin/analytics');
        } else {
          navigate('/dashboard');
        }
      } else {
        setGeneralError(loginResult.error);
        setLoading(false);
      }
    } catch (error) {
      setGeneralError('Wallet login failed. Please try again.');
      setLoading(false);
    }
  };

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

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white bg-opacity-5 backdrop-blur-sm border border-white border-opacity-10 rounded-2xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 cursor-pointer"
              onClick={handleLogoClick}
            >
              <span className="text-black font-bold text-2xl">A</span>
            </div>
            <h1 className="text-4xl font-display font-bold text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-400">
              Sign in to access your account
            </p>
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

          {/* Web3 Login Button */}
          <Button
            fullWidth
            size="lg"
            variant="primary"
            onClick={handleWeb3Login}
            disabled={loading}
            icon={<Wallet className="w-5 h-5" />}
          >
            Sign In with Wallet
          </Button>

          {/* Admin Login Form (Hidden) */}
          {adminLoginVisible && (
            <>
              {/* Divider */}
              <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-white border-opacity-10"></div>
                <span className="mx-4 text-xs text-gray-400">Admin Login</span>
                <div className="flex-grow border-t border-white border-opacity-10"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                  icon={<Mail className="w-5 h-5" />}
                />

                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  required
                  icon={<Lock className="w-5 h-5" />}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  variant="secondary"
                  loading={loading}
                  disabled={loading}
                >
                  Admin Sign In
                </Button>
              </form>
            </>
          )}

          {/* Invitation Notice */}
          <div className="mt-8 p-4 rounded-xl bg-white bg-opacity-5 border border-white border-opacity-10">
            <p className="text-sm text-gray-400 text-center">
              <span className="text-white font-medium">Atlas Network is invitation-only.</span>
              <br />
              New members can only join through a referral link.
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
            By signing in, you agree to our{' '}
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

export default LoginPage
