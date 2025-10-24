import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { instructorAPI, systemAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const InstructorConfiguration = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Commission settings
  const [commissionSettings, setCommissionSettings] = useState({
    level_depth: 5,
    level_1_commission: 10,
    level_2_commission: 5,
    level_3_commission: 3,
    level_4_commission: 2,
    level_5_commission: 1
  });

  // Feature toggles
  const [features, setFeatures] = useState({
    maintenance_mode: false,
    registration_enabled: true,
    withdrawals_enabled: true,
    referrals_enabled: true,
    two_factor_required: false
  });

  // Platform settings
  const [platformSettings, setPlatformSettings] = useState({
    platform_name: 'Atlas Network',
    platform_currency: 'USDT',
    min_withdrawal: 10,
    max_participants: 1000,
    registration_fee: 0
  });

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await systemAPI.getConfig();
      const data = response.data.data;

      // Parse commission settings
      setCommissionSettings({
        level_depth: data.level_depth || 5,
        level_1_commission: data.level_1_commission || 10,
        level_2_commission: data.level_2_commission || 5,
        level_3_commission: data.level_3_commission || 3,
        level_4_commission: data.level_4_commission || 2,
        level_5_commission: data.level_5_commission || 1
      });

      // Parse feature toggles
      setFeatures({
        maintenance_mode: data.maintenance_mode === true || data.maintenance_mode === 'true',
        registration_enabled: data.registration_enabled !== false && data.registration_enabled !== 'false',
        withdrawals_enabled: data.withdrawals_enabled !== false && data.withdrawals_enabled !== 'false',
        referrals_enabled: data.referrals_enabled !== false && data.referrals_enabled !== 'false',
        two_factor_required: data.two_factor_required === true || data.two_factor_required === 'true'
      });

      // Parse platform settings
      setPlatformSettings({
        platform_name: data.platform_name || 'Atlas Network',
        platform_currency: data.platform_currency || 'USDT',
        min_withdrawal: parseFloat(data.min_withdrawal) || 10,
        max_participants: parseInt(data.max_participants) || 1000,
        registration_fee: parseFloat(data.registration_fee) || 0
      });

      setConfig(data);
    } catch (error) {
      console.error('Failed to load configuration:', error);
      setErrorMsg(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfiguration = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updates = {
        ...commissionSettings,
        ...features,
        ...platformSettings
      };

      await instructorAPI.updateConfig(updates);
      setSuccessMsg(t('instructor.configuration.configurationSaved'));
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      setErrorMsg(error.response?.data?.error || t('errors.serverError'));
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleCommissionChange = (key, value) => {
    setCommissionSettings({
      ...commissionSettings,
      [key]: parseFloat(value) || 0
    });
  };

  const handleFeatureToggle = (key) => {
    setFeatures({
      ...features,
      [key]: !features[key]
    });
  };

  const handlePlatformSettingChange = (key, value) => {
    setPlatformSettings({
      ...platformSettings,
      [key]: value
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>{t('common.loading')}</p>
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
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          {t('instructor.configuration.title')}
        </h1>
        <p style={{ color: '#a0aec0' }}>
          {t('instructor.configuration.subtitle')}
        </p>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          background: 'rgba(16, 185, 129, 0.2)',
          border: '1px solid #10b981',
          borderRadius: '8px',
          color: '#10b981',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          color: '#ef4444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>
      )}

      {/* Commission Settings */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            ⚙️ {t('instructor.configuration.commissionSettings')}
          </h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <Input
              type="number"
              label={t('instructor.configuration.levelDepth')}
              value={commissionSettings.level_depth}
              onChange={(e) => handleCommissionChange('level_depth', e.target.value)}
              min="1"
              max="10"
              style={{ marginBottom: '0.5rem' }}
            />
            <p style={{ fontSize: '0.875rem', color: '#a0aec0' }}>
              {t('instructor.configuration.levelDepthDesc')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3, 4, 5].map((level) => (
              <div key={level}>
                <Input
                  type="number"
                  label={t('instructor.configuration.levelCommission', { level })}
                  value={commissionSettings[`level_${level}_commission`]}
                  onChange={(e) => handleCommissionChange(`level_${level}_commission`, e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.25rem' }}>
                  {commissionSettings[`level_${level}_commission`]}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Feature Toggles */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            🎛️ {t('instructor.configuration.featureToggles')}
          </h3>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Maintenance Mode */}
            <div style={{
              padding: '1rem',
              background: features.maintenance_mode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${features.maintenance_mode ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  {t('instructor.configuration.maintenanceMode')}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#a0aec0' }}>
                  {t('instructor.configuration.maintenanceModeDesc')}
                </div>
              </div>
              <button
                onClick={() => handleFeatureToggle('maintenance_mode')}
                style={{
                  position: 'relative',
                  width: '60px',
                  height: '32px',
                  background: features.maintenance_mode ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  left: features.maintenance_mode ? '32px' : '4px',
                  width: '24px',
                  height: '24px',
                  background: '#fff',
                  borderRadius: '50%',
                  transition: 'left 0.3s ease'
                }} />
              </button>
            </div>

            {/* Registration Enabled */}
            <div style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  {t('instructor.configuration.registrationEnabled')}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#a0aec0' }}>
                  {t('instructor.configuration.registrationEnabledDesc')}
                </div>
              </div>
              <button
                onClick={() => handleFeatureToggle('registration_enabled')}
                style={{
                  position: 'relative',
                  width: '60px',
                  height: '32px',
                  background: features.registration_enabled ? 'var(--primary-gold)' : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  left: features.registration_enabled ? '32px' : '4px',
                  width: '24px',
                  height: '24px',
                  background: '#fff',
                  borderRadius: '50%',
                  transition: 'left 0.3s ease'
                }} />
              </button>
            </div>

            {/* Withdrawals Enabled */}
            <div style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  {t('instructor.configuration.withdrawalsEnabled')}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#a0aec0' }}>
                  {t('instructor.configuration.withdrawalsEnabledDesc')}
                </div>
              </div>
              <button
                onClick={() => handleFeatureToggle('withdrawals_enabled')}
                style={{
                  position: 'relative',
                  width: '60px',
                  height: '32px',
                  background: features.withdrawals_enabled ? 'var(--primary-gold)' : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  left: features.withdrawals_enabled ? '32px' : '4px',
                  width: '24px',
                  height: '24px',
                  background: '#fff',
                  borderRadius: '50%',
                  transition: 'left 0.3s ease'
                }} />
              </button>
            </div>

            {/* Referrals Enabled */}
            <div style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  {t('instructor.configuration.referralsEnabled')}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#a0aec0' }}>
                  {t('instructor.configuration.referralsEnabledDesc')}
                </div>
              </div>
              <button
                onClick={() => handleFeatureToggle('referrals_enabled')}
                style={{
                  position: 'relative',
                  width: '60px',
                  height: '32px',
                  background: features.referrals_enabled ? 'var(--primary-gold)' : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  left: features.referrals_enabled ? '32px' : '4px',
                  width: '24px',
                  height: '24px',
                  background: '#fff',
                  borderRadius: '50%',
                  transition: 'left 0.3s ease'
                }} />
              </button>
            </div>

            {/* Two Factor Required */}
            <div style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  {t('instructor.configuration.twoFactorRequired')}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#a0aec0' }}>
                  {t('instructor.configuration.twoFactorRequiredDesc')}
                </div>
              </div>
              <button
                onClick={() => handleFeatureToggle('two_factor_required')}
                style={{
                  position: 'relative',
                  width: '60px',
                  height: '32px',
                  background: features.two_factor_required ? 'var(--primary-gold)' : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  left: features.two_factor_required ? '32px' : '4px',
                  width: '24px',
                  height: '24px',
                  background: '#fff',
                  borderRadius: '50%',
                  transition: 'left 0.3s ease'
                }} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Platform Settings */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            🏢 {t('instructor.configuration.platformSettings')}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <Input
              type="text"
              label={t('instructor.configuration.platformName')}
              value={platformSettings.platform_name}
              onChange={(e) => handlePlatformSettingChange('platform_name', e.target.value)}
            />
            <Input
              type="text"
              label={t('instructor.configuration.platformCurrency')}
              value={platformSettings.platform_currency}
              onChange={(e) => handlePlatformSettingChange('platform_currency', e.target.value)}
            />
            <Input
              type="number"
              label={t('instructor.configuration.minWithdrawal')}
              value={platformSettings.min_withdrawal}
              onChange={(e) => handlePlatformSettingChange('min_withdrawal', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
            />
            <Input
              type="number"
              label={t('instructor.configuration.maxParticipants')}
              value={platformSettings.max_participants}
              onChange={(e) => handlePlatformSettingChange('max_participants', parseInt(e.target.value) || 0)}
              min="0"
            />
            <Input
              type="number"
              label={t('instructor.configuration.registrationFee')}
              value={platformSettings.registration_fee}
              onChange={(e) => handlePlatformSettingChange('registration_fee', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <Button
          onClick={handleSaveConfiguration}
          disabled={saving}
          style={{
            background: 'var(--primary-gold)',
            fontSize: '1rem',
            padding: '0.75rem 2rem'
          }}
        >
          {saving ? t('common.loading') : t('instructor.configuration.saveConfiguration')}
        </Button>
      </div>
    </div>
  );
};

export default InstructorConfiguration;
