import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../components/layout/DashboardLayout'
import Card from '../components/base/Card'
import Button from '../components/base/Button'
import Input from '../components/base/Input'
import { memberAPI } from '../services/api'
import { Wallet, Plus, Trash2, Check, AlertCircle, Shield, Copy } from 'lucide-react'

const WalletsPage = () => {
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    address: '',
    label: '',
  })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    fetchWallets()
  }, [])

  const fetchWallets = async () => {
    try {
      const response = await memberAPI.getWallets()
      setWallets(response.data)
    } catch (error) {
      console.error('Error fetching wallets:', error)
    } finally {
      setLoading(false)
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

    if (!formData.address) {
      newErrors.address = 'Wallet address is required'
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.address)) {
      newErrors.address = 'Invalid wallet address format'
    }

    if (!formData.label) {
      newErrors.label = 'Label is required'
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
      await memberAPI.addWallet(formData)
      setSuccess('Wallet added successfully')
      setFormData({ address: '', label: '' })
      setShowAddForm(false)
      fetchWallets()
    } catch (error) {
      setErrors({ general: error.response?.data?.error || 'Failed to add wallet' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (walletId) => {
    if (!confirm('Are you sure you want to remove this wallet?')) return

    try {
      await memberAPI.deleteWallet(walletId)
      setSuccess('Wallet removed successfully')
      fetchWallets()
    } catch (error) {
      setErrors({ general: error.response?.data?.error || 'Failed to remove wallet' })
    }
  }

  const copyToClipboard = (address, id) => {
    navigator.clipboard.writeText(address)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-2">
              My Wallets
            </h1>
            <p className="text-gray-400">
              Manage your USDT wallet addresses for withdrawals
            </p>
          </div>

          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="primary"
          >
            <Plus className="w-5 h-5" />
            Add Wallet
          </Button>
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

        {/* Add Wallet Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card padding="lg">
              <h2 className="text-2xl font-display font-bold text-white mb-6">
                Add New Wallet
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Wallet Label"
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  error={errors.label}
                  required
                  placeholder="e.g., Main Wallet, Binance Wallet"
                />

                <Input
                  label="USDT Wallet Address"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                  required
                  placeholder="0x..."
                />

                <div className="bg-blue-500 bg-opacity-10 rounded-xl p-4 border border-blue-500 border-opacity-30">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-400 font-medium mb-1">Important</p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        • Double-check your wallet address before adding<br />
                        • Only add addresses you control<br />
                        • USDT (TRC20 or ERC20) addresses only<br />
                        • Wrong address may result in permanent loss of funds
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={submitting}
                    disabled={submitting}
                  >
                    Add Wallet
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowAddForm(false)
                      setFormData({ address: '', label: '' })
                      setErrors({})
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Saved Wallets */}
        <Card padding="lg">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Saved Wallets
          </h2>

          {wallets.length > 0 ? (
            <div className="space-y-4">
              {wallets.map((wallet, index) => (
                <motion.div
                  key={wallet.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10"
                >
                  <div className={`p-3 rounded-lg ${
                    wallet.isDefault
                      ? 'bg-green-500 bg-opacity-20'
                      : 'bg-white bg-opacity-10'
                  }`}>
                    <Wallet className={`w-6 h-6 ${
                      wallet.isDefault ? 'text-green-400' : 'text-white'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium">{wallet.label}</p>
                      {wallet.isDefault && (
                        <span className="px-2 py-0.5 bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30 rounded text-xs text-green-400 font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-400 text-sm font-mono truncate">
                        {wallet.address}
                      </p>
                      <button
                        onClick={() => copyToClipboard(wallet.address, wallet.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {copiedId === wallet.id ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      Added {wallet.addedDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!wallet.isDefault && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDelete(wallet.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No wallets added yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Add a wallet address to receive withdrawals
              </p>
            </div>
          )}
        </Card>

        {/* Security Notice */}
        <Card padding="lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-500 bg-opacity-20 rounded-lg">
              <Shield className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-2">
                Security Best Practices
              </h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Always verify your wallet address is correct before submitting</li>
                <li>• Use a secure wallet that you control (hardware wallet recommended)</li>
                <li>• Never share your private keys or seed phrases</li>
                <li>• Enable 2FA on your wallet for additional security</li>
                <li>• We will never ask for your private keys</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default WalletsPage
