import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Percent, ToggleLeft, Building, DollarSign, 
  Users, Lock, Power, Shield, Key, AlertTriangle, Save
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { instructorAPI, systemAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { 
  pageVariants, 
  pageTransition, 
  containerVariants, 
  itemVariants,
  fadeInUp 
} from '../utils/animations';

// Custom Toggle Component
const Toggle = ({ enabled, onChange, label, description, icon: Icon, isDanger = false }) => {
  return (
    <Card variant="glass-medium" padding="lg" interactive>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {Icon && (
            <div className={`p-2 rounded-xl ${
              enabled 
                ? isDanger ? 'bg-red-500/10' : 'bg-gold-400/10'
                : 'bg-glass-medium'
            }`}>
              <Icon className={`w-5 h-5 ${
                enabled 
                  ? isDanger ? 'text-red-400' : 'text-gold-400'
                  : 'text-text-dimmed'
              }`} />
            </div>
          )}
          <div className="flex-1">
            <div className="font-semibold mb-1">{label}</div>
            <div className="text-sm text-text-muted">{description}</div>
          </div>
        </div>
        <motion.button
          onClick={onChange}
          className={`relative w-16 h-8 rounded-full transition-colors ${
            enabled 
              ? isDanger ? 'bg-red-500' : 'bg-gold-400'
              : 'bg-glass-medium border border-glass-border'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
            animate={{ left: enabled ? '36px' : '4px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        </motion.button>
      </div>
    </Card>
  );
};

const InstructorConfiguration = () => {
  const { t } = useTranslation();
  const { success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      setLoading(true);
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
    } catch (error) {
      console.error('Failed to load configuration:', error);
      showError(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfiguration = async () => {
    setSaving(true);

    try {
      const updates = {
        ...commissionSettings,
        ...features,
        ...platformSettings
      };

      await instructorAPI.updateConfig(updates);
      showSuccess(t('instructor.configuration.configurationSaved'));
    } catch (error) {
      console.error('Failed to save configuration:', error);
      showError(error.response?.data?.error || t('errors.serverError'));
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
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="400px" />
          <LoadingSkeleton variant="text" width="600px" />
        </div>
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="p-6 space-y-8"
    >
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20"
          >
            <Settings className="w-8 h-8 text-purple-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">
              {t('instructor.configuration.title')}
            </h1>
            <p className="text-lg text-text-muted">
              {t('instructor.configuration.subtitle')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Commission Settings */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass-strong" padding="xl" glow="blue">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Percent className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-semibold">
                {t('instructor.configuration.commissionSettings')}
              </h2>
            </div>

            <Card variant="glass-medium" padding="lg">
              <Input
                type="number"
                label={t('instructor.configuration.levelDepth')}
                value={commissionSettings.level_depth}
                onChange={(e) => handleCommissionChange('level_depth', e.target.value)}
                min="1"
                max="10"
                icon={<Percent className="w-5 h-5" />}
                helper={t('instructor.configuration.levelDepthDesc')}
              />
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5].map((level) => (
                <motion.div
                  key={level}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: level * 0.05 }}
                >
                  <Card variant="glass-medium" padding="lg" interactive>
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                          level === 1 ? 'from-gold-400 to-yellow-500' :
                          level === 2 ? 'from-blue-400 to-cyan-500' :
                          level === 3 ? 'from-purple-400 to-pink-500' :
                          level === 4 ? 'from-green-400 to-emerald-500' :
                          'from-red-400 to-orange-500'
                        } flex items-center justify-center text-white text-sm font-bold`}>
                          {level}
                        </div>
                        <span className="font-semibold text-sm">
                          {t('instructor.configuration.levelCommission', { level })}
                        </span>
                      </div>
                    </div>
                    <Input
                      type="number"
                      value={commissionSettings[`level_${level}_commission`]}
                      onChange={(e) => handleCommissionChange(`level_${level}_commission`, e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      icon={<Percent className="w-4 h-4" />}
                    />
                    <div className="mt-2 text-center">
                      <span className="text-2xl font-display font-bold text-gold-400">
                        {commissionSettings[`level_${level}_commission`]}%
                      </span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Feature Toggles */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        <Card variant="glass-strong" padding="xl" glow="purple">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <ToggleLeft className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-semibold">
                {t('instructor.configuration.featureToggles')}
              </h2>
            </div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Toggle
                  enabled={features.maintenance_mode}
                  onChange={() => handleFeatureToggle('maintenance_mode')}
                  label={t('instructor.configuration.maintenanceMode')}
                  description={t('instructor.configuration.maintenanceModeDesc')}
                  icon={AlertTriangle}
                  isDanger={true}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Toggle
                  enabled={features.registration_enabled}
                  onChange={() => handleFeatureToggle('registration_enabled')}
                  label={t('instructor.configuration.registrationEnabled')}
                  description={t('instructor.configuration.registrationEnabledDesc')}
                  icon={Users}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Toggle
                  enabled={features.withdrawals_enabled}
                  onChange={() => handleFeatureToggle('withdrawals_enabled')}
                  label={t('instructor.configuration.withdrawalsEnabled')}
                  description={t('instructor.configuration.withdrawalsEnabledDesc')}
                  icon={DollarSign}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Toggle
                  enabled={features.referrals_enabled}
                  onChange={() => handleFeatureToggle('referrals_enabled')}
                  label={t('instructor.configuration.referralsEnabled')}
                  description={t('instructor.configuration.referralsEnabledDesc')}
                  icon={Users}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Toggle
                  enabled={features.two_factor_required}
                  onChange={() => handleFeatureToggle('two_factor_required')}
                  label={t('instructor.configuration.twoFactorRequired')}
                  description={t('instructor.configuration.twoFactorRequiredDesc')}
                  icon={Shield}
                />
              </motion.div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Platform Settings */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
      >
        <Card variant="glass-strong" padding="xl" glow="gold">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Building className="w-6 h-6 text-gold-400" />
              <h2 className="text-2xl font-semibold">
                {t('instructor.configuration.platformSettings')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="glass-medium" padding="lg">
                <Input
                  type="text"
                  label={t('instructor.configuration.platformName')}
                  value={platformSettings.platform_name}
                  onChange={(e) => handlePlatformSettingChange('platform_name', e.target.value)}
                  icon={<Building className="w-5 h-5" />}
                />
              </Card>

              <Card variant="glass-medium" padding="lg">
                <Input
                  type="text"
                  label={t('instructor.configuration.platformCurrency')}
                  value={platformSettings.platform_currency}
                  onChange={(e) => handlePlatformSettingChange('platform_currency', e.target.value)}
                  icon={<DollarSign className="w-5 h-5" />}
                />
              </Card>

              <Card variant="glass-medium" padding="lg">
                <Input
                  type="number"
                  label={t('instructor.configuration.minWithdrawal')}
                  value={platformSettings.min_withdrawal}
                  onChange={(e) => handlePlatformSettingChange('min_withdrawal', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  icon={<DollarSign className="w-5 h-5" />}
                />
              </Card>

              <Card variant="glass-medium" padding="lg">
                <Input
                  type="number"
                  label={t('instructor.configuration.maxParticipants')}
                  value={platformSettings.max_participants}
                  onChange={(e) => handlePlatformSettingChange('max_participants', parseInt(e.target.value) || 0)}
                  min="0"
                  icon={<Users className="w-5 h-5" />}
                />
              </Card>

              <Card variant="glass-medium" padding="lg" className="md:col-span-2">
                <Input
                  type="number"
                  label={t('instructor.configuration.registrationFee')}
                  value={platformSettings.registration_fee}
                  onChange={(e) => handlePlatformSettingChange('registration_fee', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  icon={<DollarSign className="w-5 h-5" />}
                />
              </Card>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Save Button */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
        className="flex justify-end"
      >
        <Button
          onClick={handleSaveConfiguration}
          disabled={saving}
          variant="primary"
          size="lg"
          icon={<Save className="w-5 h-5" />}
          className="min-w-[200px]"
        >
          {saving ? t('common.loading') : t('instructor.configuration.saveConfiguration')}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default InstructorConfiguration;
