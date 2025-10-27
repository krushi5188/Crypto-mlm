import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/base/Card'
import Button from '../../components/base/Button'
import { adminAPI } from '../../services/api'
import {
  Database, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign,
  Calendar, User, Copy, Check, Search, Filter
} from 'lucide-react'

const AdminDeposits = () => {
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    fetchDeposits()
  }, [statusFilter])

  const fetchDeposits = async () => {
    try {
      const response = await adminAPI.getDeposits({ status: statusFilter })
      // Backend returns: { success, data: { deposits: [...], pagination: {...} } }
      const responseData = response.data.data || response.data || {}
      setDeposits(responseData.deposits || responseData || [])
    } catch (error) {
      console.error('Error fetching deposits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (depositId, newStatus) => {
    try {
      if (newStatus === 'confirmed') {
        await adminAPI.confirmDeposit(depositId)
      } else if (newStatus === 'rejected') {
        await adminAPI.rejectDeposit(depositId, 'Rejected by admin')
      }
      fetchDeposits()
    } catch (error) {
      console.error('Error updating deposit:', error)
    }
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500',
      label: 'Pending',
    },
    confirmed: {
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'bg-green-500',
      label: 'Confirmed',
    },
    rejected: {
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-500',
      label: 'Rejected',
    },
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

  const stats = {
    pending: deposits.filter(d => d.status === 'pending').length,
    confirmed: deposits.filter(d => d.status === 'confirmed').length,
    rejected: deposits.filter(d => d.status === 'rejected').length,
    totalAmount: deposits
      .filter(d => d.status === 'confirmed')
      .reduce((sum, d) => sum + d.amount, 0),
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Deposits Management
          </h1>
          <p className="text-gray-400">
            Review and manage member deposits
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <p className="text-gray-400 text-sm">Pending</p>
            </div>
            <p className="text-3xl font-display font-bold text-white">{stats.pending}</p>
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-gray-400 text-sm">Confirmed</p>
            </div>
            <p className="text-3xl font-display font-bold text-white">{stats.confirmed}</p>
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <p className="text-gray-400 text-sm">Rejected</p>
            </div>
            <p className="text-3xl font-display font-bold text-white">{stats.rejected}</p>
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-white" />
              <p className="text-gray-400 text-sm">Total Volume</p>
            </div>
            <p className="text-3xl font-display font-bold text-white">{stats.totalAmount}</p>
            <p className="text-gray-400 text-xs">USDT</p>
          </Card>
        </div>

        {/* Filters */}
        <Card padding="sm">
          <div className="flex gap-2">
            {['all', 'pending', 'confirmed', 'rejected'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                  statusFilter === filter
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </Card>

        {/* Deposits List */}
        <Card padding="lg">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Deposits ({deposits.length})
          </h2>

          {deposits.length > 0 ? (
            <div className="space-y-4">
              {deposits.map((deposit, index) => {
                const config = statusConfig[deposit.status]
                const StatusIcon = config.icon

                return (
                  <motion.div
                    key={deposit.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10"
                  >
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className={`p-3 ${config.bg} bg-opacity-20 rounded-lg flex-shrink-0`}>
                        <StatusIcon className={`w-6 h-6 ${config.color}`} />
                      </div>

                      {/* Deposit Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-white font-bold text-xl">{deposit.amount} USDT</p>
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${config.bg} bg-opacity-20 ${config.color}`}>
                            {config.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">Member:</span>
                            <span className="text-white">{deposit.username}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">Date:</span>
                            <span className="text-white">{deposit.date}</span>
                          </div>
                        </div>

                        {/* Transaction Hash */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-gray-400 text-sm">TX Hash:</span>
                          <span className="text-white text-sm font-mono truncate">
                            {deposit.txHash}
                          </span>
                          <button
                            onClick={() => copyToClipboard(deposit.txHash, deposit.id)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            {copiedId === deposit.id ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Notes */}
                        {deposit.notes && (
                          <div className="p-3 bg-white bg-opacity-5 rounded-lg">
                            <p className="text-gray-400 text-xs mb-1">Notes:</p>
                            <p className="text-white text-sm">{deposit.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {deposit.status === 'pending' && (
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusUpdate(deposit.id, 'confirmed')}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusUpdate(deposit.id, 'rejected')}
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No deposits found</p>
            </div>
          )}
        </Card>

        {/* Important Notice */}
        <Card padding="lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500 bg-opacity-20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-2">
                Verification Guidelines
              </h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Always verify transaction hash on blockchain explorer before approving</li>
                <li>• Check that deposit amount matches the transaction value</li>
                <li>• Confirm transaction has sufficient confirmations (minimum 6)</li>
                <li>• Report suspicious patterns or duplicate submissions</li>
                <li>• Keep detailed notes for rejected deposits</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default AdminDeposits
