import React, { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const StudentWallets = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    wallet_address: '',
    wallet_type: 'manual',
    network: 'TRC20',
    label: ''
  });
  const [error, setError] = useState(null);
  const [metaMaskAvailable, setMetaMaskAvailable] = useState(false);

  useEffect(() => {
    loadWallets();
    checkMetaMask();
  }, []);

  const checkMetaMask = () => {
    setMetaMaskAvailable(typeof window.ethereum !== 'undefined');
  };

  const loadWallets = async () => {
    try {
      const response = await studentAPI.getWallets();
      setWallets(response.data.data.wallets || []);
    } catch (error) {
      console.error('Failed to load wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectMetaMask = async () => {
    if (!metaMaskAvailable) {
      alert('MetaMask is not installed. Please install MetaMask extension.');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];

      setFormData(prev => ({
        ...prev,
        wallet_address: address,
        wallet_type: 'metamask',
        network: 'ERC20',
        label: 'MetaMask Wallet'
      }));
      setShowForm(true);
    } catch (error) {
      console.error('MetaMask connection error:', error);
      alert('Failed to connect MetaMask');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await studentAPI.addWallet(formData);
      setShowForm(false);
      setFormData({ wallet_address: '', wallet_type: 'manual', network: 'TRC20', label: '' });
      await loadWallets();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add wallet');
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      await studentAPI.setPrimaryWallet(id);
      await loadWallets();
    } catch (error) {
      alert('Failed to set primary wallet');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this wallet?')) return;

    try {
      await studentAPI.deleteWallet(id);
      await loadWallets();
    } catch (error) {
      alert('Failed to delete wallet');
    }
  };

  const getNetworkBadge = (network) => (
    <span style={{
      padding: '0.25rem 0.5rem',
      background: network === 'TRC20' ? 'rgba(255, 68, 68, 0.2)' : network === 'ERC20' ? 'rgba(98, 126, 234, 0.2)' : 'rgba(243, 186, 47, 0.2)',
      color: network === 'TRC20' ? '#ff4444' : network === 'ERC20' ? '#627eea' : '#f3ba2f',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: '700'
    }}>
      {network}
    </span>
  );

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Loading wallets...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Wallets</h1>
        <p style={{ color: '#a0aec0' }}>Manage your cryptocurrency wallet addresses</p>
      </div>

      {/* Connect Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {metaMaskAvailable && (
          <Button
            onClick={connectMetaMask}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #f6851b, #e2761b)'
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>🦊</span>
            Connect MetaMask
          </Button>
        )}

        <Button onClick={() => setShowForm(true)} variant="secondary">
          + Add Manual Address
        </Button>
      </div>

      {/* Wallet Form */}
      {showForm && (
        <Card style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
            {formData.wallet_type === 'metamask' ? 'Add MetaMask Wallet' : 'Add Wallet Address'}
          </h3>

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
                Wallet Address
              </label>
              <input
                type="text"
                value={formData.wallet_address}
                onChange={(e) => setFormData(prev => ({ ...prev, wallet_address: e.target.value }))}
                placeholder="Enter wallet address..."
                required
                readOnly={formData.wallet_type === 'metamask'}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: formData.wallet_type === 'metamask' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
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
                disabled={formData.wallet_type === 'metamask'}
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
                Label (Optional)
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., My Main Wallet"
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
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button type="submit">Add Wallet</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                  setFormData({ wallet_address: '', wallet_type: 'manual', network: 'TRC20', label: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Wallet List */}
      {wallets.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👛</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Wallets Added</h3>
          <p style={{ color: '#a0aec0', marginBottom: '1.5rem' }}>
            Add your first wallet address to enable withdrawals
          </p>
          <Button onClick={() => setShowForm(true)}>Add Wallet Address</Button>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {wallets.map((wallet) => (
            <Card key={wallet.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                      {wallet.label || wallet.wallet_type}
                    </h4>
                    {getNetworkBadge(wallet.network)}
                    {wallet.is_primary && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}>
                        ⭐ PRIMARY
                      </span>
                    )}
                    {wallet.wallet_type === 'metamask' && (
                      <span style={{ fontSize: '1.25rem' }}>🦊</span>
                    )}
                  </div>

                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    color: '#a0aec0',
                    marginBottom: '0.5rem',
                    wordBreak: 'break-all'
                  }}>
                    {wallet.wallet_address}
                  </div>

                  {wallet.last_used_at && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Last used: {new Date(wallet.last_used_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                  {!wallet.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(wallet.id)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10b981',
                        color: '#10b981',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Set Primary
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(wallet.id)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card style={{ marginTop: '2rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#3b82f6' }}>
          ℹ️ Wallet Information
        </h4>
        <ul style={{ color: '#a0aec0', fontSize: '0.875rem', paddingLeft: '1.5rem', margin: 0 }}>
          <li>Your primary wallet will be pre-selected for withdrawals</li>
          <li>Make sure to use the correct network for your wallet address</li>
          <li>TRC20 = TRON, ERC20 = Ethereum, BEP20 = Binance Smart Chain</li>
          <li>Double-check addresses before adding - incorrect addresses may result in loss of funds</li>
          <li>MetaMask wallets are automatically set to ERC20 (Ethereum)</li>
        </ul>
      </Card>
    </div>
  );
};

export default StudentWallets;
