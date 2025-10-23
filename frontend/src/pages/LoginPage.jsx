import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
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
      if (result.user.role === 'instructor') {
        navigate('/instructor/analytics');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-md)'
    }}>
      <div className="fade-in" style={{ maxWidth: '500px', width: '100%' }}>
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
            Welcome Back
          </h1>
          <p style={{ 
            color: 'var(--text-muted)',
            fontSize: 'var(--text-lg)',
            lineHeight: '1.6'
          }}>
            Sign in to access your account
          </p>
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

          <div style={{ marginBottom: 'var(--space-xl)' }}>
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
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        {/* Footer Notes */}
        <div style={{ 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)'
        }}>
          <p style={{ 
            fontSize: 'var(--text-sm)', 
            color: 'var(--text-dimmed)',
            lineHeight: '1.6'
          }}>
            Instructor? Use your admin credentials to login
          </p>
          <p style={{ 
            fontSize: 'var(--text-sm)', 
            color: 'var(--text-dimmed)',
            lineHeight: '1.6'
          }}>
            Members can only join via referral link from existing members
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
