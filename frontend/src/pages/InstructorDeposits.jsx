import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const InstructorDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    loadDepositData();
  }, [filter]);

  const loadDepositData = async () => {
    try {
      setLoading(true);
      const endpoint = filter === 'pending'
        ? '/instructor/deposits/pending'
        : `/instructor/deposits?status=${filter !== 'all' ? filter : ''}`;

      const [depositsRes, statsRes] = await Promise.all([
        apiService.get(endpoint),
        apiService.get('/instructor/deposits/stats')
      ]);

      setDeposits(depositsRes.data.deposits);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Failed to load deposit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (depositId) => {
    if (!window.confirm('Confirm this deposit and credit user account?')) {
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, [depositId]: true }));

      await apiService.post(`/instructor/deposits/${depositId}/confirm`);

      alert('Deposit confirmed successfully!');
      await loadDepositData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to confirm deposit');
    } finally {
      setProcessing(prev => ({ ...prev, [depositId]: false }));
    }
  };

  const handleReject = async (depositId) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      setProcessing(prev => ({ ...prev, [depositId]: true }));

      await apiService.post(`/instructor/deposits/${depositId}/reject`, { reason });

      alert('Deposit rejected successfully!');
      await loadDepositData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to reject deposit');
    } finally {
      setProcessing(prev => ({ ...prev, [depositId]: false }));
    }
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
          <h1 style={styles.title}>Deposit Management</h1>
          <p style={styles.subtitle}>Review and confirm user deposits</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>💰</div>
            <div>
              <div style={styles.statValue}>{stats.totalConfirmed?.toFixed(2) || '0.00'} AC</div>
              <div style={styles.statLabel}>Total Confirmed</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>⏳</div>
            <div>
              <div style={styles.statValue}>{stats.pendingCount || 0}</div>
              <div style={styles.statLabel}>Pending Deposits</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div>
              <div style={styles.statValue}>{stats.confirmedCount || 0}</div>
              <div style={styles.statLabel}>Confirmed</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>👥</div>
            <div>
              <div style={styles.statValue}>{stats.uniqueDepositors || 0}</div>
              <div style={styles.statLabel}>Unique Depositors</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={styles.filterTabs}>
        <button
          style={{
            ...styles.filterTab,
            ...(filter === 'all' ? styles.filterTabActive : {})
          }}
          onClick={() => setFilter('all')}
        >
          All Deposits
        </button>
        <button
          style={{
            ...styles.filterTab,
            ...(filter === 'pending' ? styles.filterTabActive : {})
          }}
          onClick={() => setFilter('pending')}
        >
          Pending ({stats?.pendingCount || 0})
        </button>
        <button
          style={{
            ...styles.filterTab,
            ...(filter === 'confirmed' ? styles.filterTabActive : {})
          }}
          onClick={() => setFilter('confirmed')}
        >
          Confirmed
        </button>
        <button
          style={{
            ...styles.filterTab,
            ...(filter === 'failed' ? styles.filterTabActive : {})
          }}
          onClick={() => setFilter('failed')}
        >
          Rejected
        </button>
      </div>

      {/* Deposits Table */}
      <div style={styles.tableCard}>
        {deposits.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <div style={styles.emptyText}>No deposits found</div>
          </div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <div style={styles.tableCell}>Date</div>
              <div style={styles.tableCell}>User</div>
              <div style={styles.tableCell}>Amount</div>
              <div style={styles.tableCell}>Network</div>
              <div style={styles.tableCell}>Transaction Hash</div>
              <div style={styles.tableCell}>Status</div>
              <div style={styles.tableCell}>Actions</div>
            </div>
            <div style={styles.tableBody}>
              {deposits.map(deposit => (
                <div key={deposit.id} style={styles.tableRow}>
                  <div style={styles.tableCell}>
                    <div style={styles.dateTime}>
                      {new Date(deposit.created_at).toLocaleDateString()}
                    </div>
                    <div style={styles.dateTimeSecondary}>
                      {new Date(deposit.created_at).toLocaleTimeString()}
                    </div>
                  </div>

                  <div style={styles.tableCell}>
                    <div style={styles.userName}>{deposit.username}</div>
                    <div style={styles.userEmail}>{deposit.email}</div>
                  </div>

                  <div style={styles.tableCell}>
                    <strong style={styles.amount}>{parseFloat(deposit.amount).toFixed(2)} AC</strong>
                  </div>

                  <div style={styles.tableCell}>
                    <span style={styles.networkBadge}>{deposit.network}</span>
                  </div>

                  <div style={styles.tableCell}>
                    <code style={styles.txHash} title={deposit.transaction_hash}>
                      {deposit.transaction_hash.substring(0, 10)}...
                      {deposit.transaction_hash.substring(deposit.transaction_hash.length - 8)}
                    </code>
                  </div>

                  <div style={styles.tableCell}>
                    {getStatusBadge(deposit.status)}
                  </div>

                  <div style={styles.tableCell}>
                    {deposit.status === 'pending' && (
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.confirmButton}
                          onClick={() => handleConfirm(deposit.id)}
                          disabled={processing[deposit.id]}
                        >
                          {processing[deposit.id] ? '...' : '✓ Confirm'}
                        </button>
                        <button
                          style={styles.rejectButton}
                          onClick={() => handleReject(deposit.id)}
                          disabled={processing[deposit.id]}
                        >
                          {processing[deposit.id] ? '...' : '✗ Reject'}
                        </button>
                      </div>
                    )}
                    {deposit.status === 'confirmed' && (
                      <div style={styles.confirmedDate}>
                        Confirmed: {new Date(deposit.confirmed_at).toLocaleDateString()}
                      </div>
                    )}
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
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    marginBottom: 'var(--space-xl)'
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
  filterTabs: {
    display: 'flex',
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-lg)',
    borderBottom: '2px solid var(--border-color)',
    paddingBottom: '0'
  },
  filterTab: {
    padding: 'var(--space-sm) var(--space-lg)',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    fontSize: 'var(--text-base)',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  filterTabActive: {
    color: 'var(--primary)',
    borderBottomColor: 'var(--primary)'
  },
  tableCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)',
    overflowX: 'auto'
  },
  table: {
    minWidth: '1000px'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '140px 180px 120px 100px 200px 100px 200px',
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
    gridTemplateColumns: '140px 180px 120px 100px 200px 100px 200px',
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
  dateTime: {
    fontSize: 'var(--text-sm)',
    fontWeight: '500'
  },
  dateTimeSecondary: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
    marginTop: '2px'
  },
  userName: {
    fontSize: 'var(--text-sm)',
    fontWeight: '500'
  },
  userEmail: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
    marginTop: '2px'
  },
  amount: {
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    color: 'var(--success)'
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
    color: 'var(--text-secondary)',
    wordBreak: 'break-all'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    fontWeight: '600',
    display: 'inline-block'
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)'
  },
  confirmButton: {
    padding: 'var(--space-xs) var(--space-sm)',
    backgroundColor: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  rejectButton: {
    padding: 'var(--space-xs) var(--space-sm)',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  confirmedDate: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)'
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
    fontWeight: '600'
  },
  loading: {
    textAlign: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-secondary)'
  }
};

export default InstructorDeposits;
