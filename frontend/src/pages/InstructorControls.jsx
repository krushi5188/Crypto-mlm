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

  // Success/Error Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [injectError, setInjectError] = useState('');
  const [injectSuccess, setInjectSuccess] = useState('');

  // Confirmation Modal State
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');
  const [isDestructive, setIsDestructive] = useState(false);

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

  const showConfirmDialog = (title, message, action, destructive = false) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setIsDestructive(destructive);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirm(false);
  };

  const handlePause = async () => {
    showConfirmDialog(
      'Pause System',
      'Members will not be able to register or earn commissions while the system is paused.',
      async () => {
        setProcessing(true);
        try {
          await instructorAPI.pause();
          await loadSystemStatus();
          setSuccessMsg('✓ System paused successfully');
          setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
          setErrorMsg(error.response?.data?.error || 'Failed to pause system');
          setTimeout(() => setErrorMsg(''), 5000);
        } finally {
          setProcessing(false);
        }
      }
    );
  };

  const handleResume = async () => {
    showConfirmDialog(
      'Resume System',
      'Members will be able to register and earn commissions again.',
      async () => {
        setProcessing(true);
        try {
          await instructorAPI.resume();
          await loadSystemStatus();
          setSuccessMsg('✓ System resumed successfully');
          setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
          setErrorMsg(error.response?.data?.error || 'Failed to resume system');
          setTimeout(() => setErrorMsg(''), 5000);
        } finally {
          setProcessing(false);
        }
      }
    );
  };

  const handleReset = async (type) => {
    const message = type === 'full'
      ? 'This will DELETE ALL member data, transactions, and balances permanently. This action CANNOT be undone!'
      : 'This will reset all balances to zero but keep user accounts and network structure.';

    showConfirmDialog(
      type === 'full' ? 'Full Reset - PERMANENT' : 'Soft Reset',
      message,
      async () => {
        setProcessing(true);
        try {
          await instructorAPI.reset({ type, confirm: true });
          await loadSystemStatus();
          setSuccessMsg(`✓ ${type === 'full' ? 'Full' : 'Soft'} reset completed successfully`);
          setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
          setErrorMsg(error.response?.data?.error || 'Failed to reset system');
          setTimeout(() => setErrorMsg(''), 5000);
        } finally {
          setProcessing(false);
        }
      },
      type === 'full' // Mark full reset as destructive
    );
  };

  const handleInjectCoins = async (e) => {
    e.preventDefault();

    if (!injectUserId || !injectAmount) {
      setInjectError('Please provide user ID and amount');
      setTimeout(() => setInjectError(''), 5000);
      return;
    }

    setProcessing(true);
    setInjectError('');
    setInjectSuccess('');
    
    try {
      await instructorAPI.injectCoins({
        userId: parseInt(injectUserId),
        amount: parseFloat(injectAmount),
        note: injectNote
      });
      setInjectSuccess(`✓ Successfully injected ${injectAmount} USDT to user ${injectUserId}`);
      setTimeout(() => setInjectSuccess(''), 5000);
      setInjectUserId('');
      setInjectAmount('');
      setInjectNote('');
    } catch (error) {
      setInjectError(error.response?.data?.error || 'Failed to inject coins');
      setTimeout(() => setInjectError(''), 5000);
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
      {/* Confirmation Modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-xl)',
            maxWidth: '500px',
            width: '100%',
            border: `2px solid ${isDestructive ? '#ef4444' : 'var(--primary-gold)'}`,
            boxShadow: 'var(--shadow-2xl)'
          }}>
            <h3 style={{
              fontSize: 'var(--text-2xl)',
              marginBottom: 'var(--space-md)',
              color: isDestructive ? '#ef4444' : 'var(--text-primary)'
            }}>
              {confirmTitle}
            </h3>
            <p style={{
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-xl)',
              lineHeight: '1.6'
            }}>
              {confirmMessage}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => setShowConfirm(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                style={{
                  background: isDestructive ? '#ef4444' : 'var(--primary-gold)',
                  color: isDestructive ? '#fff' : 'var(--bg-primary)'
                }}
              >
                {isDestructive ? 'Yes, Delete Everything' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>System Controls</h1>
        <p style={{ color: '#a0aec0' }}>Manage platform state and resources</p>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          background: 'rgba(16, 185, 129, 0.2)',
          border: '1px solid #10b981',
          borderRadius: '8px',
          color: '#10b981',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          color: '#ef4444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>
      )}

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
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>💰 Add USDT</h3>
          <p style={{ color: '#a0aec0', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Manually add USDT to a member's balance for adjustments
          </p>

          {/* Inject Success */}
          {injectSuccess && (
            <div style={{
              marginBottom: '1rem',
              padding: '1rem',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid #10b981',
              borderRadius: '8px',
              color: '#10b981'
            }}>
              {injectSuccess}
            </div>
          )}

          {/* Inject Error */}
          {injectError && (
            <div style={{
              marginBottom: '1rem',
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              color: '#ef4444'
            }}>
              {injectError}
            </div>
          )}

          <form onSubmit={handleInjectCoins}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <Input
                type="number"
                label="User ID"
                value={injectUserId}
                onChange={(e) => {
                  setInjectUserId(e.target.value);
                  setInjectError('');
                }}
                placeholder="e.g., 5"
                required
              />
              <Input
                type="number"
                step="0.01"
                label="Amount (USDT)"
                value={injectAmount}
                onChange={(e) => {
                  setInjectAmount(e.target.value);
                  setInjectError('');
                }}
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
