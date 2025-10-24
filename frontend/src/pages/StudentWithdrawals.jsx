import React, { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const StudentWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Form state
  const [amount, setAmount] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [notes, setNotes] = useState('');
  const [feeInfo, setFeeInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      calculateFee(parseFloat(amount));
    } else {
      setFeeInfo(null);
    }
  }, [amount]);

  const loadData = async () => {
    try {
      const [withdrawalsRes, statsRes, walletsRes] = await Promise.all([
        studentAPI.getWithdrawals(),
        studentAPI.getWithdrawalStats(),
        studentAPI.getWallets()
      ]);

      setWithdrawals(withdrawalsRes.data.data.withdrawals || []);
      setStats(statsRes.data.data);
      setWallets(walletsRes.data.data.wallets || []);

      const primary = walletsRes.data.data.wallets.find(w => w.is_primary);
      if (primary) {
        setSelectedWallet(primary.id);
      }
    } catch (error) {
      console.error('Failed to load withdrawal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFee = (withdrawAmount) => {
    const percentageFee = withdrawAmount * 0.02;
    const totalFee = percentageFee + 1;
    const netAmount = withdrawAmount - totalFee;

    setFeeInfo({
      fee: totalFee.toFixed(2),
      netAmount: netAmount.toFixed(2)
    });
  };

  const handleSubmitWithdrawal = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const withdrawAmount = parseFloat(amount);

      if (withdrawAmount < 10) {
        setError('Minimum withdrawal amount is $10 USDT');
        setSubmitting(false);
        return;
      }

      if (!selectedWallet) {
        setError('Please select a wallet address');
        setSubmitting(false);
        return;
      }

      const wallet = wallets.find(w => w.id === parseInt(selectedWallet));

      await studentAPI.createWithdrawal({
        amount: withdrawAmount,
        wallet_id: parseInt(selectedWallet),
        wallet_address: wallet.address,
        network: wallet.network,
        notes: notes || null
      });

      setAmount('');
      setNotes('');
      setShowRequestForm(false);
      setFeeInfo(null);
      await loadData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelWithdrawal = async (withdrawalId) => {
    if (!confirm('Are you sure you want to cancel this withdrawal request?')) {
      return;
    }

    try {
      await studentAPI.cancelWithdrawal(withdrawalId);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to cancel withdrawal');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending': return '#fbbf24';
      case 'approved': return '#3b82f6';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Loading withdrawals...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Withdrawals</h1>
        <p style={{ color: '#a0aec0' }}>Manage your withdrawal requests</p>
      </div>

      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <Card><div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem' }}>Total Withdrawn</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
              ${formatCurrency(stats.total_withdrawn)} USDT
            </div>
          </div></Card>
          <Card><div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem' }}>Pending</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fbbf24' }}>
              ${formatCurrency(stats.pending_amount)} USDT
            </div>
          </div></Card>
        </div>
      )}

      {!showRequestForm && (
        <Button onClick={() => setShowRequestForm(true)} size="lg" fullWidth style={{ marginBottom: '2rem' }}>
          💰 Request Withdrawal
        </Button>
      )}

      {showRequestForm && (
        <Card style={{ marginBottom: '2rem' }}>
          <div style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Request Withdrawal</h3>
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmitWithdrawal}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Amount (USDT)</label>
                <input type="number" step="0.01" min="10" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Minimum: $10 USDT" required style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'var(--text-primary)' }} />
              </div>
              {feeInfo && (
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Amount:</span><span style={{ fontWeight: '600' }}>${amount} USDT</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#a0aec0' }}>
                    <span>Fee (2% + $1):</span><span>-${feeInfo.fee} USDT</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '1.125rem', fontWeight: '700', color: '#10b981' }}>
                    <span>You'll Receive:</span><span>${feeInfo.netAmount} USDT</span>
                  </div>
                </div>
              )}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Wallet</label>
                <select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)} required style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                  <option value="">Select a wallet</option>
                  {wallets.map(wallet => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.label} - {wallet.address.substring(0, 10)}...{wallet.address.slice(-6)} ({wallet.network})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button type="submit" disabled={submitting || wallets.length === 0} fullWidth>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowRequestForm(false); setAmount(''); setError(''); setFeeInfo(null); }} fullWidth>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <Card>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h3 style={{ fontSize: '1.25rem' }}>Withdrawal History</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Net</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#a0aec0' }}>No withdrawal requests yet</td></tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <td style={{ padding: '1rem' }}>{formatDateTime(w.created_at)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>${formatCurrency(w.amount)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '700', color: '#10b981' }}>${formatCurrency(w.net_amount)}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.875rem', fontWeight: '600', background: `${getStatusColor(w.status)}20`, color: getStatusColor(w.status) }}>
                        {w.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {w.status === 'pending' && (
                        <button onClick={() => handleCancelWithdrawal(w.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default StudentWithdrawals;
