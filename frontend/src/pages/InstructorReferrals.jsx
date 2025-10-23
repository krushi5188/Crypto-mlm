import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { instructorAPI } from '../services/api';
import Card from '../components/common/Card';
import { formatCurrency, formatDate } from '../utils/formatters';

const InstructorReferrals = () => {
  const { user } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [myReferrals, setMyReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyReferrals();
  }, []);

  const loadMyReferrals = async () => {
    try {
      // Get all participants and filter those referred by the instructor
      const response = await instructorAPI.getParticipants({ limit: 1000 });
      const allParticipants = response.data.data.participants;

      // Filter participants referred by the instructor
      const instructorReferrals = allParticipants.filter(
        p => p.referredBy === user?.id
      );

      setMyReferrals(instructorReferrals);
    } catch (error) {
      console.error('Failed to load referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/register?ref=${user?.referralCode}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode).then(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      });
    }
  };

  const containerStyles = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem'
  };

  const statsStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  };

  return (
    <div style={containerStyles}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Referrals</h1>
        <p style={{ color: '#a0aec0' }}>Track your referral network and share your invite link</p>
      </div>

      {/* Referral Stats */}
      <div style={statsStyles}>
        <Card style={{ textAlign: 'center', padding: '2rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '2px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem', color: '#10b981' }}>
            {user?.directRecruits || 0}
          </div>
          <div style={{ color: '#a0aec0', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Direct Referrals
          </div>
        </Card>

        <Card style={{ textAlign: 'center', padding: '2rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '2px solid rgba(59, 130, 246, 0.3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem', color: '#3b82f6' }}>
            {user?.networkSize || 0}
          </div>
          <div style={{ color: '#a0aec0', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Total Network Size
          </div>
        </Card>

        <Card style={{ textAlign: 'center', padding: '2rem', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)', border: '2px solid rgba(251, 191, 36, 0.3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem', color: '#fbbf24' }}>
            {formatCurrency(user?.totalEarned || 0)}
          </div>
          <div style={{ color: '#a0aec0', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Total Earned (USDT)
          </div>
        </Card>
      </div>

      {/* Referral Code & Invite Link */}
      <Card style={{ marginBottom: '2rem', padding: '2rem', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)', border: '2px solid rgba(251, 191, 36, 0.4)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#fbbf24' }}>
          Your Referral Information
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {/* Referral Code */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.75rem', color: '#a0aec0', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Your Referral Code
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{
                flex: 1,
                padding: '1rem 1.5rem',
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#fbbf24',
                letterSpacing: '2px',
                textAlign: 'center',
                border: '2px solid rgba(251, 191, 36, 0.3)'
              }}>
                {user?.referralCode || 'Loading...'}
              </div>
              <button
                onClick={copyReferralCode}
                style={{
                  padding: '1rem 1.5rem',
                  background: copiedCode ? '#10b981' : 'rgba(251, 191, 36, 0.2)',
                  color: copiedCode ? '#fff' : '#fbbf24',
                  border: '2px solid',
                  borderColor: copiedCode ? '#10b981' : '#fbbf24',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {copiedCode ? '✓ Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>

          {/* Invite Link */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.75rem', color: '#a0aec0', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Invite Link
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                readOnly
                value={user?.referralCode ? `${window.location.origin}/register?ref=${user.referralCode}` : 'Loading...'}
                style={{
                  flex: 1,
                  padding: '1rem 1.5rem',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  color: '#10b981',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              />
              <button
                onClick={copyInviteLink}
                style={{
                  padding: '1rem 1.5rem',
                  background: copiedLink ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
                  color: copiedLink ? '#fff' : '#10b981',
                  border: '2px solid',
                  borderColor: copiedLink ? '#10b981' : '#10b981',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {copiedLink ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem 1.5rem',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
          <p style={{ color: '#a0aec0', fontSize: '0.875rem', margin: 0 }}>
            Share this link with potential members to grow your network. All participants you create manually are automatically added under your referral.
          </p>
        </div>
      </Card>

      {/* My Direct Referrals Table */}
      <Card>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            My Direct Referrals ({myReferrals.length})
          </h2>
          <p style={{ color: '#a0aec0', fontSize: '0.875rem' }}>
            Participants directly referred by you
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
            <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Loading referrals...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#a0aec0', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                    Username
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#a0aec0', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                    Email
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#a0aec0', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                    Balance
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#a0aec0', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                    Network
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#a0aec0', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                    Joined Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {myReferrals.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#a0aec0' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                      <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No direct referrals yet</div>
                      <div style={{ fontSize: '0.875rem' }}>Share your invite link to start building your network</div>
                    </td>
                  </tr>
                ) : (
                  myReferrals.map((referral) => (
                    <tr key={referral.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '1rem', fontWeight: '600', color: '#fff' }}>
                        {referral.username}
                      </td>
                      <td style={{ padding: '1rem', color: '#a0aec0', fontSize: '0.875rem' }}>
                        {referral.email}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: '#fbbf24', fontWeight: '600' }}>
                        {formatCurrency(referral.balance)} USDT
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: '#10b981' }}>
                        <span style={{ fontSize: '0.875rem' }}>
                          {referral.directRecruits} / {referral.networkSize}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#a0aec0', fontSize: '0.875rem' }}>
                        {formatDate(referral.joinedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default InstructorReferrals;
