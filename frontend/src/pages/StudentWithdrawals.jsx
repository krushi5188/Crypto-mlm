import React, { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const StudentWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    wallet_address: '',
    network: 'TRC20',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [withdrawalsRes, walletsRes, statsRes, profileRes] = await Promise.all([
        studentAPI.getWithdrawals(),
        studentAPI.getWallets(),
        studentAPI.getWithdrawalStats(),
        studentAPI.getProfile()
      ]);

      setWithdrawals(withdrawalsRes.data.data.withdrawals || []);
      setWallets(walletsRes.data.data.wallets || []);
      setStats(statsRes.data.data.stats);
      setUser(profileRes.data.data);
    } catch (error) {
      console.error('Failed to load withdrawal data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await studentAPI.createWithdrawal({
        amount: parseFloat(formData.amount),
        wallet_address: formData.wallet_address,
        network: formData.network,
        notes: formData.notes
      });

      setShowForm(false);
      setFormData({ amount: '', wallet_address: '', network: 'TRC20', notes: '' });
      await loadData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this withdrawal?')) return;

    try {
      await studentAPI.cancelWithdrawal(id);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to cancel withdrawal');
    }
  };

  const selectWallet = (wallet) => {
    setFormData(prev => ({
      ...prev,
      wallet_address: wallet.wallet_address,
      network: wallet.network
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'approved': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusBadge = (status) => (
    <span style={{
      padding: '0.25rem 0.75rem',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: '700',
      background: `${getStatusColor(status)}33`,
      color: getStatusColor(status),
      textTransform: 'uppercase'
    }}>
      {status}
    </span>
  );

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
        <p style={{ color: '#a0aec0' }}>Request and manage your USDT withdrawals</p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem' }}>
            Available Balance
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
            {formatCurrency(user?.balance || 0)} USDT
          </div>
        </Card>

        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem' }}>
            Total Withdrawn
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
            {formatCurrency(stats?.total_withdrawn || 0)} USDT
          </div>
        </Card>

        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem' }}>
            Pending Amount
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
            {formatCurrency(stats?.pending_amount || 0)} USDT
          </div>
        </Card>
      </div>

      {/* Create Withdrawal Button */}
      {!showForm && (
        <div style={{ marginBottom: '2rem' }}>
          <Button onClick={() => setShowForm(true)} size="lg">
            + Request Withdrawal
          </Button>
        </div>
      )}

      {/* Withdrawal Form */}
      {showForm && (
        <Card style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Request Withdrawal</h3>

          {error && (
            <div style={{
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              marginBottom: '1rem',
              color: '#ef4444'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Amount (USDT)
              </label>
              <input
                type="number"
                step="0.01"
                min="10"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Minimum: 10 USDT"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              />
              <p style={{ fontSize: '0.875rem', color: '#a0aec0', marginTop: '0.5rem' }}>
                Fee: 2% + 1 USDT | You'll receive: {formData.amount ? formatCurrency(parseFloat(formData.amount) * 0.98 - 1) : '0.00'} USDT
              </p>
            </div>

            {wallets.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Select Saved Wallet
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {wallets.map(wallet => (
                    <div
                      key={wallet.id}
                      onClick={() => selectWallet(wallet)}
                      style={{
                        padding: '0.75rem',
                        background: formData.wallet_address === wallet.wallet_address
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${formData.wallet_address === wallet.wallet_address ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                        {wallet.label || wallet.wallet_type} ({wallet.network})
                        {wallet.is_primary && <span style={{ marginLeft: '0.5rem', color: '#10b981' }}>⭐ Primary</span>}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#a0aec0', fontFamily: 'monospace' }}>
                        {wallet.wallet_address}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Wallet Address
              </label>
              <input
                type="text"
                value={formData.wallet_address}
                onChange={(e) => setFormData(prev => ({ ...prev, wallet_address: e.target.value }))}
                placeholder="Enter your wallet address"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Network
              </label>
              <select
                value={formData.network}
                onChange={(e) => setFormData(prev => ({ ...prev, network: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              >
                <option value="TRC20">TRC20 (TRON)</option>
                <option value="ERC20">ERC20 (Ethereum)</option>
                <option value="BEP20">BEP20 (BSC)</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Withdrawal History */}
      <Card>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Withdrawal History</h3>

        {withdrawals.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#a0aec0' }}>
            No withdrawals yet. Request your first withdrawal above!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Network</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <td style={{ padding: '1rem', color: '#a0aec0', fontSize: '0.875rem' }}>
                      {formatDateTime(withdrawal.created_at)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', fontSize: '1.125rem' }}>
                        {formatCurrency(withdrawal.amount)} USDT
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
                        Fee: {formatCurrency(withdrawal.transaction_fee)} | Net: {formatCurrency(withdrawal.net_amount)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}>
                        {withdrawal.network}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {getStatusBadge(withdrawal.status)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {withdrawal.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(withdrawal.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid #ef4444',
                            color: '#ef4444',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentWithdrawals;
