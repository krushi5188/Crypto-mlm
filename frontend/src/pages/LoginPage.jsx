import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, Sparkles, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import { pageVariants, pageTransition, fadeInUp, scaleIn } from '../utils/animations';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData);

    if (result.success) {
      showSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        if (result.user.role === 'instructor') {
          navigate('/instructor/analytics');
        } else {
          navigate('/dashboard');
        }
      }, 500);
    } else if (result.redirecting) {
      return;
    } else {
      setError(result.error);
      showError(result.error || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="min-h-screen flex items-center justify-center py-12 px-4 bg-black"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to Home Button */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white hover:text-gold-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              variants={scaleIn}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-gold-400 mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Atlas Network
            </motion.div>

            <h1 className="text-5xl font-display font-bold mb-3 tracking-tight text-white">
              Welcome Back
            </h1>
            <p className="text-lg text-gray-400">
              Sign in to access your account
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Error Message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="email"
                name="email"
                label="Email Address"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                icon={<Mail className="w-5 h-5" />}
                required
                clearable
              />

              <Input
                type="password"
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                icon={<Lock className="w-5 h-5" />}
                required
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-600 bg-zinc-800 text-gold-400 focus:ring-2 focus:ring-gold-400/20"
                  />
                  <span className="text-gray-300">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-gold-400 hover:text-gold-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                fullWidth
                size="lg"
                variant="primary"
                iconRight={<ArrowRight className="w-5 h-5" />}
              >
                Sign In
              </Button>
            </form>

            {/* Invite-Only Notice */}
            <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-gray-400 text-center">
                <span className="text-gold-400 font-medium">Atlas Network is invite-only.</span>
                <br />
                New members can only join through a referral link.
              </p>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              By signing in, you agree to our{' '}
              <Link to="/terms" className="text-gold-400 hover:text-gold-300 transition-colors">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-gold-400 hover:text-gold-300 transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoginPage;
