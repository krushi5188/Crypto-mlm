import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../components/layout/DashboardLayout'
import Card from '../components/base/Card'
import Button from '../components/base/Button'
import Input from '../components/base/Input'
import { memberAPI } from '../services/api'
import {
  Shield, Bell, Lock, Eye, EyeOff, Check, AlertCircle, Mail, MessageSquare
} from 'lucide-react'

const SettingsPage = () => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeSection, setActiveSection] = useState('security')
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const { user } = useAuth()
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [editingReferral, setEditingReferral] = useState(false)
  const [newReferralCode, setNewReferralCode] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await memberAPI.getSettings()
      setSettings(response.data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validatePassword = () => {
    const newErrors = {}

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    return newErrors
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    const newErrors = validatePassword()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    setSuccess('')

    try {
      await memberAPI.updatePassword(passwordData)
      setSuccess('Password updated successfully')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setErrors({ general: error.response?.data?.error || 'Failed to update password' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleNotificationToggle = async (key) => {
    try {
      await memberAPI.updateSettings({
        notifications: {
          ...settings.notifications,
          [key]: !settings.notifications[key],
        },
      })
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: !prev.notifications[key],
        },
      }))
      setSuccess('Notification settings updated')
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      setErrors({ general: 'Failed to update settings' })
    }
  }

  const handleReferralCodeChange = (e) => {
    setNewReferralCode(e.target.value);
  };

  const handleReferralCodeSubmit = async () => {
    try {
      setSubmitting(true);
      const apiToCall = user.role === 'instructor' ? adminAPI : memberAPI;
      await apiToCall.updateProfile({ referral_code: newReferralCode });
      setSuccess('Referral code updated successfully');
      setEditingReferral(false);
      fetchSettings();
    } catch (error) {
      setErrors({ referral: error.response?.data?.error || 'Failed to update referral code' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-400">
            Manage your account preferences and security
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 flex items-start gap-3"
          >
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-400">{success}</p>
          </motion.div>
        )}

        {/* Error Message */}
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{errors.general}</p>
          </motion.div>
        )}

        {/* Navigation Tabs */}
        <Card padding="sm">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSection('security')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                activeSection === 'security'
                  ? 'bg-white text-black'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Shield className="w-5 h-5" />
              Security
            </button>
            <button
              onClick={() => setActiveSection('notifications')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                activeSection === 'notifications'
                  ? 'bg-white text-black'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Bell className="w-5 h-5" />
              Notifications
            </button>
          </div>
        </Card>

        {/* Security Section */}
        {activeSection === 'security' && (
          <>
            {/* Change Password */}
            <Card padding="lg">
              <h2 className="text-2xl font-display font-bold text-white mb-6">
                Change Password
              </h2>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <Input
                  label="Current Password"
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  error={errors.currentPassword}
                  required
                />

                <Input
                  label="New Password"
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  error={errors.newPassword}
                  required
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  error={errors.confirmPassword}
                  required
                />

                <div className="bg-white bg-opacity-5 rounded-xl p-4 border border-white border-opacity-10">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    <strong className="text-white">Password Requirements:</strong><br />
                    • At least 8 characters long<br />
                    • Mix of letters, numbers, and symbols recommended<br />
                    • Avoid using personal information
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  disabled={submitting}
                >
                  Update Password
                </Button>
              </form>
            </Card>

            {/* Two-Factor Authentication */}
            <Card padding="lg">
              <h2 className="text-2xl font-display font-bold text-white mb-6">
                Two-Factor Authentication
              </h2>

              <div className="flex items-start justify-between p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white bg-opacity-10 rounded-lg">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">2FA Status</p>
                    <p className="text-gray-400 text-sm">
                      {settings?.twoFactorEnabled
                        ? 'Two-factor authentication is enabled'
                        : 'Add an extra layer of security to your account'
                      }
                    </p>
                  </div>
                </div>
                <Button
                  variant={settings?.twoFactorEnabled ? 'secondary' : 'primary'}
                  size="sm"
                >
                  {settings?.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
                </Button>
              </div>
            </Card>

            {/* Security Log */}
            <Card padding="lg">
              <h2 className="text-2xl font-display font-bold text-white mb-6">
                Recent Security Activity
              </h2>

              {settings?.securityLog && settings.securityLog.length > 0 ? (
                <div className="space-y-3">
                  {settings.securityLog.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10"
                    >
                      <div className="p-2 bg-white bg-opacity-10 rounded-lg">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{log.action}</p>
                        <p className="text-gray-400 text-sm">{log.device} • {log.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-xs">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No recent security activity</p>
                </div>
              )}
            </Card>
          </>
        )}

        {/* Referral Code Section (Admin only) */}
        {user.role === 'instructor' && activeSection === 'security' && (
          <Card padding="lg">
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Referral Code
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-2">Your Referral Code</p>
                {editingReferral ? (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      name="referralCode"
                      value={newReferralCode}
                      onChange={handleReferralCodeChange}
                      error={errors.referral}
                    />
                    <Button onClick={handleReferralCodeSubmit} loading={submitting}>
                      Save
                    </Button>
                    <Button variant="secondary" onClick={() => setEditingReferral(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10 text-white font-mono text-lg">
                      {settings?.referralCode}
                    </div>
                    <Button variant="secondary" onClick={() => {
                      setEditingReferral(true);
                      setNewReferralCode(settings?.referralCode);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Notifications Section */}
        {activeSection === 'notifications' && (
          <Card padding="lg">
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Notification Preferences
            </h2>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-start justify-between p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white bg-opacity-10 rounded-lg">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Email Notifications</p>
                    <p className="text-gray-400 text-sm">
                      Receive updates about earnings and network activity
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('email')}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    settings?.notifications?.email
                      ? 'bg-white'
                      : 'bg-white bg-opacity-20'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
                      settings?.notifications?.email
                        ? 'translate-x-6 bg-black'
                        : 'translate-x-1 bg-white'
                    }`}
                  />
                </button>
              </div>

              {/* Withdrawal Notifications */}
              <div className="flex items-start justify-between p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white bg-opacity-10 rounded-lg">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Withdrawal Updates</p>
                    <p className="text-gray-400 text-sm">
                      Get notified when withdrawals are processed
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('withdrawals')}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    settings?.notifications?.withdrawals
                      ? 'bg-white'
                      : 'bg-white bg-opacity-20'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
                      settings?.notifications?.withdrawals
                        ? 'translate-x-6 bg-black'
                        : 'translate-x-1 bg-white'
                    }`}
                  />
                </button>
              </div>

              {/* Network Notifications */}
              <div className="flex items-start justify-between p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white bg-opacity-10 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Network Activity</p>
                    <p className="text-gray-400 text-sm">
                      Alerts when new members join your network
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('network')}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    settings?.notifications?.network
                      ? 'bg-white'
                      : 'bg-white bg-opacity-20'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
                      settings?.notifications?.network
                        ? 'translate-x-6 bg-black'
                        : 'translate-x-1 bg-white'
                    }`}
                  />
                </button>
              </div>

              {/* Marketing Notifications */}
              <div className="flex items-start justify-between p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white bg-opacity-10 rounded-lg">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Promotional Updates</p>
                    <p className="text-gray-400 text-sm">
                      Receive news about platform updates and features
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('marketing')}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    settings?.notifications?.marketing
                      ? 'bg-white'
                      : 'bg-white bg-opacity-20'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
                      settings?.notifications?.marketing
                        ? 'translate-x-6 bg-black'
                        : 'translate-x-1 bg-white'
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default SettingsPage
