import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const StudentDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [platformWallets, setPlatformWallets] = useState({
    TRC20: 'Loading...',
    ERC20: 'Loading...',
    BEP20: 'Loading...'
  });
  const [formData, setFormData] = useState({
    amount: '',
    wallet_address: '',
    network: 'TRC20',
    transaction_hash: ''
  });

  useEffect(() => {
    loadDepositData();
    loadWalletAddresses();
  }, []);

  const loadWalletAddresses = async () => {
    try {
      const response = await apiService.get('/student/deposits/wallet-addresses');
      setPlatformWallets(response.data.wallets);
    } catch (error) {
      console.error('Failed to load wallet addresses:', error);
    }
  };

  const loadDepositData = async () => {
    try {
      setLoading(true);
      const [depositsRes, statsRes] = await Promise.all([
        apiService.get('/student/deposits?limit=50'),
        apiService.get('/student/deposits/stats')
      ]);
      setDeposits(depositsRes.data.deposits);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Failed to load deposit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setMessage('');

      const response = await apiService.post('/student/deposits', {
        amount: parseFloat(formData.amount),
        wallet_address: formData.wallet_address,
        network: formData.network,
        transaction_hash: formData.transaction_hash
      });

      setMessage(response.data.message);
      setFormData({
        amount: '',
        wallet_address: '',
        network: 'TRC20',
        transaction_hash: ''
      });
      setShowForm(false);

      // Reload deposits
      await loadDepositData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to submit deposit');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage('Address copied to clipboard!');
    setTimeout(() => setMessage(''), 3000);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { backgroundColor: '#f59e0b', color: 'white' },
      confirmed: { backgroundColor: '#22c55e', color: 'white' },
      failed: { backgroundColor: '#ef4444', color: 'white' }
    };

    return (
      <span style={{
        ...styles.statusBadge,
        ...(statusStyles[status] || {})
      }}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading deposits...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Deposits</h1>
          <p style={styles.subtitle}>Add funds to your account</p>
        </div>
        <button
          style={styles.depositButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ New Deposit'}
        </button>
      </div>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      {/* Statistics Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div>
            <div style={styles.statValue}>{parseFloat(stats?.total_deposited || 0).toFixed(2)} AC</div>
            <div style={styles.statLabel}>Total Deposited</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>⏳</div>
          <div>
            <div style={styles.statValue}>{parseFloat(stats?.pending_amount || 0).toFixed(2)} AC</div>
            <div style={styles.statLabel}>Pending</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div>
            <div style={styles.statValue}>{stats?.confirmed_count || 0}</div>
            <div style={styles.statLabel}>Confirmed Deposits</div>
          </div>
        </div>
      </div>

      {/* Deposit Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Submit Deposit</h3>

          {/* Instructions */}
          <div style={styles.instructionsCard}>
            <h4 style={styles.instructionsTitle}>How to Deposit:</h4>
            <ol style={styles.instructionsList}>
              <li>Select your preferred network (TRC20 recommended for lower fees)</li>
              <li>Copy the platform wallet address below</li>
              <li>Send USDT from your wallet to the copied address</li>
              <li>Once transaction is confirmed, copy the transaction hash</li>
              <li>Fill out the form below with transaction details</li>
              <li>Submit and wait for admin confirmation</li>
            </ol>

            <div style={styles.networkSelector}>
              <label style={styles.label}>Select Network:</label>
              <select
                name="network"
                value={formData.network}
                onChange={handleInputChange}
                style={styles.select}
              >
                <option value="TRC20">TRC20 (Tron)</option>
                <option value="ERC20">ERC20 (Ethereum)</option>
                <option value="BEP20">BEP20 (BSC)</option>
              </select>
            </div>

            <div style={styles.walletAddressBox}>
              <div style={styles.walletLabel}>Platform Wallet Address ({formData.network}):</div>
              <div style={styles.walletAddressDisplay}>
                <code style={styles.walletCode}>{platformWallets[formData.network]}</code>
                <button
                  type="button"
                  style={styles.copyButton}
                  onClick={() => copyToClipboard(platformWallets[formData.network])}
                >
                  📋 Copy
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Amount (USDT)*</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                step="0.01"
                min="0.01"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Your Wallet Address*</label>
              <input
                type="text"
                name="wallet_address"
                value={formData.wallet_address}
                onChange={handleInputChange}
                placeholder="Address you sent from"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Transaction Hash*</label>
              <input
                type="text"
                name="transaction_hash"
                value={formData.transaction_hash}
                onChange={handleInputChange}
                placeholder="0x..."
                required
                style={styles.input}
              />
              <small style={styles.helpText}>
                Find this in your wallet transaction history or blockchain explorer
              </small>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.submitButton,
                ...(submitting ? styles.submitButtonDisabled : {})
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Deposit'}
            </button>
          </form>
        </div>
      )}

      {/* Deposit History */}
      <div style={styles.historyCard}>
        <h3 style={styles.historyTitle}>Deposit History</h3>

        {deposits.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💸</div>
            <div style={styles.emptyText}>No deposits yet</div>
            <div style={styles.emptySubtext}>Click "New Deposit" to make your first deposit</div>
          </div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <div style={styles.tableCell}>Date</div>
              <div style={styles.tableCell}>Amount</div>
              <div style={styles.tableCell}>Network</div>
              <div style={styles.tableCell}>Transaction Hash</div>
              <div style={styles.tableCell}>Status</div>
            </div>
            <div style={styles.tableBody}>
              {deposits.map(deposit => (
                <div key={deposit.id} style={styles.tableRow}>
                  <div style={styles.tableCell}>
                    {new Date(deposit.created_at).toLocaleString()}
                  </div>
                  <div style={styles.tableCell}>
                    <strong>{parseFloat(deposit.amount).toFixed(2)} AC</strong>
                  </div>
                  <div style={styles.tableCell}>
                    <span style={styles.networkBadge}>{deposit.network}</span>
                  </div>
                  <div style={styles.tableCell}>
                    <code style={styles.txHash}>
                      {deposit.transaction_hash.substring(0, 10)}...
                      {deposit.transaction_hash.substring(deposit.transaction_hash.length - 8)}
                    </code>
                  </div>
                  <div style={styles.tableCell}>
                    {getStatusBadge(deposit.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: 'var(--space-xl)',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 'var(--space-xl)',
    flexWrap: 'wrap',
    gap: 'var(--space-md)'
  },
  title: {
    fontSize: 'var(--text-3xl)',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-xs)'
  },
  subtitle: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-secondary)'
  },
  depositButton: {
    padding: 'var(--space-sm) var(--space-lg)',
    backgroundColor: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  message: {
    padding: 'var(--space-md)',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--success)',
    marginBottom: 'var(--space-lg)',
    textAlign: 'center'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'var(--space-lg)',
    marginBottom: 'var(--space-xl)'
  },
  statCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)'
  },
  statIcon: {
    fontSize: '36px'
  },
  statValue: {
    fontSize: 'var(--text-2xl)',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-xs)'
  },
  statLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)'
  },
  formCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-xl)',
    marginBottom: 'var(--space-xl)'
  },
  formTitle: {
    fontSize: 'var(--text-xl)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-lg)'
  },
  instructionsCard: {
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-lg)',
    marginBottom: 'var(--space-lg)'
  },
  instructionsTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-md)'
  },
  instructionsList: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    paddingLeft: 'var(--space-lg)',
    marginBottom: 'var(--space-lg)'
  },
  networkSelector: {
    marginBottom: 'var(--space-lg)'
  },
  walletAddressBox: {
    backgroundColor: 'var(--bg-primary)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)'
  },
  walletLabel: {
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-sm)'
  },
  walletAddressDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)'
  },
  walletCode: {
    flex: 1,
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-secondary)',
    padding: 'var(--space-sm)',
    borderRadius: 'var(--radius-sm)',
    wordBreak: 'break-all'
  },
  copyButton: {
    padding: 'var(--space-sm) var(--space-md)',
    backgroundColor: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)'
  },
  label: {
    fontSize: 'var(--text-sm)',
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  input: {
    padding: 'var(--space-sm)',
    fontSize: 'var(--text-base)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)'
  },
  select: {
    padding: 'var(--space-sm)',
    fontSize: 'var(--text-base)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer'
  },
  helpText: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-tertiary)'
  },
  submitButton: {
    padding: 'var(--space-md) var(--space-xl)',
    backgroundColor: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  submitButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  historyCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-xl)'
  },
  historyTitle: {
    fontSize: 'var(--text-xl)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-lg)'
  },
  table: {
    width: '100%'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 2fr 1fr',
    gap: 'var(--space-md)',
    padding: 'var(--space-md)',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-sm)'
  },
  tableBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 2fr 1fr',
    gap: 'var(--space-md)',
    padding: 'var(--space-md)',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    alignItems: 'center'
  },
  tableCell: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)'
  },
  networkBadge: {
    padding: '2px 8px',
    backgroundColor: 'var(--primary)',
    color: 'white',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    fontWeight: '600'
  },
  txHash: {
    fontSize: 'var(--text-xs)',
    fontFamily: 'monospace',
    color: 'var(--text-secondary)'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    fontWeight: '600'
  },
  emptyState: {
    textAlign: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-secondary)'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: 'var(--space-md)'
  },
  emptyText: {
    fontSize: 'var(--text-lg)',
    fontWeight: '600',
    marginBottom: 'var(--space-xs)'
  },
  emptySubtext: {
    fontSize: 'var(--text-sm)'
  },
  loading: {
    textAlign: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-secondary)'
  }
};

export default StudentDeposits;
