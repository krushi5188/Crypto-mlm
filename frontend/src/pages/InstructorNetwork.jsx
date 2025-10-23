import React, { useState, useEffect } from 'react';
import { instructorAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatCurrency } from '../utils/formatters';

const InstructorNetwork = () => {
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    loadNetwork();
  }, []);

  const loadNetwork = async () => {
    try {
      const response = await instructorAPI.getNetworkGraph();
      setNetworkData(response.data.data);
      setError(null);
    } catch (error) {
      console.error('Failed to load network:', error);
      setError(error.response?.data?.error || 'Failed to load network data');
    } finally {
      setLoading(false);
    }
  };

  const renderNode = (node, level = 0) => {
    const isInstructor = node.role === 'instructor';
    const hasChildren = node.children && node.children.length > 0;

    const nodeStyle = {
      marginLeft: level > 0 ? '2rem' : '0',
      marginTop: level > 0 ? '1rem' : '0'
    };

    const cardStyle = {
      padding: '1rem',
      background: isInstructor
        ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))'
        : 'rgba(255, 255, 255, 0.05)',
      border: isInstructor
        ? '2px solid #fbbf24'
        : '1px solid rgba(255, 255, 255, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative'
    };

    return (
      <div key={node.id} style={nodeStyle}>
        <div
          style={cardStyle}
          onClick={() => setSelectedNode(node)}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                  {isInstructor ? '👨‍🏫' : '👤'} {node.username}
                </span>
                {isInstructor && (
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    background: '#fbbf24',
                    color: '#1a1a1a',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                  }}>
                    INSTRUCTOR
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#a0aec0', marginTop: '0.25rem' }}>
                {node.email}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fbbf24' }}>
                {formatCurrency(node.balance)} NC
              </div>
              <div style={{ fontSize: '0.875rem', color: '#a0aec0' }}>
                {node.directRecruits} direct • {node.networkSize} total
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && (
          <div style={{
            marginLeft: '1rem',
            paddingLeft: '1rem',
            borderLeft: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Loading network...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <Card>
          <div style={{ padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Error Loading Network</h2>
            <p style={{ color: '#a0aec0', marginBottom: '1.5rem' }}>{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  const containerStyles = {
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '2rem'
  };

  return (
    <div style={containerStyles}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Network Visualization</h1>
        <p style={{ color: '#a0aec0' }}>Complete MLM network structure</p>
      </div>

      {/* Network Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{networkData?.totalNodes || 0}</div>
          <div style={{ color: '#a0aec0' }}>Total Members</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{networkData?.maxDepth || 0}</div>
          <div style={{ color: '#a0aec0' }}>Max Depth</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#fbbf24' }}>
            {formatCurrency(networkData?.totalBalance || 0)} NC
          </div>
          <div style={{ color: '#a0aec0' }}>Total Balance</div>
        </Card>
      </div>

      {/* Network Tree */}
      <Card>
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Network Hierarchy</h3>
          {networkData && networkData.tree && renderNode(networkData.tree)}
          {(!networkData || !networkData.tree) && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#a0aec0' }}>
              No network data available
            </div>
          )}
        </div>
      </Card>

      {/* Selected Node Details */}
      {selectedNode && (
        <Card style={{ marginTop: '2rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24' }}>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.5rem' }}>Selected: {selectedNode.username}</h3>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  padding: '0.5rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '1.5rem'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Email</div>
                <div>{selectedNode.email}</div>
              </div>
              <div>
                <div style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Balance</div>
                <div style={{ color: '#fbbf24', fontWeight: '700' }}>{formatCurrency(selectedNode.balance)} NC</div>
              </div>
              <div>
                <div style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Direct Recruits</div>
                <div>{selectedNode.directRecruits}</div>
              </div>
              <div>
                <div style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Network Size</div>
                <div>{selectedNode.networkSize}</div>
              </div>
              <div>
                <div style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Earned</div>
                <div style={{ color: '#10b981', fontWeight: '700' }}>{formatCurrency(selectedNode.totalEarned || 0)} NC</div>
              </div>
              <div>
                <div style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Referral Code</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{selectedNode.referralCode}</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default InstructorNetwork;
