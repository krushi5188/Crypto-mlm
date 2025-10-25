import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Send, Pause, Play, Trash2, ChevronDown, ChevronUp, 
  Target, Users, Calendar, Plus, BarChart3, Eye, Check, MousePointer
} from 'lucide-react';
import { instructorAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import AnimatedNumber from '../components/AnimatedNumber';
import { 
  pageVariants, 
  pageTransition, 
  containerVariants, 
  itemVariants,
  fadeInUp 
} from '../utils/animations';
import { formatDateTime } from '../utils/formatters';

const InstructorCampaigns = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignStats, setCampaignStats] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    campaign_type: 'one_time',
    target_audience: 'all',
    subject: '',
    email_template: '',
    status: 'draft',
    schedule_at: '',
    trigger_event: '',
    trigger_delay_hours: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [executingCampaign, setExecutingCampaign] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await instructorAPI.getCampaigns({ limit: 100 });
      setCampaigns(response.data.data.campaigns);
      setError(null);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      setError('Failed to load campaigns');
      showError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignStats = async (campaignId) => {
    try {
      const response = await instructorAPI.getCampaignStats(campaignId);
      setCampaignStats(prev => ({
        ...prev,
        [campaignId]: response.data.data.stats
      }));
    } catch (error) {
      console.error('Failed to load campaign stats:', error);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.subject || !formData.email_template) {
      showError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      await instructorAPI.createCampaign(formData);
      await loadCampaigns();
      setFormData({
        name: '',
        campaign_type: 'one_time',
        target_audience: 'all',
        subject: '',
        email_template: '',
        status: 'draft',
        schedule_at: '',
        trigger_event: '',
        trigger_delay_hours: 0
      });
      setShowCreateModal(false);
      showSuccess(`Campaign "${formData.name}" created successfully!`);
    } catch (error) {
      console.error('Create campaign error:', error);
      showError(error.response?.data?.error || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteCampaign = async (campaign) => {
    setExecutingCampaign(campaign.id);
    try {
      const response = await instructorAPI.executeCampaign(campaign.id);
      const result = response.data.data;
      await loadCampaigns();
      showSuccess(`Campaign executed: ${result.successCount} sent, ${result.failCount} failed`);
    } catch (error) {
      console.error('Execute campaign error:', error);
      showError(error.response?.data?.error || 'Failed to execute campaign');
    } finally {
      setExecutingCampaign(null);
    }
  };

  const handleUpdateStatus = async (campaignId, newStatus) => {
    try {
      await instructorAPI.updateCampaignStatus(campaignId, newStatus);
      await loadCampaigns();
      showSuccess(`Campaign status updated to ${newStatus}`);
    } catch (error) {
      console.error('Update status error:', error);
      showError(error.response?.data?.error || 'Failed to update campaign status');
    }
  };

  const handleDeleteCampaign = async () => {
    if (!deleteTarget) return;

    try {
      await instructorAPI.deleteCampaign(deleteTarget.id);
      await loadCampaigns();
      setShowDeleteModal(false);
      setDeleteTarget(null);
      showSuccess(`Campaign "${deleteTarget.name}" deleted successfully`);
    } catch (error) {
      console.error('Delete campaign error:', error);
      showError(error.response?.data?.error || 'Failed to delete campaign');
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const toggleCampaignDetails = async (campaign) => {
    if (selectedCampaign?.id === campaign.id) {
      setSelectedCampaign(null);
    } else {
      setSelectedCampaign(campaign);
      if (!campaignStats[campaign.id]) {
        await loadCampaignStats(campaign.id);
      }
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      draft: { icon: Mail, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', label: 'Draft' },
      active: { icon: Check, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Active' },
      paused: { icon: Pause, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Paused' },
      completed: { icon: Check, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Completed' }
    };
    return configs[status] || configs.draft;
  };

  const getCampaignTypeConfig = (type) => {
    const configs = {
      one_time: { icon: Mail, label: 'One-Time', color: 'text-blue-400' },
      drip: { icon: Send, label: 'Drip', color: 'text-cyan-400' },
      recurring: { icon: Play, label: 'Recurring', color: 'text-purple-400' },
      behavioral: { icon: Target, label: 'Behavioral', color: 'text-orange-400' }
    };
    return configs[type] || configs.one_time;
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesType = typeFilter === 'all' || c.campaign_type === typeFilter;
    return matchesStatus && matchesType;
  });

  const statusCounts = {
    draft: campaigns.filter(c => c.status === 'draft').length,
    active: campaigns.filter(c => c.status === 'active').length,
    paused: campaigns.filter(c => c.status === 'paused').length,
    completed: campaigns.filter(c => c.status === 'completed').length
  };

  const statusTabs = [
    { id: 'all', label: 'All Campaigns', count: campaigns.length },
    { id: 'draft', label: 'Draft', count: statusCounts.draft },
    { id: 'active', label: 'Active', count: statusCounts.active },
    { id: 'paused', label: 'Paused', count: statusCounts.paused },
    { id: 'completed', label: 'Completed', count: statusCounts.completed }
  ];

  const typeTabs = [
    { id: 'all', label: 'All Types' },
    { id: 'one_time', label: 'One-Time' },
    { id: 'drip', label: 'Drip' },
    { id: 'recurring', label: 'Recurring' },
    { id: 'behavioral', label: 'Behavioral' }
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="400px" />
          <LoadingSkeleton variant="text" width="600px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <LoadingSkeleton variant="card" count={4} />
        </div>
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="p-6"
      >
        <Card variant="glass" padding="xl">
          <EmptyState
            icon={Mail}
            title="Error Loading Campaigns"
            description={error}
            actionLabel="Try Again"
            onAction={loadCampaigns}
          />
        </Card>
      </motion.div>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20"
            >
              <Mail className="w-8 h-8 text-blue-400" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-display font-bold">Campaign Management</h1>
              <p className="text-lg text-text-muted">Create and manage email marketing campaigns</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="success"
            icon={<Plus className="w-5 h-5" />}
          >
            Create Campaign
          </Button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        {[
          { label: 'Draft', value: statusCounts.draft, color: 'text-gray-400', bg: 'bg-gray-500/10', icon: Mail },
          { label: 'Active', value: statusCounts.active, color: 'text-green-400', bg: 'bg-green-500/10', icon: Check },
          { label: 'Paused', value: statusCounts.paused, color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Pause },
          { label: 'Completed', value: statusCounts.completed, color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Check }
        ].map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card variant="glass-strong" padding="xl" interactive>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-dimmed mb-2">{stat.label}</p>
                  <p className={`text-5xl font-display font-bold ${stat.color}`}>
                    <AnimatedNumber value={stat.value} />
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`p-4 rounded-2xl ${stat.bg}`}
                >
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </motion.div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <Card variant="glass-strong" padding="none">
          <div className="p-2">
            <div className="text-sm font-semibold text-text-dimmed mb-2 px-4">Status Filter</div>
            <div className="flex gap-2 relative">
              {statusTabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-colors relative z-10 ${
                    statusFilter === tab.id
                      ? 'text-blue-400'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    statusFilter === tab.id
                      ? 'bg-blue-400/20 text-blue-400'
                      : 'bg-glass-medium text-text-dimmed'
                  }`}>
                    {tab.count}
                  </span>
                  {statusFilter === tab.id && (
                    <motion.div
                      layoutId="activeCampaignStatusTab"
                      className="absolute inset-0 bg-blue-400/10 border border-blue-400/30 rounded-xl"
                      style={{ zIndex: -1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </Card>

        <Card variant="glass-strong" padding="none">
          <div className="p-2">
            <div className="text-sm font-semibold text-text-dimmed mb-2 px-4">Type Filter</div>
            <div className="flex gap-2 relative">
              {typeTabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setTypeFilter(tab.id)}
                  className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-colors relative z-10 ${
                    typeFilter === tab.id
                      ? 'text-purple-400'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {tab.label}
                  {typeFilter === tab.id && (
                    <motion.div
                      layoutId="activeCampaignTypeTab"
                      className="absolute inset-0 bg-purple-400/10 border border-purple-400/30 rounded-xl"
                      style={{ zIndex: -1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Campaigns List */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filteredCampaigns.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No Campaigns Found"
            description={
              campaigns.length === 0
                ? "Create your first campaign to start engaging with your network"
                : "No campaigns match your current filters"
            }
            actionLabel="Create Campaign"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          filteredCampaigns.map((campaign, index) => {
            const statusConfig = getStatusConfig(campaign.status);
            const typeConfig = getCampaignTypeConfig(campaign.campaign_type);
            const StatusIcon = statusConfig.icon;
            const TypeIcon = typeConfig.icon;
            const isExpanded = selectedCampaign?.id === campaign.id;
            const stats = campaignStats[campaign.id];

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card variant="glass-strong" padding="xl" interactive>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-xl ${statusConfig.bg}`}>
                          <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                        </div>
                        <h3 className="text-2xl font-semibold">{campaign.name}</h3>
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>

                      <p className="text-text-muted mb-3">
                        <strong>Subject:</strong> {campaign.subject}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-text-dimmed">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className="capitalize">{campaign.target_audience.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TypeIcon className="w-4 h-4" />
                          <span className="capitalize">{campaign.campaign_type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDateTime(campaign.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {campaign.status === 'draft' && (
                        <Button
                          onClick={() => handleUpdateStatus(campaign.id, 'active')}
                          variant="success"
                          size="sm"
                          icon={<Play className="w-4 h-4" />}
                        >
                          Activate
                        </Button>
                      )}

                      {campaign.status === 'active' && (
                        <>
                          {campaign.campaign_type === 'one_time' && (
                            <Button
                              onClick={() => handleExecuteCampaign(campaign)}
                              disabled={executingCampaign === campaign.id}
                              variant="primary"
                              size="sm"
                              icon={<Send className="w-4 h-4" />}
                            >
                              {executingCampaign === campaign.id ? 'Sending...' : 'Execute'}
                            </Button>
                          )}
                          <Button
                            onClick={() => handleUpdateStatus(campaign.id, 'paused')}
                            variant="outline"
                            size="sm"
                            icon={<Pause className="w-4 h-4" />}
                            className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                          >
                            Pause
                          </Button>
                        </>
                      )}

                      {campaign.status === 'paused' && (
                        <Button
                          onClick={() => handleUpdateStatus(campaign.id, 'active')}
                          variant="success"
                          size="sm"
                          icon={<Play className="w-4 h-4" />}
                        >
                          Resume
                        </Button>
                      )}

                      <Button
                        onClick={() => toggleCampaignDetails(campaign)}
                        variant="ghost"
                        size="sm"
                        icon={isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      >
                        {isExpanded ? 'Hide' : 'Details'}
                      </Button>

                      <Button
                        onClick={() => {
                          setDeleteTarget(campaign);
                          setShowDeleteModal(true);
                        }}
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4" />}
                      />
                    </div>
                  </div>

                  {/* Campaign Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 pt-6 border-t border-glass-border"
                      >
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 mb-4">
                            <BarChart3 className="w-5 h-5 text-blue-400" />
                            <h4 className="text-xl font-semibold">Campaign Statistics</h4>
                          </div>

                          {stats ? (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <Card variant="glass-medium" padding="lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Send className="w-4 h-4 text-blue-400" />
                                  <span className="text-sm text-text-dimmed">Total Sent</span>
                                </div>
                                <div className="text-3xl font-display font-bold text-blue-400">
                                  {stats.total_sent || 0}
                                </div>
                              </Card>

                              <Card variant="glass-medium" padding="lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Eye className="w-4 h-4 text-green-400" />
                                  <span className="text-sm text-text-dimmed">Opened</span>
                                </div>
                                <div className="text-3xl font-display font-bold text-green-400">
                                  {stats.total_opened || 0}
                                </div>
                                <div className="text-xs text-text-dimmed mt-1">
                                  {stats.open_rate || 0}% rate
                                </div>
                              </Card>

                              <Card variant="glass-medium" padding="lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <MousePointer className="w-4 h-4 text-yellow-400" />
                                  <span className="text-sm text-text-dimmed">Clicked</span>
                                </div>
                                <div className="text-3xl font-display font-bold text-yellow-400">
                                  {stats.total_clicked || 0}
                                </div>
                                <div className="text-xs text-text-dimmed mt-1">
                                  {stats.click_rate || 0}% rate
                                </div>
                              </Card>

                              <Card variant="glass-medium" padding="lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Check className="w-4 h-4 text-purple-400" />
                                  <span className="text-sm text-text-dimmed">Converted</span>
                                </div>
                                <div className="text-3xl font-display font-bold text-purple-400">
                                  {stats.total_converted || 0}
                                </div>
                                <div className="text-xs text-text-dimmed mt-1">
                                  {stats.conversion_rate || 0}% rate
                                </div>
                              </Card>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-text-muted">
                              Loading statistics...
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <Mail className="w-5 h-5 text-gold-400" />
                              <h4 className="text-lg font-semibold">Email Template</h4>
                            </div>
                            <Card variant="glass-medium" padding="lg">
                              <pre className="text-sm text-text-muted whitespace-pre-wrap font-mono">
                                {campaign.email_template}
                              </pre>
                            </Card>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Create Campaign Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({
            name: '',
            campaign_type: 'one_time',
            target_audience: 'all',
            subject: '',
            email_template: '',
            status: 'draft',
            schedule_at: '',
            trigger_event: '',
            trigger_delay_hours: 0
          });
        }}
        title="Create New Campaign"
        size="lg"
      >
        <form onSubmit={handleCreateCampaign} className="space-y-6">
          <Card variant="glass-medium" padding="lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                label="Campaign Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Welcome Series"
                required
                icon={<Mail className="w-5 h-5" />}
              />

              <Input
                type="select"
                label="Campaign Type"
                value={formData.campaign_type}
                onChange={(e) => setFormData({ ...formData, campaign_type: e.target.value })}
                required
                icon={<Send className="w-5 h-5" />}
              >
                <option value="one_time">One-Time Broadcast</option>
                <option value="drip">Drip Sequence</option>
                <option value="recurring">Recurring</option>
                <option value="behavioral">Behavioral Trigger</option>
              </Input>

              <Input
                type="select"
                label="Target Audience"
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                required
                icon={<Users className="w-5 h-5" />}
              >
                <option value="all">All Users</option>
                <option value="new_users">New Users (last 7 days)</option>
                <option value="active">Active Users</option>
                <option value="inactive">Inactive Users</option>
                <option value="high_earners">High Earners (Top 20%)</option>
              </Input>

              <Input
                type="select"
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </Input>
            </div>

            {formData.campaign_type === 'behavioral' && (
              <div className="mt-4">
                <Input
                  type="select"
                  label="Trigger Event"
                  value={formData.trigger_event}
                  onChange={(e) => setFormData({ ...formData, trigger_event: e.target.value })}
                  icon={<Target className="w-5 h-5" />}
                >
                  <option value="">Select trigger event</option>
                  <option value="user_registration">User Registration</option>
                  <option value="first_commission">First Commission Earned</option>
                  <option value="goal_completed">Goal Completed</option>
                  <option value="withdrawal_processed">Withdrawal Processed</option>
                  <option value="milestone_reached">Milestone Reached</option>
                </Input>
              </div>
            )}

            {formData.campaign_type === 'one_time' && (
              <div className="mt-4">
                <Input
                  type="datetime-local"
                  label="Schedule Send Time (Optional)"
                  value={formData.schedule_at}
                  onChange={(e) => setFormData({ ...formData, schedule_at: e.target.value })}
                  icon={<Calendar className="w-5 h-5" />}
                />
              </div>
            )}

            <div className="mt-4">
              <Input
                type="text"
                label="Email Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Welcome to our platform!"
                required
                icon={<Mail className="w-5 h-5" />}
              />
            </div>

            <div className="mt-4">
              <Input
                type="textarea"
                label="Email Template"
                value={formData.email_template}
                onChange={(e) => setFormData({ ...formData, email_template: e.target.value })}
                placeholder="Use {{username}}, {{balance}}, {{referral_link}} as variables..."
                rows={8}
                required
                helper="Available variables: {{username}}, {{email}}, {{balance}}, {{referral_link}}, {{total_earned}}"
              />
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => setShowCreateModal(false)}
              variant="outline"
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              variant="success"
              fullWidth
              icon={<Plus className="w-5 h-5" />}
            >
              {submitting ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        title="Delete Campaign"
        size="md"
      >
        {deleteTarget && (
          <div className="space-y-6">
            <Card variant="glass-medium" padding="lg" className="border border-red-500/30">
              <p className="text-text-muted leading-relaxed">
                Are you sure you want to delete "<strong>{deleteTarget.name}</strong>"? 
                This action cannot be undone.
              </p>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                variant="outline"
                fullWidth
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteCampaign}
                variant="danger"
                fullWidth
                icon={<Trash2 className="w-5 h-5" />}
              >
                Delete Campaign
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default InstructorCampaigns;
