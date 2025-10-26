import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../components/layout/DashboardLayout'
import Card from '../components/base/Card'
import Button from '../components/base/Button'
import Input from '../components/base/Input'
import { memberAPI } from '../services/api'
import { Wallet, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const WithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    walletAddress: '',
  })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [withdrawalsRes, dashboardRes] = await Promise.all([
        memberAPI.getWithdrawals(),
        memberAPI.getDashboard(),
      ])
      setWithdrawals(withdrawalsRes.data)
      setBalance(dashboardRes.data.balance)
    } catch (error) {
      console.error('Error fetching data:', error)
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

    if (!formData.amount) {
      newErrors.amount = 'Amount is required'
    } else if (parseFloat(formData.amount) < 10) {
      newErrors.amount = 'Minimum withdrawal is 10 USDT'
    } else if (parseFloat(formData.amount) > balance) {
      newErrors.amount = 'Insufficient balance'
    }

    if (!formData.walletAddress) {
      newErrors.walletAddress = 'Wallet address is required'
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
      await memberAPI.createWithdrawal(formData)
      setSuccess('Withdrawal request submitted successfully')
      setFormData({ amount: '', walletAddress: '' })
      fetchData()
    } catch (error) {
      setErrors({ general: error.response?.data?.error || 'Withdrawal failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const statusIcons = {
    pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500' },
    completed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500' },
    rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500' },
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
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Withdrawals
          </h1>
          <p className="text-gray-400">
            Withdraw your earnings to your USDT wallet
          </p>
        </div>

        {/* Balance Card */}
        <Card padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Available Balance</p>
              <p className="text-4xl font-display font-bold text-white">
                {balance} USDT
              </p>
            </div>
            <div className="p-4 bg-white bg-opacity-10 rounded-xl">
              <Wallet className="w-8 h-8 text-white" />
            </div>
          </div>
        </Card>

        {/* Withdrawal Form */}
        <Card padding="lg">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Request Withdrawal
          </h2>

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-400">{success}</p>
            </motion.div>
          )}

          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{errors.general}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Amount (USDT)"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              error={errors.amount}
              required
              placeholder="Minimum 10 USDT"
            />

            <Input
              label="USDT Wallet Address"
              type="text"
              name="walletAddress"
              value={formData.walletAddress}
              onChange={handleChange}
              error={errors.walletAddress}
              required
              placeholder="0x..."
            />

            <div className="bg-white bg-opacity-5 rounded-xl p-4 border border-white border-opacity-10">
              <p className="text-sm text-gray-300 leading-relaxed">
                • Minimum withdrawal: 10 USDT<br />
                • Processing time: 24-48 hours<br />
                • No withdrawal fees<br />
                • Make sure your wallet address is correct
              </p>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={submitting}
              disabled={submitting || balance < 10}
            >
              Submit Withdrawal Request
            </Button>
          </form>
        </Card>

        {/* Withdrawal History */}
        <Card padding="lg">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Withdrawal History
          </h2>

          {withdrawals.length > 0 ? (
            <div className="space-y-4">
              {withdrawals.map((withdrawal, index) => {
                const StatusIcon = statusIcons[withdrawal.status]
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10"
                  >
                    <div className={`p-3 ${StatusIcon.bg} bg-opacity-20 rounded-lg`}>
                      <StatusIcon.icon className={`w-6 h-6 ${StatusIcon.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{withdrawal.amount} USDT</p>
                      <p className="text-gray-400 text-sm">{withdrawal.walletAddress}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium capitalize ${StatusIcon.color}`}>
                        {withdrawal.status}
                      </p>
                      <p className="text-gray-400 text-xs">{withdrawal.date}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No withdrawal history</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default WithdrawalsPage
