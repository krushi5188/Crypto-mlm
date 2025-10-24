import React, { useState, useEffect } from 'react';
import { memberAPI } from '../services/api';
import Card from '../components/common/Card';
import { formatCurrency } from '../utils/formatters';

const MemberNetwork = () => {
  const [network, setNetwork] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNetwork();
  }, []);

  const loadNetwork = async () => {
    try {
      const response = await memberAPI.getNetwork();
      setNetwork(response.data.data.downline || []);
    } catch (error) {
      console.error('Failed to load network:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Loading network...</p>
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
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Network</h1>
        <p style={{ color: '#a0aec0' }}>Your downline members and earnings from them</p>
      </div>

      {/* Network List */}
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Member</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Total Earned</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Recruits</th>
              </tr>
            </thead>
            <tbody>
              {network.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '3rem', textAlign: 'center', color: '#a0aec0' }}>
                    No downline members yet. Share your referral link to start building your network!
                  </td>
                </tr>
              ) : (
                network.map((member) => (
                  <tr key={member.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>{member.displayName}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.125rem', fontWeight: '700', color: '#10b981' }}>
                      {formatCurrency(member.totalEarned || 0)} USDT
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#a0aec0' }}>
                      {member.networkSize}
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

export default MemberNetwork;
