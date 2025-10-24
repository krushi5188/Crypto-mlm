import React, { useState, useEffect } from 'react';
import { memberAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatCurrency } from '../utils/formatters';

const MemberProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await memberAPI.getProfile();
      setProfile(response.data.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${profile.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Loading profile...</p>
      </div>
    );
  }

  const containerStyles = {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem'
  };

  const approvalStatus = user?.approvalStatus || 'approved';
  const isApproved = approvalStatus === 'approved';

  return (
    <div style={containerStyles}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Profile</h1>
        <p style={{ color: '#a0aec0' }}>Your account information and referral link</p>
      </div>

      {/* Account Status */}
      {!isApproved && (
        <Card style={{ marginBottom: '2rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24' }}>
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⏳</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Account Pending Approval</h3>
            <p style={{ color: '#a0aec0' }}>
              Your registration is pending instructor approval. You'll be able to access full features once approved.
            </p>
          </div>
        </Card>
      )}

      {/* Profile Info */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Account Information</h3>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <div style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Username</div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>{profile?.username}</div>
            </div>
            <div>
              <div style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Email</div>
              <div style={{ fontSize: '1.125rem' }}>{profile?.email}</div>
            </div>
            <div>
              <div style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Current Balance</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fbbf24' }}>
                {formatCurrency(profile?.balance || 0)} USDT
              </div>
            </div>
            <div>
              <div style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Earned</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                {formatCurrency(profile?.totalEarned || 0)} USDT
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Referral Link */}
      {isApproved && (
        <Card style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))' }}>
          <div style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>🔗 Your Referral Link</h3>
            <p style={{ color: '#a0aec0', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Share this link with others to invite them to join the network. When they register using your link,
              you'll earn commissions based on their network activity.
            </p>

            {/* Referral Code */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Your Referral Code</div>
              <div style={{
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '1.5rem',
                fontWeight: '700',
                textAlign: 'center',
                color: '#fbbf24'
              }}>
                {profile?.referralCode}
              </div>
            </div>

            {/* Referral Link */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Referral Link</div>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px'
              }}>
                <input
                  type="text"
                  value={`${window.location.origin}/register?ref=${profile?.referralCode}`}
                  readOnly
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
                <Button onClick={copyReferralLink} style={{ whiteSpace: 'nowrap' }}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </Button>
              </div>
            </div>

            {/* Network Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fbbf24' }}>
                  {profile?.directRecruits || 0}
                </div>
                <div style={{ color: '#a0aec0', fontSize: '0.875rem' }}>Direct Recruits</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700' }}>{profile?.networkSize || 0}</div>
                <div style={{ color: '#a0aec0', fontSize: '0.875rem' }}>Total Network</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {!isApproved && (
        <Card>
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#a0aec0' }}>
            <p>Your referral link will be available after your account is approved by the instructor.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MemberProfile;
