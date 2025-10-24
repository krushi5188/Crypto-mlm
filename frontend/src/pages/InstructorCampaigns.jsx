import React, { useState, useEffect } from 'react';
import { instructorAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatDateTime } from '../utils/formatters';

const InstructorCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // all, draft, active, paused, completed
  const [typeFilter, setTypeFilter] = useState('all'); // all, one_time, drip, recurring, behavioral
  const [showCreateForm, setShowCreateForm] = useState(false);
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
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [executingCampaign, setExecutingCampaign] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await instructorAPI.getCampaigns({ limit: 100 });
      setCampaigns(response.data.data.campaigns);
      setError(null);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      setError('Failed to load campaigns');
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
      setFormError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

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
      setShowCreateForm(false);
      setFormSuccess(`✓ Campaign "${formData.name}" created successfully!`);
      setTimeout(() => setFormSuccess(''), 5000);
    } catch (error) {
      console.error('Create campaign error:', error);
      setFormError(error.response?.data?.error || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteCampaign = async (campaign) => {
    if (!window.confirm(`Execute campaign "${campaign.name}"? This will send emails to the target audience.`)) {
      return;
    }

    setExecutingCampaign(campaign.id);
    try {
      const response = await instructorAPI.executeCampaign(campaign.id);
      const result = response.data.data;
      await loadCampaigns();
      setFormSuccess(`✓ Campaign executed: ${result.successCount} sent, ${result.failCount} failed`);
      setTimeout(() => setFormSuccess(''), 5000);
    } catch (error) {
      console.error('Execute campaign error:', error);
      setFormError(error.response?.data?.error || 'Failed to execute campaign');
      setTimeout(() => setFormError(''), 5000);
    } finally {
      setExecutingCampaign(null);
    }
  };

  const handleUpdateStatus = async (campaignId, newStatus) => {
    try {
      await instructorAPI.updateCampaignStatus(campaignId, newStatus);
      await loadCampaigns();
      setFormSuccess(`✓ Campaign status updated to ${newStatus}`);
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (error) {
      console.error('Update status error:', error);
      setFormError(error.response?.data?.error || 'Failed to update campaign status');
      setTimeout(() => setFormError(''), 5000);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!deleteTarget) return;

    try {
      await instructorAPI.deleteCampaign(deleteTarget.id);
      await loadCampaigns();
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setFormSuccess(`✓ Campaign "${deleteTarget.name}" deleted successfully`);
      setTimeout(() => setFormSuccess(''), 5000);
    } catch (error) {
      console.error('Delete campaign error:', error);
      setFormError(error.response?.data?.error || 'Failed to delete campaign');
      setTimeout(() => setFormError(''), 5000);
      setShowDeleteConfirm(false);
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

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Loading campaigns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <Card>
          <div style={{ padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Error Loading Campaigns</h2>
            <p style={{ color: '#a0aec0', marginBottom: '1.5rem' }}>{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  const containerStyles = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem'
  };

  const statsStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem'
  };

  const filterButtonStyle = (isActive) => ({
    padding: '0.5rem 1rem',
    background: isActive ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)',
    color: isActive ? '#1a1a1a' : '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s'
  });

  const getStatusBadge = (status) => {
    const styles = {
      draft: { bg: 'rgba(163, 163, 163, 0.2)', color: '#a3a3a3', text: '📝 Draft' },
      active: { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981', text: '✓ Active' },
      paused: { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', text: '⏸ Paused' },
      completed: { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', text: '✓ Completed' }
    };

    const style = styles[status] || styles.draft;

    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.875rem',
        fontWeight: '600',
        background: style.bg,
        color: style.color
      }}>
        {style.text}
      </span>
    );
  };

  const getCampaignTypeIcon = (type) => {
    const icons = {
      one_time: '📧',
      drip: '💧',
      recurring: '🔄',
      behavioral: '🎯'
    };
    return icons[type] || '📧';
  };

  return (
    <div style={containerStyles}>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-xl)',
            maxWidth: '500px',
            width: '100%',
            border: '2px solid #ef4444',
            boxShadow: 'var(--shadow-2xl)'
          }}>
            <h3 style={{
              fontSize: 'var(--text-2xl)',
              marginBottom: 'var(--space-md)',
              color: '#ef4444'
            }}>
              Delete Campaign
            </h3>
            <p style={{
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-xl)',
              lineHeight: '1.6'
            }}>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteCampaign}
                variant="danger"
              >
                Delete Campaign
              </Button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Campaign Management</h1>
          <p style={{ color: '#a0aec0' }}>Create and manage email marketing campaigns</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '0.75rem 1.5rem',
            background: showCreateForm ? '#ef4444' : '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'all 0.2s'
          }}
        >
          {showCreateForm ? '✗ Cancel' : '+ Create Campaign'}
        </button>
      </div>

      {/* Success Message */}
      {formSuccess && (
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
          <span>{formSuccess}</span>
          <button onClick={() => setFormSuccess('')} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>
      )}

      {/* Error Message */}
      {formError && (
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
          <span>{formError}</span>
          <button onClick={() => setFormError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>
      )}

      {/* Create Campaign Form */}
      {showCreateForm && (
        <Card style={{ marginBottom: '2rem', padding: '2rem', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Create New Campaign</h3>
          <p style={{ color: '#a0aec0', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Configure your email campaign settings and target audience.
          </p>

          <form onSubmit={handleCreateCampaign}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0', fontSize: '0.875rem', fontWeight: '600' }}>
                  Campaign Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Welcome Series"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0', fontSize: '0.875rem', fontWeight: '600' }}>
                  Campaign Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.campaign_type}
                  onChange={(e) => setFormData({ ...formData, campaign_type: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                >
                  <option value="one_time">One-Time Broadcast</option>
                  <option value="drip">Drip Sequence</option>
                  <option value="recurring">Recurring</option>
                  <option value="behavioral">Behavioral Trigger</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0', fontSize: '0.875rem', fontWeight: '600' }}>
                  Target Audience <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                >
                  <option value="all">All Users</option>
                  <option value="new_users">New Users (last 7 days)</option>
                  <option value="active">Active Users</option>
                  <option value="inactive">Inactive Users</option>
                  <option value="high_earners">High Earners (Top 20%)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0', fontSize: '0.875rem', fontWeight: '600' }}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>

            {formData.campaign_type === 'behavioral' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0', fontSize: '0.875rem', fontWeight: '600' }}>
                  Trigger Event
                </label>
                <select
                  value={formData.trigger_event}
                  onChange={(e) => setFormData({ ...formData, trigger_event: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select trigger event</option>
                  <option value="user_registration">User Registration</option>
                  <option value="first_commission">First Commission Earned</option>
                  <option value="goal_completed">Goal Completed</option>
                  <option value="withdrawal_processed">Withdrawal Processed</option>
                  <option value="milestone_reached">Milestone Reached</option>
                </select>
              </div>
            )}

            {formData.campaign_type === 'one_time' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0', fontSize: '0.875rem', fontWeight: '600' }}>
                  Schedule Send Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.schedule_at}
                  onChange={(e) => setFormData({ ...formData, schedule_at: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0', fontSize: '0.875rem', fontWeight: '600' }}>
                Email Subject <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                placeholder="e.g., Welcome to our platform!"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0', fontSize: '0.875rem', fontWeight: '600' }}>
                Email Template <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={formData.email_template}
                onChange={(e) => setFormData({ ...formData, email_template: e.target.value })}
                required
                placeholder="Use {{username}}, {{balance}}, {{referral_link}} as variables..."
                rows={8}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#a0aec0' }}>
                Available variables: {'{{username}}, {{email}}, {{balance}}, {{referral_link}}, {{total_earned}}'}
              </div>
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Campaign'}
            </Button>
          </form>
        </Card>
      )}

      {/* Stats */}
      <div style={statsStyles}>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#a3a3a3' }}>{statusCounts.draft}</div>
          <div style={{ color: '#a0aec0' }}>Draft</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#10b981' }}>{statusCounts.active}</div>
          <div style={{ color: '#a0aec0' }}>Active</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#fbbf24' }}>{statusCounts.paused}</div>
          <div style={{ color: '#a0aec0' }}>Paused</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#3b82f6' }}>{statusCounts.completed}</div>
          <div style={{ color: '#a0aec0' }}>Completed</div>
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem', fontWeight: '600' }}>
              Status Filter
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setStatusFilter('all')} style={filterButtonStyle(statusFilter === 'all')}>
                All
              </button>
              <button onClick={() => setStatusFilter('draft')} style={filterButtonStyle(statusFilter === 'draft')}>
                Draft
              </button>
              <button onClick={() => setStatusFilter('active')} style={filterButtonStyle(statusFilter === 'active')}>
                Active
              </button>
              <button onClick={() => setStatusFilter('paused')} style={filterButtonStyle(statusFilter === 'paused')}>
                Paused
              </button>
              <button onClick={() => setStatusFilter('completed')} style={filterButtonStyle(statusFilter === 'completed')}>
                Completed
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem', fontWeight: '600' }}>
              Type Filter
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setTypeFilter('all')} style={filterButtonStyle(typeFilter === 'all')}>
                All
              </button>
              <button onClick={() => setTypeFilter('one_time')} style={filterButtonStyle(typeFilter === 'one_time')}>
                One-Time
              </button>
              <button onClick={() => setTypeFilter('drip')} style={filterButtonStyle(typeFilter === 'drip')}>
                Drip
              </button>
              <button onClick={() => setTypeFilter('recurring')} style={filterButtonStyle(typeFilter === 'recurring')}>
                Recurring
              </button>
              <button onClick={() => setTypeFilter('behavioral')} style={filterButtonStyle(typeFilter === 'behavioral')}>
                Behavioral
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Campaigns List */}
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {filteredCampaigns.length === 0 ? (
          <Card style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📧</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No campaigns found</h3>
            <p style={{ color: '#a0aec0' }}>
              {campaigns.length === 0
                ? 'Create your first campaign to start engaging with your network'
                : 'No campaigns match your current filters'}
            </p>
          </Card>
        ) : (
          filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{getCampaignTypeIcon(campaign.campaign_type)}</span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{campaign.name}</h3>
                    {getStatusBadge(campaign.status)}
                  </div>
                  <div style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <strong>Subject:</strong> {campaign.subject}
                  </div>
                  <div style={{ color: '#a0aec0', fontSize: '0.875rem' }}>
                    <strong>Target:</strong> {campaign.target_audience.replace('_', ' ')} •
                    <strong> Type:</strong> {campaign.campaign_type.replace('_', ' ')} •
                    <strong> Created:</strong> {formatDateTime(campaign.created_at)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {campaign.status === 'draft' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(campaign.id, 'active')}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#10b981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}
                      >
                        Activate
                      </button>
                    </>
                  )}

                  {campaign.status === 'active' && (
                    <>
                      {campaign.campaign_type === 'one_time' && (
                        <button
                          onClick={() => handleExecuteCampaign(campaign)}
                          disabled={executingCampaign === campaign.id}
                          style={{
                            padding: '0.5rem 1rem',
                            background: executingCampaign === campaign.id ? '#6b7280' : '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: executingCampaign === campaign.id ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '0.875rem'
                          }}
                        >
                          {executingCampaign === campaign.id ? 'Sending...' : '📤 Execute'}
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateStatus(campaign.id, 'paused')}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#fbbf24',
                          color: '#1a1a1a',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}
                      >
                        Pause
                      </button>
                    </>
                  )}

                  {campaign.status === 'paused' && (
                    <button
                      onClick={() => handleUpdateStatus(campaign.id, 'active')}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}
                    >
                      Resume
                    </button>
                  )}

                  <button
                    onClick={() => toggleCampaignDetails(campaign)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}
                  >
                    {selectedCampaign?.id === campaign.id ? '▲ Hide' : '▼ Details'}
                  </button>

                  <button
                    onClick={() => {
                      setDeleteTarget(campaign);
                      setShowDeleteConfirm(true);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Campaign Details */}
              {selectedCampaign?.id === campaign.id && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#fbbf24' }}>Campaign Statistics</h4>

                  {campaignStats[campaign.id] ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: '0.25rem' }}>Total Sent</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
                          {campaignStats[campaign.id].total_sent || 0}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: '0.25rem' }}>Opened</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                          {campaignStats[campaign.id].total_opened || 0}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
                          {campaignStats[campaign.id].open_rate || 0}% rate
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: '0.25rem' }}>Clicked</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fbbf24' }}>
                          {campaignStats[campaign.id].total_clicked || 0}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
                          {campaignStats[campaign.id].click_rate || 0}% rate
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: '0.25rem' }}>Converted</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6' }}>
                          {campaignStats[campaign.id].total_converted || 0}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
                          {campaignStats[campaign.id].conversion_rate || 0}% rate
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0' }}>
                      Loading statistics...
                    </div>
                  )}

                  <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#fbbf24' }}>Email Template</h4>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {campaign.email_template}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default InstructorCampaigns;
