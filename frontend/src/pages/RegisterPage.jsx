import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, Lock, Link2, ArrowRight, AlertCircle, Sparkles, CheckCircle, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { systemAPI } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { pageVariants, pageTransition, fadeInUp, scaleIn } from '../utils/animations';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    referralCode: searchParams.get('ref') || ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { register } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    systemAPI.getStatus().then(res => {
      setSystemStatus(res.data.data);
      setLoadingStatus(false);
    }).catch(err => {
      console.error('Failed to load system status:', err);
      setLoadingStatus(false);
    });
  }, []);

  useEffect(() => {
    const password = formData.password;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      showError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      showError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);

    if (result.success) {
      showSuccess('Account created successfully! Welcome to Atlas Network!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } else {
      setError(result.error);
      showError(result.error);
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-error';
    if (passwordStrength <= 3) return 'bg-warning';
    return 'bg-success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };

  if (loadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <Card variant="glass-strong" className="w-full max-w-md">
          <div className="space-y-4">
            <LoadingSkeleton variant="title" />
            <LoadingSkeleton variant="text" count={3} />
          </div>
        </Card>
      </div>
    );
  }

  if (systemStatus && !systemStatus.isActive) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen flex items-center justify-center py-12 px-4"
      >
        <motion.div variants={scaleIn} className="max-w-2xl w-full text-center">
          <Card variant="glass-strong" padding="xl">
            <div className="text-6xl mb-6">⏸️</div>
            <h2 className="text-4xl font-display font-bold mb-4">
              Registrations Paused
            </h2>
            <p className="text-lg text-text-muted mb-8">
              Registration is currently disabled. The platform is temporarily paused.
            </p>
            <Link to="/">
              <Button variant="outline" size="lg">
                Back to Home
              </Button>
            </Link>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  if (systemStatus && systemStatus.spotsRemaining === 0) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen flex items-center justify-center py-12 px-4"
      >
        <motion.div variants={scaleIn} className="max-w-2xl w-full text-center">
          <Card variant="glass-strong" padding="xl">
            <div className="text-6xl mb-6">🚫</div>
            <h2 className="text-4xl font-display font-bold mb-4">
              Registrations Full
            </h2>
            <p className="text-lg text-text-muted mb-8">
              The maximum number of participants ({systemStatus.maxParticipants}) has been reached.
            </p>
            <Link to="/">
              <Button variant="outline" size="lg">
                Back to Home
              </Button>
            </Link>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="min-h-screen flex items-center justify-center py-12 px-4"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              variants={scaleIn}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-glass-medium border border-glass-border text-sm font-medium text-gold-400 mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Join Atlas Network
            </motion.div>

            <h1 className="text-5xl font-display font-bold mb-3 tracking-tight">
              Start Your Journey
            </h1>
            <p className="text-lg text-text-muted mb-4">
              Create your account and begin earning
            </p>

            {/* Spots Remaining Counter */}
            {systemStatus && systemStatus.spotsRemaining > 0 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/10 border border-gold-400/30"
              >
                <Users className="w-4 h-4 text-gold-400" />
                <span className="text-sm font-semibold text-gold-400">
                  {systemStatus.spotsRemaining} spots remaining
                </span>
              </motion.div>
            )}
          </div>

          {/* Registration Card */}
          <Card variant="glass-strong" padding="xl">
            {/* Error Message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  type="text"
                  name="username"
                  label="Username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  icon={<User className="w-5 h-5" />}
                  required
                  clearable
                  maxLength={20}
                  helperText="3-20 characters"
                />
              </div>

              <Input
                type="password"
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                icon={<Lock className="w-5 h-5" />}
                required
                helperText={getPasswordStrengthText()}
              />

              {/* Password Strength Indicator */}
              {formData.password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i < passwordStrength ? getPasswordStrengthColor() : 'bg-glass-border'
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <Input
                type="password"
                name="confirmPassword"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                icon={<Lock className="w-5 h-5" />}
                required
                success={formData.confirmPassword && formData.password === formData.confirmPassword}
                error={formData.confirmPassword && formData.password !== formData.confirmPassword ? "Passwords don't match" : ""}
              />

              <Input
                type="text"
                name="referralCode"
                label="Referral Code (Optional)"
                value={formData.referralCode}
                onChange={handleChange}
                placeholder="ATN-ABC123"
                icon={<Link2 className="w-5 h-5" />}
                helperText="Enter your referrer's code if you have one"
                clearable
              />

              <div className="pt-4">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  fullWidth
                  size="lg"
                  variant="primary"
                  iconRight={<ArrowRight className="w-5 h-5" />}
                >
                  Create Account
                </Button>
              </div>
            </form>

            {/* Terms Agreement */}
            <div className="mt-6 text-center text-sm text-text-dimmed">
              <p>
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="text-gold-400 hover:text-gold-300 transition-colors">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-gold-400 hover:text-gold-300 transition-colors">
                  Privacy Policy
                </Link>
              </p>
            </div>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-glass-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-bg-elevated text-text-dimmed">
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <Link to="/login">
                <Button
                  variant="outline"
                  fullWidth
                  size="lg"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RegisterPage;
