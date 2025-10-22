import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { systemAPI } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';

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

  const containerStyles = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem'
  };

  if (systemStatus && !systemStatus.isActive) {
    return (
      <div style={containerStyles}>
        <Card style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
          <h2>Simulation Paused</h2>
          <p style={{ color: '#a0aec0', marginTop: '1rem' }}>
            Registration is currently disabled. The instructor has paused the simulation.
          </p>
        </Card>
      </div>
    );
  }

  if (systemStatus && systemStatus.spotsRemaining === 0) {
    return (
      <div style={containerStyles}>
        <Card style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
          <h2>Simulation Full</h2>
          <p style={{ color: '#a0aec0', marginTop: '1rem' }}>
            The maximum number of participants ({systemStatus.maxParticipants}) has been reached.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <Card style={{ maxWidth: '500px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Join Atlas Network</h1>
          <p style={{ color: '#a0aec0' }}>Start your journey to financial freedom</p>
          {systemStatus && (
            <p style={{ color: '#fbbf24', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {systemStatus.spotsRemaining} spots remaining
            </p>
          )}
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#ef4444',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            type="email"
            name="email"
            label="Email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            required
          />

          <Input
            type="text"
            name="username"
            label="Username"
            value={formData.username}
            onChange={handleChange}
            placeholder="johndoe"
            required
          />

          <Input
            type="password"
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          <Input
            type="password"
            name="confirmPassword"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          <Input
            type="text"
            name="referralCode"
            label="Referral Code (Optional)"
            value={formData.referralCode}
            onChange={handleChange}
            placeholder="NXG-ABC123"
          />

          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            fullWidth
            style={{ marginTop: '1rem' }}
          >
            Create Account
          </Button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', color: '#a0aec0' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#fbbf24', fontWeight: '600' }}>
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
