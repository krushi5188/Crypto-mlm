import React, { useState, useEffect } from 'react';
import { instructorAPI, systemAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const InstructorControls = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Inject Coins State
  const [injectUserId, setInjectUserId] = useState('');
  const [injectAmount, setInjectAmount] = useState('');
  const [injectNote, setInjectNote] = useState('');

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    try {
      const response = await systemAPI.getStatus();
      setSystemStatus(response.data.data);
    } catch (error) {
      console.error('Failed to load system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (!confirm('Pause the system? Members will not be able to register or earn commissions.')) {
      return;
    }

    setProcessing(true);
    try {
      await instructorAPI.pause();
      await loadSystemStatus();
      alert('System paused successfully');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to pause system');
    } finally {
      setProcessing(false);
    }
  };

  const handleResume = async () => {
    if (!confirm('Resume the system?')) {
      return;
    }

    setProcessing(true);
    try {
      await instructorAPI.resume();
      await loadSystemStatus();
      alert('System resumed successfully');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to resume system');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = async (type) => {
    const confirmMsg = type === 'full'
      ? 'FULL RESET: This will delete ALL member data, transactions, and reset balances. This action CANNOT be undone!'
      : 'SOFT RESET: This will reset all balances to zero but keep user accounts. Continue?';

    if (!confirm(confirmMsg)) {
      return;
    }

    if (type === 'full' && !confirm('Are you ABSOLUTELY SURE? All member data will be permanently deleted!')) {
      return;
    }

    setProcessing(true);
    try {
      await instructorAPI.reset({ type, confirm: true });
      await loadSystemStatus();
      alert(`${type === 'full' ? 'Full' : 'Soft'} reset completed successfully`);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to reset system');
    } finally {
      setProcessing(false);
    }
  };

  const handleInjectCoins = async (e) => {
    e.preventDefault();

    if (!injectUserId || !injectAmount) {
      alert('Please provide user ID and amount');
      return;
    }

    setProcessing(true);
    try {
      await instructorAPI.injectCoins({
        userId: parseInt(injectUserId),
        amount: parseFloat(injectAmount),
        note: injectNote
      });
      alert(`Successfully injected ${injectAmount} NC to user ${injectUserId}`);
      setInjectUserId('');
      setInjectAmount('');
      setInjectNote('');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to inject coins');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Loading controls...</p>
      </div>
    );
  }

  const containerStyles = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem'
  };

  const isActive = systemStatus?.simulationStatus === 'active';

  return (
    <div style={containerStyles}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>System Controls</h1>
        <p style={{ color: '#a0aec0' }}>Manage platform state and resources</p>
      </div>

      {/* Current Status */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Current Status</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              padding: '1rem 2rem',
              borderRadius: '8px',
              background: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: isActive ? '2px solid #10b981' : '2px solid #ef4444'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                {isActive ? '▶️' : '⏸️'}
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: isActive ? '#10b981' : '#ef4444'
              }}>
                {systemStatus?.simulationStatus || 'Unknown'}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#a0aec0', marginBottom: '0.5rem' }}>
                {isActive
                  ? 'System is running. Members can register and earn commissions.'
                  : 'System is paused. No new registrations or commission distributions.'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Pause/Resume Controls */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Platform State</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button
              onClick={handlePause}
              disabled={!isActive || processing}
              style={{
                background: !isActive ? 'rgba(255, 255, 255, 0.1)' : '#ef4444',
                cursor: !isActive || processing ? 'not-allowed' : 'pointer',
                opacity: !isActive || processing ? 0.5 : 1
              }}
            >
              ⏸️ Pause System
            </Button>
            <Button
              onClick={handleResume}
              disabled={isActive || processing}
              style={{
                background: isActive ? 'rgba(255, 255, 255, 0.1)' : '#10b981',
                cursor: isActive || processing ? 'not-allowed' : 'pointer',
                opacity: isActive || processing ? 0.5 : 1
              }}
            >
              ▶️ Resume System
            </Button>
          </div>
        </div>
      </Card>

      {/* Inject Coins */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>💰 Add NexusCoins</h3>
          <p style={{ color: '#a0aec0', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Manually add coins to a member's balance for adjustments
          </p>
          <form onSubmit={handleInjectCoins}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <Input
                type="number"
                label="User ID"
                value={injectUserId}
                onChange={(e) => setInjectUserId(e.target.value)}
                placeholder="e.g., 5"
                required
              />
              <Input
                type="number"
                step="0.01"
                label="Amount (NC)"
                value={injectAmount}
                onChange={(e) => setInjectAmount(e.target.value)}
                placeholder="e.g., 100.00"
                required
              />
            </div>
            <Input
              type="text"
              label="Note (optional)"
              value={injectNote}
              onChange={(e) => setInjectNote(e.target.value)}
              placeholder="Reason for injection..."
              style={{ marginBottom: '1rem' }}
            />
            <Button type="submit" disabled={processing}>
              💉 Add Coins
            </Button>
          </form>
        </div>
      </Card>

      {/* Reset Controls */}
      <Card style={{ border: '2px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)' }}>
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#ef4444' }}>⚠️ Danger Zone</h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Soft Reset</h4>
            <p style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Reset all balances to zero but keep user accounts and network structure intact.
            </p>
            <Button
              onClick={() => handleReset('soft')}
              disabled={processing}
              style={{ background: '#f59e0b' }}
            >
              🔄 Soft Reset
            </Button>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Full Reset</h4>
            <p style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Delete ALL member data, transactions, referrals, and balances. This CANNOT be undone!
            </p>
            <Button
              onClick={() => handleReset('full')}
              disabled={processing}
              style={{ background: '#ef4444' }}
            >
              🗑️ Full Reset (Destructive)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InstructorControls;
