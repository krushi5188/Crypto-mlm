import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const StudentSecurity = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupStep, setSetupStep] = useState(null); // null, 'setup', 'verify', 'backup-codes'
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/student/security/2fa');
      setTwoFactorEnabled(response.data.settings.is_enabled);
    } catch (error) {
      console.error('Failed to load 2FA settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await apiService.post('/student/security/2fa/setup');
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setSetupStep('setup');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to start setup');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const response = await apiService.post('/student/security/2fa/enable', {
        token: verificationCode,
        secret: secret
      });
      setBackupCodes(response.data.backupCodes);
      setSetupStep('backup-codes');
      setVerificationCode('');
    } catch (error) {
      setError(error.response?.data?.error || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const finishSetup = () => {
    setTwoFactorEnabled(true);
    setSetupStep(null);
    setQrCode('');
    setSecret('');
    setBackupCodes([]);
    setSuccess('Two-factor authentication enabled successfully!');
    setTimeout(() => setSuccess(''), 5000);
  };

  const disable2FA = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }

    try {
      setError('');
      setLoading(true);
      await apiService.post('/student/security/2fa/disable', { password });
      setTwoFactorEnabled(false);
      setPassword('');
      setSuccess('Two-factor authentication disabled successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const regenerateBackupCodes = async (e) => {
    e.preventDefault();
    if (!window.confirm('This will invalidate your current backup codes. Continue?')) {
      return;
    }

    try {
      setError('');
      setLoading(true);
      const response = await apiService.post('/student/security/2fa/regenerate-backup', { password });
      setBackupCodes(response.data.backupCodes);
      setSetupStep('backup-codes');
      setPassword('');
      setSuccess('Backup codes regenerated successfully!');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to regenerate backup codes');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setSuccess('Backup codes copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (loading && !setupStep) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Security Settings</h1>
        <p style={styles.subtitle}>Manage your account security and two-factor authentication</p>
      </div>

      {error && (
        <div style={styles.alert.error}>
          <span style={styles.alert.icon}>⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div style={styles.alert.success}>
          <span style={styles.alert.icon}>✓</span>
          {success}
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>Two-Factor Authentication</h2>
            <p style={styles.cardSubtitle}>
              Add an extra layer of security to your account
            </p>
          </div>
          <div style={{
            ...styles.badge,
            ...(twoFactorEnabled ? styles.badge.enabled : styles.badge.disabled)
          }}>
            {twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {!setupStep && (
          <div style={styles.cardBody}>
            {!twoFactorEnabled ? (
              <>
                <p style={styles.description}>
                  Two-factor authentication adds an additional layer of security to your account.
                  You'll need to enter a code from your authenticator app when logging in.
                </p>
                <button
                  style={styles.button.primary}
                  onClick={startSetup}
                  disabled={loading}
                >
                  {loading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
                </button>
              </>
            ) : (
              <div style={styles.enabledSection}>
                <p style={styles.description}>
                  Two-factor authentication is currently enabled on your account.
                </p>

                <div style={styles.form}>
                  <label style={styles.label}>Enter your password to disable or regenerate backup codes:</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    style={styles.input}
                  />

                  <div style={styles.buttonGroup}>
                    <button
                      style={styles.button.secondary}
                      onClick={regenerateBackupCodes}
                      disabled={loading || !password}
                    >
                      Regenerate Backup Codes
                    </button>
                    <button
                      style={styles.button.danger}
                      onClick={disable2FA}
                      disabled={loading || !password}
                    >
                      Disable 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {setupStep === 'setup' && (
          <div style={styles.cardBody}>
            <div style={styles.setupStep}>
              <h3 style={styles.stepTitle}>Step 1: Scan QR Code</h3>
              <p style={styles.stepDescription}>
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>

              <div style={styles.qrCodeContainer}>
                <img src={qrCode} alt="2FA QR Code" style={styles.qrCode} />
              </div>

              <p style={styles.stepDescription}>
                Or manually enter this code in your app:
              </p>
              <div style={styles.secretBox}>
                <code style={styles.secret}>{secret}</code>
              </div>

              <button
                style={styles.button.primary}
                onClick={() => setSetupStep('verify')}
              >
                Next: Verify Code
              </button>
            </div>
          </div>
        )}

        {setupStep === 'verify' && (
          <div style={styles.cardBody}>
            <div style={styles.setupStep}>
              <h3 style={styles.stepTitle}>Step 2: Verify Code</h3>
              <p style={styles.stepDescription}>
                Enter the 6-digit code from your authenticator app to verify the setup
              </p>

              <form onSubmit={verifyAndEnable} style={styles.form}>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  style={{...styles.input, ...styles.codeInput}}
                  autoFocus
                />

                <div style={styles.buttonGroup}>
                  <button
                    type="button"
                    style={styles.button.secondary}
                    onClick={() => setSetupStep('setup')}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    style={styles.button.primary}
                    disabled={loading || verificationCode.length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Verify and Enable'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {setupStep === 'backup-codes' && (
          <div style={styles.cardBody}>
            <div style={styles.setupStep}>
              <h3 style={styles.stepTitle}>Backup Codes</h3>
              <p style={styles.stepDescription}>
                Save these backup codes in a safe place. You can use them to access your account if you lose your device.
              </p>

              <div style={styles.backupCodesContainer}>
                {backupCodes.map((code, index) => (
                  <div key={index} style={styles.backupCode}>
                    <code>{code}</code>
                  </div>
                ))}
              </div>

              <div style={styles.buttonGroup}>
                <button
                  style={styles.button.secondary}
                  onClick={copyBackupCodes}
                >
                  Copy All Codes
                </button>
                <button
                  style={styles.button.primary}
                  onClick={finishSetup}
                >
                  I've Saved My Backup Codes
                </button>
              </div>
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
    maxWidth: '800px',
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
  alert: {
    error: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      color: 'var(--danger)',
      padding: 'var(--space-md)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 'var(--space-lg)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)'
    },
    success: {
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      border: '1px solid rgba(34, 197, 94, 0.3)',
      color: 'var(--success)',
      padding: 'var(--space-md)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 'var(--space-lg)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)'
    },
    icon: {
      fontSize: '20px'
    }
  },
  card: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden'
  },
  cardHeader: {
    padding: 'var(--space-lg)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cardTitle: {
    fontSize: 'var(--text-xl)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-xs)'
  },
  cardSubtitle: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)'
  },
  badge: {
    padding: '4px 12px',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: '500',
    enabled: {
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      color: 'var(--success)'
    },
    disabled: {
      backgroundColor: 'rgba(156, 163, 175, 0.1)',
      color: 'var(--text-tertiary)'
    }
  },
  cardBody: {
    padding: 'var(--space-lg)'
  },
  description: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-lg)',
    lineHeight: 1.6
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)'
  },
  label: {
    fontSize: 'var(--text-sm)',
    fontWeight: '500',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-xs)'
  },
  input: {
    padding: 'var(--space-sm) var(--space-md)',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-base)',
    transition: 'border-color 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: 'var(--primary)'
    }
  },
  codeInput: {
    fontSize: '24px',
    textAlign: 'center',
    letterSpacing: '0.5em',
    fontFamily: 'monospace'
  },
  buttonGroup: {
    display: 'flex',
    gap: 'var(--space-sm)',
    marginTop: 'var(--space-md)'
  },
  button: {
    primary: {
      padding: 'var(--space-sm) var(--space-lg)',
      backgroundColor: 'var(--primary)',
      color: 'white',
      border: 'none',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--text-base)',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      ':hover': {
        backgroundColor: 'var(--primary-dark)'
      },
      ':disabled': {
        opacity: 0.5,
        cursor: 'not-allowed'
      }
    },
    secondary: {
      padding: 'var(--space-sm) var(--space-lg)',
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--text-base)',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      ':hover': {
        backgroundColor: 'var(--bg-tertiary)'
      },
      ':disabled': {
        opacity: 0.5,
        cursor: 'not-allowed'
      }
    },
    danger: {
      padding: 'var(--space-sm) var(--space-lg)',
      backgroundColor: 'var(--danger)',
      color: 'white',
      border: 'none',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--text-base)',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      ':hover': {
        opacity: 0.9
      },
      ':disabled': {
        opacity: 0.5,
        cursor: 'not-allowed'
      }
    }
  },
  setupStep: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)'
  },
  stepTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  stepDescription: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-secondary)',
    lineHeight: 1.6
  },
  qrCodeContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: 'var(--space-lg)',
    backgroundColor: 'white',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)'
  },
  qrCode: {
    width: '256px',
    height: '256px'
  },
  secretBox: {
    padding: 'var(--space-md)',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    textAlign: 'center'
  },
  secret: {
    fontSize: 'var(--text-lg)',
    fontFamily: 'monospace',
    color: 'var(--text-primary)',
    letterSpacing: '0.1em'
  },
  backupCodesContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)'
  },
  backupCode: {
    padding: 'var(--space-sm)',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: 'var(--radius-sm)',
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: 'var(--text-base)',
    color: 'var(--text-primary)'
  },
  enabledSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)'
  },
  loading: {
    textAlign: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-secondary)'
  }
};

export default StudentSecurity;
