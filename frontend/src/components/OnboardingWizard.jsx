import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberAPI } from '../services/api';
import AvatarUpload from './AvatarUpload';

const OnboardingWizard = ({ user, onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form data
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
  const [goal, setGoal] = useState({
    type: 'earnings',
    target: 100
  });
  const [referralLink, setReferralLink] = useState('');

  useEffect(() => {
    // Generate referral link
    const baseUrl = window.location.origin;
    setReferralLink(`${baseUrl}/register?ref=${user?.referralCode || ''}`);
  }, [user]);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Atlas Network!',
      description: "Let's get you started with a quick tour"
    },
    {
      id: 'profile',
      title: 'Set Up Your Profile',
      description: 'Add a profile picture to personalize your account'
    },
    {
      id: 'overview',
      title: 'How It Works',
      description: 'Learn the basics of the platform'
    },
    {
      id: 'goal',
      title: 'Set Your First Goal',
      description: 'What would you like to achieve?'
    },
    {
      id: 'referral',
      title: 'Your Referral Link',
      description: 'Start building your network'
    },
    {
      id: 'complete',
      title: 'All Set!',
      description: "You're ready to go"
    }
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);
    try {
      // Create goal if set
      if (goal.target > 0) {
        await memberAPI.createGoal({
          goal_type: goal.type,
          target_value: goal.target
        });
      }

      // Mark onboarding as complete
      await memberAPI.completeOnboarding();

      if (onComplete) {
        onComplete();
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      setError('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      const response = await memberAPI.uploadAvatar(file);
      setAvatarUrl(response.data.data.avatarUrl);
    } catch (err) {
      throw new Error('Failed to upload avatar');
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    // Could add a toast notification here
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <div style={styles.stepContent}>
            <div style={styles.icon}>🎉</div>
            <h2 style={styles.stepTitle}>Welcome, {user?.username || 'there'}!</h2>
            <p style={styles.stepDescription}>
              We're excited to have you join Atlas Network. This quick setup will help you get started
              and show you around the platform.
            </p>
            <div style={styles.features}>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>💰</span>
                <span style={styles.featureText}>Earn from your network</span>
              </div>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>📈</span>
                <span style={styles.featureText}>Track your progress</span>
              </div>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>🤝</span>
                <span style={styles.featureText}>Build your team</span>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>Set Up Your Profile</h2>
            <p style={styles.stepDescription}>
              Add a profile picture to make your account more personal
            </p>
            <div style={styles.avatarSection}>
              <AvatarUpload
                currentAvatar={avatarUrl}
                userName={user?.username || user?.email}
                onUpload={handleAvatarUpload}
                size="2xl"
              />
            </div>
          </div>
        );

      case 'overview':
        return (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>How Atlas Network Works</h2>
            <div style={styles.overviewSteps}>
              <div style={styles.overviewStep}>
                <div style={styles.overviewNumber}>1</div>
                <h3 style={styles.overviewStepTitle}>Share Your Link</h3>
                <p style={styles.overviewStepDesc}>
                  Use your unique referral link to invite others to join
                </p>
              </div>
              <div style={styles.overviewStep}>
                <div style={styles.overviewNumber}>2</div>
                <h3 style={styles.overviewStepTitle}>Build Your Network</h3>
                <p style={styles.overviewStepDesc}>
                  As your invites join and grow their networks, you earn commissions
                </p>
              </div>
              <div style={styles.overviewStep}>
                <div style={styles.overviewNumber}>3</div>
                <h3 style={styles.overviewStepTitle}>Track & Withdraw</h3>
                <p style={styles.overviewStepDesc}>
                  Monitor your earnings in real-time and withdraw anytime
                </p>
              </div>
            </div>
          </div>
        );

      case 'goal':
        return (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>Set Your First Goal</h2>
            <p style={styles.stepDescription}>
              Having a goal helps you stay motivated and track progress
            </p>
            <div style={styles.goalForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Goal Type</label>
                <select
                  value={goal.type}
                  onChange={(e) => setGoal({ ...goal, type: e.target.value })}
                  style={styles.select}
                >
                  <option value="earnings">Total Earnings</option>
                  <option value="recruits">Direct Recruits</option>
                  <option value="network_size">Network Size</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Target {goal.type === 'earnings' ? '(USDT)' : '(People)'}
                </label>
                <input
                  type="number"
                  value={goal.target}
                  onChange={(e) => setGoal({ ...goal, target: parseInt(e.target.value) || 0 })}
                  style={styles.input}
                  min="0"
                />
              </div>
            </div>
          </div>
        );

      case 'referral':
        return (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>Your Referral Link</h2>
            <p style={styles.stepDescription}>
              Share this link to start building your network
            </p>
            <div style={styles.referralSection}>
              <div style={styles.referralCode}>
                <code style={styles.code}>{user?.referralCode}</code>
              </div>
              <div style={styles.linkBox}>
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  style={styles.linkInput}
                />
                <button onClick={copyReferralLink} style={styles.copyButton}>
                  Copy
                </button>
              </div>
              <p style={styles.hint}>
                💡 Tip: Share on social media, email, or messaging apps
              </p>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div style={styles.stepContent}>
            <div style={styles.icon}>✅</div>
            <h2 style={styles.stepTitle}>You're All Set!</h2>
            <p style={styles.stepDescription}>
              Your account is ready. Let's explore your dashboard.
            </p>
            <div style={styles.completeSummary}>
              <div style={styles.summaryItem}>
                <span style={styles.summaryIcon}>👤</span>
                <span style={styles.summaryText}>Profile {avatarUrl ? 'completed' : 'created'}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryIcon}>🎯</span>
                <span style={styles.summaryText}>Goal {goal.target > 0 ? 'set' : 'skipped'}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryIcon}>🔗</span>
                <span style={styles.summaryText}>Referral link ready</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const containerStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    backdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 'var(--space-md)'
  };

  const wizardStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-xl)',
    maxWidth: '600px',
    width: '100%',
    padding: 'var(--space-lg)',
    boxShadow: 'var(--shadow-2xl)'
  };

  const progressStyle = {
    marginBottom: 'var(--space-lg)'
  };

  const progressBarBg = {
    height: '4px',
    background: 'var(--bg-tertiary)',
    borderRadius: '2px',
    overflow: 'hidden'
  };

  const progressBarFill = {
    height: '100%',
    background: 'linear-gradient(90deg, var(--primary-gold), var(--accent-green))',
    borderRadius: '2px',
    transition: 'width var(--transition-base)',
    width: `${((currentStep + 1) / steps.length) * 100}%`
  };

  const progressText = {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    marginTop: 'var(--space-xs)',
    textAlign: 'center'
  };

  const actionsStyle = {
    display: 'flex',
    gap: 'var(--space-sm)',
    marginTop: 'var(--space-lg)',
    justifyContent: 'space-between'
  };

  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    cursor: loading ? 'wait' : 'pointer',
    transition: 'all var(--transition-base)',
    border: 'none'
  };

  const buttonPrimaryStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, var(--primary-gold), var(--accent-green))',
    color: '#000'
  };

  const buttonSecondaryStyle = {
    ...buttonStyle,
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)'
  };

  return (
    <div style={containerStyle}>
      <div style={wizardStyle}>
        <div style={progressStyle}>
          <div style={progressBarBg}>
            <div style={progressBarFill} />
          </div>
          <div style={progressText}>
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {renderStepContent()}

        {error && (
          <div style={{
            padding: 'var(--space-sm)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#ef4444',
            fontSize: 'var(--text-sm)',
            marginTop: 'var(--space-md)'
          }}>
            {error}
          </div>
        )}

        <div style={actionsStyle}>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                disabled={loading}
                style={buttonSecondaryStyle}
              >
                Back
              </button>
            )}
            {currentStep < steps.length - 1 && (
              <button
                onClick={handleSkip}
                disabled={loading}
                style={{ ...buttonSecondaryStyle, opacity: 0.7 }}
              >
                Skip Tour
              </button>
            )}
          </div>
          <button
            onClick={handleNext}
            disabled={loading}
            style={buttonPrimaryStyle}
          >
            {loading ? 'Please wait...' : currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  stepContent: {
    minHeight: '300px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  icon: {
    fontSize: '4rem',
    marginBottom: 'var(--space-md)'
  },
  stepTitle: {
    fontSize: 'var(--text-3xl)',
    fontWeight: '700',
    marginBottom: 'var(--space-sm)',
    color: 'var(--text-primary)'
  },
  stepDescription: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-muted)',
    marginBottom: 'var(--space-lg)',
    maxWidth: '400px'
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)',
    width: '100%',
    maxWidth: '400px'
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    padding: 'var(--space-md)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    textAlign: 'left'
  },
  featureIcon: {
    fontSize: '2rem'
  },
  featureText: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-primary)',
    fontWeight: '500'
  },
  avatarSection: {
    marginTop: 'var(--space-lg)'
  },
  overviewSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)',
    width: '100%'
  },
  overviewStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-sm)'
  },
  overviewNumber: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary-gold), var(--accent-green))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--text-xl)',
    fontWeight: '700',
    color: '#000'
  },
  overviewStepTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  overviewStepDesc: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    maxWidth: '300px'
  },
  goalForm: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)',
    textAlign: 'left'
  },
  label: {
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    color: 'var(--text-secondary)'
  },
  select: {
    padding: 'var(--space-sm)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-base)'
  },
  input: {
    padding: 'var(--space-sm)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-base)'
  },
  referralSection: {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)'
  },
  referralCode: {
    padding: 'var(--space-md)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)'
  },
  code: {
    fontSize: 'var(--text-2xl)',
    fontWeight: '700',
    color: 'var(--primary-gold)',
    fontFamily: 'monospace'
  },
  linkBox: {
    display: 'flex',
    gap: 'var(--space-sm)'
  },
  linkInput: {
    flex: 1,
    padding: 'var(--space-sm)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)'
  },
  copyButton: {
    padding: '0 var(--space-md)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-base)'
  },
  hint: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    fontStyle: 'italic'
  },
  completeSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)',
    width: '100%',
    maxWidth: '400px'
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    padding: 'var(--space-md)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    textAlign: 'left'
  },
  summaryIcon: {
    fontSize: '1.5rem'
  },
  summaryText: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-primary)',
    fontWeight: '500'
  }
};

export default OnboardingWizard;
