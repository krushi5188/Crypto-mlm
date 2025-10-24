import React, { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';
import Card from '../components/common/Card';
import { formatCurrency, formatDateTime, redactEmail } from '../utils/formatters';

const StudentEarnings = () => {
  const [earnings, setEarnings] = useState([]);
  const [invites, setInvites] = useState([]);
  const [expandedInvite, setExpandedInvite] = useState(null);
  const [inviteTransactions, setInviteTransactions] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);
  
  // Search/Filter states
  const [searchEmail, setSearchEmail] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const [earningsResponse, invitesResponse] = await Promise.all([
        studentAPI.getEarnings(),
        studentAPI.getDirectInvites()
      ]);

      const earningsData = earningsResponse.data.data.transactions || [];
      setEarnings(earningsData);

      const invitesData = invitesResponse.data.data.invites || [];
      setInvites(invitesData);

      // Calculate total from all earnings
      const total = earningsData.reduce((sum, e) => sum + e.amount, 0);
      setTotalEarned(total);
    } catch (error) {
      console.error('Failed to load earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInviteTransactions = async (inviteUserId) => {
    if (inviteTransactions[inviteUserId]) {
      // Already loaded
      return;
    }

    try {
      const response = await studentAPI.getInviteTransactions(inviteUserId);
      setInviteTransactions(prev => ({
        ...prev,
        [inviteUserId]: response.data.data.transactions || []
      }));
    } catch (error) {
      console.error('Failed to load invite transactions:', error);
    }
  };

  const toggleExpand = async (inviteUserId) => {
    if (expandedInvite === inviteUserId) {
      setExpandedInvite(null);
    } else {
      setExpandedInvite(inviteUserId);
      await loadInviteTransactions(inviteUserId);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Loading earnings...</p>
      </div>
    );
  }

  const containerStyles = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem'
  };

  return (
    <div style={containerStyles}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Earnings</h1>
        <p style={{ color: '#a0aec0' }}>Your commission history from direct invites</p>
      </div>

      {/* Total Earned */}
      <Card style={{
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))',
        border: '2px solid #10b981'
      }}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Earned
          </div>
          <div style={{ fontSize: '3rem', fontWeight: '700', color: '#10b981' }}>
            {formatCurrency(totalEarned)} USDT
          </div>
        </div>
      </Card>

      {/* People You Invited */}
      <Card>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>People You Invited</h3>
              <p style={{ color: '#a0aec0', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {invites.length} {invites.length === 1 ? 'invite' : 'invites'} 
                {invites.length !== invites.length && ` (filtered from ${invites.length})`}
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🔍 {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem' }}>
                  Search Email
                </label>
                <input
                  type="text"
                  placeholder="Filter by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem' }}>
                  Min Amount (USDT)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem' }}>
                  Max Amount (USDT)
                </label>
                <input
                  type="number"
                  placeholder="Unlimited"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setSearchEmail('');
                    setMinAmount('');
                    setMaxAmount('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Invited User</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Total Earned</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Transactions</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#a0aec0' }}>
                    No direct invites yet. Share your referral link to start earning!
                  </td>
                </tr>
              ) : (
                invites.map((invite) => (
                  <React.Fragment key={invite.userId}>
                    {/* Main row */}
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <td style={{ padding: '1rem', fontWeight: '600' }}>
                        {redactEmail(invite.email)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.125rem', fontWeight: '700', color: '#10b981' }}>
                        {formatCurrency(invite.totalEarned)} USDT
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#a0aec0' }}>
                        {invite.transactionCount} {invite.transactionCount === 1 ? 'transaction' : 'transactions'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleExpand(invite.userId)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            color: '#fff',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          {expandedInvite === invite.userId ? '▲ Hide' : '▼ Show'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded row with transactions */}
                    {expandedInvite === invite.userId && (
                      <tr>
                        <td colSpan="4" style={{ padding: '0', background: 'rgba(255, 255, 255, 0.05)' }}>
                          {!inviteTransactions[invite.userId] ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0' }}>
                              Loading transactions...
                            </div>
                          ) : inviteTransactions[invite.userId].length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0' }}>
                              No transactions yet
                            </div>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', color: '#a0aec0' }}>Date</th>
                                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', color: '#a0aec0' }}>Type</th>
                                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#a0aec0' }}>Amount</th>
                                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', color: '#a0aec0' }}>Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {inviteTransactions[invite.userId].map((transaction, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#a0aec0' }}>
                                      {formatDateTime(transaction.createdAt)}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                      <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        background: 'rgba(16, 185, 129, 0.2)',
                                        color: '#10b981'
                                      }}>
                                        {transaction.type === 'referral_bonus' ? 'REFERRAL' : transaction.type.toUpperCase()}
                                      </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#10b981' }}>
                                      +{formatCurrency(transaction.amount)} USDT
                                    </td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                      {transaction.description || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default StudentEarnings;
