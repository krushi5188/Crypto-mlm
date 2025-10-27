import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/base/Card'
import Button from '../../components/base/Button'
import { adminAPI } from '../../services/api'
import {
  AlertTriangle, Shield, Eye, Ban, Users, DollarSign,
  Activity, Clock, CheckCircle, XCircle, TrendingUp
} from 'lucide-react'

const AdminFraud = () => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    fetchAlerts()
  }, [severityFilter])

  const fetchAlerts = async () => {
    try {
      const response = await adminAPI.getFraudAlerts({ severity: severityFilter })
      // Backend returns: { success, data: { alerts: [...] } }
      const responseData = response.data.data || response.data || {}
      setAlerts(responseData.alerts || responseData || [])
    } catch (error) {
      console.error('Error fetching fraud alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (alertId, action) => {
    try {
      if (action === 'ban') {
        await adminAPI.flagUser(alertId, 'Flagged for suspicious activity')
      } else if (action === 'dismiss') {
        await adminAPI.unflagUser(alertId, 'False positive')
      }
      fetchAlerts()
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const severityConfig = {
    critical: {
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500',
      label: 'Critical',
    },
    high: {
      icon: AlertTriangle,
      color: 'text-orange-400',
      bg: 'bg-orange-500',
      label: 'High',
    },
    medium: {
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500',
      label: 'Medium',
    },
    low: {
      icon: Activity,
      color: 'text-blue-400',
      bg: 'bg-blue-500',
      label: 'Low',
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
    critical: alerts.filter(a => a.severity === 'critical' && a.status === 'open').length,
    high: alerts.filter(a => a.severity === 'high' && a.status === 'open').length,
    medium: alerts.filter(a => a.severity === 'medium' && a.status === 'open').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Fraud Detection
          </h1>
          <p className="text-gray-400">
            Monitor and manage suspicious activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-gray-400 text-sm">Critical Alerts</p>
            </div>
            <p className="text-3xl font-display font-bold text-white">{stats.critical}</p>
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <p className="text-gray-400 text-sm">High Priority</p>
            </div>
            <p className="text-3xl font-display font-bold text-white">{stats.high}</p>
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <p className="text-gray-400 text-sm">Medium Priority</p>
            </div>
            <p className="text-3xl font-display font-bold text-white">{stats.medium}</p>
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-gray-400 text-sm">Resolved</p>
            </div>
            <p className="text-3xl font-display font-bold text-white">{stats.resolved}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card padding="sm">
          <div className="flex gap-2">
            {['all', 'critical', 'high', 'medium', 'low'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSeverityFilter(filter)}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                  severityFilter === filter
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </Card>

        {/* Fraud Alert Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="lg">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-red-500 bg-opacity-20 rounded-lg">
                <Users className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-white font-bold text-2xl mb-1">
                  {alerts.filter(a => a.type === 'multi_account').length}
                </p>
                <p className="text-gray-400 text-sm">Multi-Account Detection</p>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-yellow-500 bg-opacity-20 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-white font-bold text-2xl mb-1">
                  {alerts.filter(a => a.type === 'unusual_transaction').length}
                </p>
                <p className="text-gray-400 text-sm">Unusual Transactions</p>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-orange-500 bg-opacity-20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-white font-bold text-2xl mb-1">
                  {alerts.filter(a => a.type === 'suspicious_pattern').length}
                </p>
                <p className="text-gray-400 text-sm">Suspicious Patterns</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Active Alerts */}
        <Card padding="lg">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Active Alerts ({alerts.filter(a => a.status === 'open').length})
          </h2>

          {alerts.filter(a => a.status === 'open').length > 0 ? (
            <div className="space-y-4">
              {alerts.filter(a => a.status === 'open').map((alert, index) => {
                const config = severityConfig[alert.severity]
                const AlertIcon = config.icon

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10"
                  >
                    <div className="flex items-start gap-4">
                      {/* Alert Icon */}
                      <div className={`p-3 ${config.bg} bg-opacity-20 rounded-lg flex-shrink-0`}>
                        <AlertIcon className={`w-6 h-6 ${config.color}`} />
                      </div>

                      {/* Alert Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-bold text-lg">{alert.title}</h3>
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${config.bg} bg-opacity-20 ${config.color}`}>
                            {config.label}
                          </span>
                        </div>

                        <p className="text-gray-400 text-sm mb-3">{alert.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">User:</span>
                            <span className="text-white">{alert.username}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Activity className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">Type:</span>
                            <span className="text-white">{alert.type.replace('_', ' ')}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">Detected:</span>
                            <span className="text-white">{alert.detectedAt}</span>
                          </div>
                        </div>

                        {/* Evidence */}
                        <div className="p-3 bg-white bg-opacity-5 rounded-lg">
                          <p className="text-gray-400 text-xs mb-2">Evidence:</p>
                          <ul className="text-white text-sm space-y-1">
                            {alert.evidence.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleResolve(alert.id, 'investigate')}
                        >
                          <Eye className="w-4 h-4" />
                          Investigate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResolve(alert.id, 'ban')}
                        >
                          <Ban className="w-4 h-4 text-red-400" />
                          Suspend
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResolve(alert.id, 'dismiss')}
                        >
                          <XCircle className="w-4 h-4 text-gray-400" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No active alerts</p>
              <p className="text-gray-500 text-sm mt-2">
                All systems monitoring normally
              </p>
            </div>
          )}
        </Card>

        {/* Resolved Alerts */}
        {alerts.filter(a => a.status === 'resolved').length > 0 && (
          <Card padding="lg">
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Recently Resolved
            </h2>

            <div className="space-y-3">
              {alerts.filter(a => a.status === 'resolved').slice(0, 5).map((alert, index) => {
                const config = severityConfig[alert.severity]

                return (
                  <div
                    key={alert.id}
                    className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10"
                  >
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{alert.title}</p>
                      <p className="text-gray-400 text-sm">{alert.username} • {alert.resolvedAction}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${config.bg} bg-opacity-20 ${config.color}`}>
                      {config.label}
                    </span>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">{alert.resolvedAt}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Detection Rules */}
        <Card padding="lg">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Active Detection Rules
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: 'Multiple Accounts',
                description: 'Detects users with same IP, device, or payment method',
                status: 'active',
              },
              {
                name: 'Rapid Recruitment',
                description: 'Flags unusual recruitment velocity patterns',
                status: 'active',
              },
              {
                name: 'Transaction Anomalies',
                description: 'Identifies unusual deposit or withdrawal patterns',
                status: 'active',
              },
              {
                name: 'Network Manipulation',
                description: 'Detects artificial network growth attempts',
                status: 'active',
              },
            ].map((rule, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10"
              >
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium mb-1">{rule.name}</p>
                    <p className="text-gray-400 text-sm">{rule.description}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-green-500 bg-opacity-20 text-green-400">
                  {rule.status.charAt(0).toUpperCase() + rule.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default AdminFraud
