import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { systemAPI } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

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
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch system status
    systemAPI.getStatus().then(res => {
      setSystemStatus(res.data.data);
    }).catch(err => {
      console.error('Failed to load system status:', err);
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  if (systemStatus && !systemStatus.isActive) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-md)'
      }}>
        <div className="fade-in" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: 'var(--space-lg)' }}>⏸️</div>
          <h2 style={{ 
            fontSize: 'var(--text-4xl)', 
            marginBottom: 'var(--space-md)',
            fontWeight: '600'
          }}>
            Registrations Paused
          </h2>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: 'var(--text-lg)',
            lineHeight: '1.6'
          }}>
            Registration is currently disabled. The platform is temporarily paused.
          </p>
        </div>
      </div>
    );
  }

  if (systemStatus && systemStatus.spotsRemaining === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-md)'
      }}>
        <div className="fade-in" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: 'var(--space-lg)' }}>🚫</div>
          <h2 style={{ 
            fontSize: 'var(--text-4xl)', 
            marginBottom: 'var(--space-md)',
            fontWeight: '600'
          }}>
            Registrations Full
          </h2>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: 'var(--text-lg)',
            lineHeight: '1.6'
          }}>
            The maximum number of participants ({systemStatus.maxParticipants}) has been reached.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-md)'
    }}>
      <div className="fade-in" style={{ maxWidth: '600px', width: '100%' }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 'var(--space-3xl)'
        }}>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', 
            marginBottom: 'var(--space-md)',
            fontWeight: '700',
            letterSpacing: '-0.02em'
          }}>
            Join Atlas Network
          </h1>
          <p style={{ 
            color: 'var(--text-muted)',
            fontSize: 'var(--text-lg)',
            lineHeight: '1.6'
          }}>
            Start your journey to financial freedom
          </p>
          {systemStatus && systemStatus.spotsRemaining && (
            <p style={{ 
              color: 'var(--primary-gold)', 
              fontSize: 'var(--text-base)', 
              marginTop: 'var(--space-md)',
              fontWeight: '600'
            }}>
              {systemStatus.spotsRemaining} spots remaining
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-lg)',
            marginBottom: 'var(--space-xl)',
            color: '#ef4444',
            textAlign: 'center',
            fontSize: 'var(--text-base)'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <Input
              type="email"
              name="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>

          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <Input
              type="text"
              name="username"
              label="Username"
              value={formData.username}
              onChange={handleChange}
              placeholder="johndoe"
              required
            />
          </div>

          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <Input
              type="password"
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <Input
              type="password"
              name="confirmPassword"
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <Input
              type="text"
              name="referralCode"
              label="Referral Code (Optional)"
              value={formData.referralCode}
              onChange={handleChange}
              placeholder="ATN-ABC123"
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            fullWidth
            size="lg"
            style={{
              padding: 'var(--space-md) var(--space-lg)',
              fontSize: 'var(--text-lg)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        {/* Footer Link */}
        <div style={{ 
          textAlign: 'center',
          fontSize: 'var(--text-base)',
          color: 'var(--text-muted)'
        }}>
          Already have an account?{' '}
          <Link 
            to="/login" 
            style={{ 
              color: 'var(--primary-gold)', 
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'color var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--primary-gold-dark)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--primary-gold)'}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
