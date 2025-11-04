import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../components/layout/DashboardLayout'
import Card from '../components/base/Card'
import Button from '../components/base/Button'
import Input from '../components/base/Input'
import { useAuth } from '../context/AuthContext'
import { memberAPI, adminAPI } from '../services/api'
import { User, Mail, Calendar, Shield, Edit2, Check, AlertCircle, Copy, Wallet } from 'lucide-react'
import { ethers } from 'ethers'
import api from '../services/api'
import { useAppKit } from '@reown/appkit/react'


const ProfilePage = () => {
  const { user } = useAuth()
  const { open } = useAppKit()
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
  })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const apiToCall = user.role === 'instructor' ? adminAPI : memberAPI;
      const response = await apiToCall.getProfile();
      // Both admin and member responses are nested under `data`
      const profile = response.data.data || response.data;
      setProfileData(profile);
      setFormData({
        username: profile.username,
        email: profile.email,
        fullName: profile.fullName || '',
        joinedDate: profile.joinedDate,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.username) {
      newErrors.username = 'Username is required'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    setSuccess('')

    try {
      await memberAPI.updateProfile(formData)
      setSuccess('Profile updated successfully')
      setEditing(false)
      fetchProfile()
    } catch (error) {
      setErrors({ general: error.response?.data?.error || 'Failed to update profile' })
    } finally {
      setSubmitting(false)
    }
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(profileData?.referralCode || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLinkWallet = async () => {
    try {
      await open();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      // Simple message to sign for verification
      const message = `Link wallet ${walletAddress} to my Atlas Network account.`;
      const signature = await signer.signMessage(message);

      // Send to backend to link
      await memberAPI.updateProfile({ walletAddress, signature, message });
      setSuccess('Wallet linked successfully!');
      fetchProfile(); // Refresh profile data
    } catch (error) {
      setErrors({ general: 'Failed to link wallet. Please try again.' });
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            My Profile
          </h1>
          <p className="text-gray-400">
            Manage your account information
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

        {/* Profile Card */}
        <Card padding="lg">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-white">
              Account Information
            </h2>
            {!editing && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
                required
              />

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
              />

              <Input
                label="Full Name"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
              />

              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  disabled={submitting}
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditing(false)
                    setFormData({
                      username: profileData.username,
                      email: profileData.email,
                      fullName: profileData.fullName || '',
                    })
                    setErrors({})
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl">
                <div className="p-3 bg-white bg-opacity-10 rounded-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Username</p>
                  <p className="text-white font-medium">{profileData?.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl">
                <div className="p-3 bg-white bg-opacity-10 rounded-lg">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white font-medium">{profileData?.email}</p>
                </div>
              </div>

              {profileData?.fullName && (
                <div className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl">
                  <div className="p-3 bg-white bg-opacity-10 rounded-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Full Name</p>
                    <p className="text-white font-medium">{profileData.fullName}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl">
                <div className="p-3 bg-white bg-opacity-10 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Member Since</p>
                  <p className="text-white font-medium">{profileData?.joinedDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl">
                <div className="p-3 bg-white bg-opacity-10 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Account Status</p>
                  <p className="text-green-400 font-medium">Active</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Wallet Information */}
        {profileData?.walletAddress ? (
          <Card padding="lg">
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Wallet Information
            </h2>
            <div className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl">
              <div className="p-3 bg-white bg-opacity-10 rounded-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Linked Wallet</p>
                <p className="text-white font-medium break-all">{profileData.walletAddress}</p>
              </div>
            </div>
          </Card>
        ) : (
          <Card padding="lg">
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Wallet Information
            </h2>
            <div>
              <p className="text-gray-400 mb-4">
                Link your MetaMask wallet to enable signing in without a password.
              </p>
              <Button onClick={handleLinkWallet} icon={<Wallet className="w-5 h-5" />}>
                Link Wallet
              </Button>
            </div>
          </Card>
        )}


        {/* Referral Information */}
        <Card padding="lg">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Referral Information
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-2">Your Referral Code</p>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-3 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10 text-white font-mono text-lg">
                  {profileData?.referralCode}
                </div>
                <Button
                  variant={copied ? 'secondary' : 'primary'}
                  onClick={copyReferralCode}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-2">Your Referral Link</p>
              <div className="px-4 py-3 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10 text-white text-sm break-all">
                {profileData ? `${window.location.origin}/register?ref=${profileData.referralCode}` : ''}
              </div>
            </div>

            {profileData?.referredBy && (
              <div>
                <p className="text-gray-400 text-sm mb-2">Referred By</p>
                <div className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10">
                  <div className="w-10 h-10 bg-white bg-opacity-10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{profileData.referredBy.displayName}</p>
                    <p className="text-gray-400 text-sm">Your upline member</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Account Stats */}
        <Card padding="lg">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Account Statistics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white bg-opacity-5 rounded-xl">
              <p className="text-3xl font-display font-bold text-white mb-1">
                {profileData?.stats?.networkSize || 0}
              </p>
              <p className="text-gray-400 text-sm">Network Size</p>
            </div>

            <div className="text-center p-4 bg-white bg-opacity-5 rounded-xl">
              <p className="text-3xl font-display font-bold text-white mb-1">
                {profileData?.stats?.totalEarned || 0}
              </p>
              <p className="text-gray-400 text-sm">Total Earned (USDT)</p>
            </div>

            <div className="text-center p-4 bg-white bg-opacity-5 rounded-xl">
              <p className="text-3xl font-display font-bold text-white mb-1">
                {profileData?.stats?.withdrawals || 0}
              </p>
              <p className="text-gray-400 text-sm">Withdrawals</p>
            </div>

            <div className="text-center p-4 bg-white bg-opacity-5 rounded-xl">
              <p className="text-3xl font-display font-bold text-white mb-1">
                {profileData?.stats?.daysActive || 0}
              </p>
              <p className="text-gray-400 text-sm">Days Active</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default ProfilePage
