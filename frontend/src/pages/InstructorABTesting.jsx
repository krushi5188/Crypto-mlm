import React, { useState, useEffect } from 'react';
import { instructorAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatDateTime } from '../utils/formatters';

const InstructorABTesting = () => {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [experimentResults, setExperimentResults] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    experiment_type: 'ui_variant',
    variant_a: { description: '' },
    variant_b: { description: '' },
    variant_c: null,
    traffic_a: 50,
    traffic_b: 50,
    traffic_c: 0,
    target_role: 'all',
    primary_metric: 'conversion_rate',
    start_date: '',
    end_date: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [summary, setSummary] = useState({ draft: 0, running: 0, paused: 0, completed: 0, total: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [experimentsRes, summaryRes] = await Promise.all([
        instructorAPI.getExperiments({ limit: 100 }),
        instructorAPI.getExperimentsSummary()
      ]);

      setExperiments(experimentsRes.data.data.experiments);
      setSummary(summaryRes.data.data.summary);
      setError(null);
    } catch (error) {
      console.error('Failed to load experiments:', error);
      setError('Failed to load experiments');
    } finally {
      setLoading(false);
    }
  };

  const loadExperimentResults = async (experimentId) => {
    try {
      const response = await instructorAPI.getExperimentResults(experimentId);
      setExperimentResults(prev => ({
        ...prev,
        [experimentId]: response.data.data.results
      }));
    } catch (error) {
      console.error('Failed to load experiment results:', error);
    }
  };

  const handleCreateExperiment = async (e) => {
    e.preventDefault();

    // Validate traffic allocation
    const totalTraffic = parseInt(formData.traffic_a) + parseInt(formData.traffic_b) + parseInt(formData.traffic_c || 0);
    if (totalTraffic !== 100) {
      setFormError(`Traffic allocation must sum to 100% (currently ${totalTraffic}%)`);
      return;
    }

    if (!formData.name || !formData.primary_metric) {
      setFormError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      await instructorAPI.createExperiment(formData);
      await loadData();
      setFormData({
        name: '',
        description: '',
        experiment_type: 'ui_variant',
        variant_a: { description: '' },
        variant_b: { description: '' },
        variant_c: null,
        traffic_a: 50,
        traffic_b: 50,
        traffic_c: 0,
        target_role: 'all',
        primary_metric: 'conversion_rate',
        start_date: '',
        end_date: ''
      });
      setShowCreateForm(false);
      setFormSuccess(`✓ Experiment "${formData.name}" created successfully!`);
      setTimeout(() => setFormSuccess(''), 5000);
    } catch (error) {
      console.error('Create experiment error:', error);
      setFormError(error.response?.data?.error || 'Failed to create experiment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (experimentId, newStatus) => {
    try {
      await instructorAPI.updateExperimentStatus(experimentId, newStatus);
      await loadData();
      setFormSuccess(`✓ Experiment status updated to ${newStatus}`);
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (error) {
      console.error('Update status error:', error);
      setFormError(error.response?.data?.error || 'Failed to update experiment status');
      setTimeout(() => setFormError(''), 5000);
    }
  };

  const handleSetWinner = async (experimentId, winnerVariant) => {
    if (!window.confirm(`Set variant ${winnerVariant.toUpperCase()} as the winner and complete this experiment?`)) {
      return;
    }

    try {
      await instructorAPI.setExperimentWinner(experimentId, winnerVariant);
      await loadData();
      setFormSuccess(`✓ Winner set to variant ${winnerVariant.toUpperCase()}`);
      setTimeout(() => setFormSuccess(''), 5000);
    } catch (error) {
      console.error('Set winner error:', error);
      setFormError(error.response?.data?.error || 'Failed to set winner');
      setTimeout(() => setFormError(''), 5000);
    }
  };

  const handleDeleteExperiment = async () => {
    if (!deleteTarget) return;

    try {
      await instructorAPI.deleteExperiment(deleteTarget.id);
      await loadData();
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setFormSuccess(`✓ Experiment "${deleteTarget.name}" deleted successfully`);
      setTimeout(() => setFormSuccess(''), 5000);
    } catch (error) {
      console.error('Delete experiment error:', error);
      setFormError(error.response?.data?.error || 'Failed to delete experiment');
      setTimeout(() => setFormError(''), 5000);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const toggleExperimentDetails = async (experiment) => {
    if (selectedExperiment?.id === experiment.id) {
      setSelectedExperiment(null);
    } else {
      setSelectedExperiment(experiment);
      if (!experimentResults[experiment.id]) {
        await loadExperimentResults(experiment.id);
      }
    }
  };

  const filteredExperiments = experiments.filter(e => {
    return statusFilter === 'all' || e.status === statusFilter;
  });

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Loading experiments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <Card>
          <div style={{ padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Error Loading Experiments</h2>
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
      running: { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981', text: '▶️ Running' },
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
              Delete Experiment
            </h3>
            <p style={{
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-xl)',
              lineHeight: '1.6'
            }}>
              Are you sure you want to delete "{deleteTarget?.name}"? This will also delete all assignments and event data.
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
                onClick={handleDeleteExperiment}
                variant="danger"
              >
                Delete Experiment
              </Button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>A/B Testing</h1>
          <p style={{ color: '#a0aec0' }}>Create and manage experiments to optimize user experience</p>
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
          {showCreateForm ? '✗ Cancel' : '+ Create Experiment'}
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

      {/* Create Experiment Form */}
      {showCreateForm && (
        <Card style={{ marginBottom: '2rem', padding: '2rem', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Create New A/B Test</h3>
          <p style={{ color: '#a0aec0', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Configure your experiment to test different variants and measure results.
          </p>

          <form onSubmit={handleCreateExperiment}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0', fontSize: '0.875rem', fontWeight: '600' }}>
                  Experiment Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Button Color Test"
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
                  Experiment Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.experiment_type}
                  onChange={(e) => setFormData({ ...formData, experiment_type: e.target.value })}
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
                  <option value="ui_variant">UI Variant</option>
                  <option value="commission_rate">Commission Rate</option>
                  <option value="message_template">Message Template</option>
                  <option value="feature_toggle">Feature Toggle</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0', fontSize: '0.875rem', fontWeight: '600' }}>
                  Primary Metric <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.primary_metric}
                  onChange={(e) => setFormData({ ...formData, primary_metric: e.target.value })}
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
                  <option value="conversion_rate">Conversion Rate</option>
                  <option value="click_through_rate">Click-Through Rate</option>
                  <option value="earnings">Earnings</option>
                  <option value="retention">Retention</option>
                  <option value="engagement">Engagement</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0', fontSize: '0.875rem', fontWeight: '600' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you're testing and why..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem', color: '#fbbf24' }}>Traffic Allocation</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0', fontSize: '0.875rem' }}>
                    Variant A (Control) %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.traffic_a}
                    onChange={(e) => setFormData({ ...formData, traffic_a: parseInt(e.target.value) || 0 })}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0', fontSize: '0.875rem' }}>
                    Variant B (Treatment) %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.traffic_b}
                    onChange={(e) => setFormData({ ...formData, traffic_b: parseInt(e.target.value) || 0 })}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0', fontSize: '0.875rem' }}>
                    Variant C (Optional) %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.traffic_c}
                    onChange={(e) => setFormData({ ...formData, traffic_c: parseInt(e.target.value) || 0 })}
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
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: formData.traffic_a + formData.traffic_b + formData.traffic_c === 100 ? '#10b981' : '#ef4444' }}>
                Total: {formData.traffic_a + formData.traffic_b + formData.traffic_c}% (must equal 100%)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0', fontSize: '0.875rem', fontWeight: '600' }}>
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
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
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
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
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Experiment'}
            </Button>
          </form>
        </Card>
      )}

      {/* Stats */}
      <div style={statsStyles}>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#a3a3a3' }}>{summary.draft}</div>
          <div style={{ color: '#a0aec0' }}>Draft</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#10b981' }}>{summary.running}</div>
          <div style={{ color: '#a0aec0' }}>Running</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#fbbf24' }}>{summary.paused}</div>
          <div style={{ color: '#a0aec0' }}>Paused</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#3b82f6' }}>{summary.completed}</div>
          <div style={{ color: '#a0aec0' }}>Completed</div>
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setStatusFilter('all')} style={filterButtonStyle(statusFilter === 'all')}>
            All
          </button>
          <button onClick={() => setStatusFilter('draft')} style={filterButtonStyle(statusFilter === 'draft')}>
            Draft
          </button>
          <button onClick={() => setStatusFilter('running')} style={filterButtonStyle(statusFilter === 'running')}>
            Running
          </button>
          <button onClick={() => setStatusFilter('paused')} style={filterButtonStyle(statusFilter === 'paused')}>
            Paused
          </button>
          <button onClick={() => setStatusFilter('completed')} style={filterButtonStyle(statusFilter === 'completed')}>
            Completed
          </button>
        </div>
      </Card>

      {/* Experiments List */}
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {filteredExperiments.length === 0 ? (
          <Card style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧪</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No experiments found</h3>
            <p style={{ color: '#a0aec0' }}>
              {experiments.length === 0
                ? 'Create your first A/B test to start optimizing'
                : 'No experiments match your current filter'}
            </p>
          </Card>
        ) : (
          filteredExperiments.map((experiment) => (
            <Card key={experiment.id} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🧪</span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{experiment.name}</h3>
                    {getStatusBadge(experiment.status)}
                  </div>
                  {experiment.description && (
                    <p style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      {experiment.description}
                    </p>
                  )}
                  <div style={{ color: '#a0aec0', fontSize: '0.875rem' }}>
                    <strong>Type:</strong> {experiment.experiment_type.replace('_', ' ')} •
                    <strong> Metric:</strong> {experiment.primary_metric.replace('_', ' ')} •
                    <strong> Created:</strong> {formatDateTime(experiment.created_at)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {experiment.status === 'draft' && (
                    <button
                      onClick={() => handleUpdateStatus(experiment.id, 'running')}
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
                      Start
                    </button>
                  )}

                  {experiment.status === 'running' && (
                    <button
                      onClick={() => handleUpdateStatus(experiment.id, 'paused')}
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
                  )}

                  {experiment.status === 'paused' && (
                    <button
                      onClick={() => handleUpdateStatus(experiment.id, 'running')}
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
                    onClick={() => toggleExperimentDetails(experiment)}
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
                    {selectedExperiment?.id === experiment.id ? '▲ Hide Results' : '▼ View Results'}
                  </button>

                  <button
                    onClick={() => {
                      setDeleteTarget(experiment);
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

              {/* Experiment Results */}
              {selectedExperiment?.id === experiment.id && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {experimentResults[experiment.id] ? (
                    <>
                      <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#fbbf24' }}>Experiment Results</h4>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        {Object.entries(experimentResults[experiment.id].variants).map(([variantKey, variantData]) => (
                          <div key={variantKey} style={{
                            padding: '1rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            border: experimentResults[experiment.id].winner === variantKey ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            <div style={{ fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem' }}>
                              Variant {variantKey.toUpperCase()}
                              {experimentResults[experiment.id].winner === variantKey && ' 🏆'}
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981', marginBottom: '0.5rem' }}>
                              {variantData.conversionRate}%
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
                              {variantData.users} users • {variantData.conversions} conversions
                            </div>
                          </div>
                        ))}
                      </div>

                      {experimentResults[experiment.id].statisticalSignificance && (
                        <div style={{ marginBottom: '1rem', padding: '1rem', background: experimentResults[experiment.id].isSignificant ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 191, 36, 0.1)', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.875rem', color: experimentResults[experiment.id].isSignificant ? '#10b981' : '#fbbf24' }}>
                            {experimentResults[experiment.id].isSignificant
                              ? `✓ Statistically significant (${experimentResults[experiment.id].confidenceLevel}% confidence, p=${experimentResults[experiment.id].statisticalSignificance})`
                              : '⚠️ Not statistically significant yet - continue running'}
                          </div>
                        </div>
                      )}

                      {experiment.status === 'running' && experimentResults[experiment.id].isSignificant && !experiment.winner_variant && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                          <button
                            onClick={() => handleSetWinner(experiment.id, 'a')}
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
                            Set A as Winner
                          </button>
                          <button
                            onClick={() => handleSetWinner(experiment.id, 'b')}
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
                            Set B as Winner
                          </button>
                          {experimentResults[experiment.id].variants.c && (
                            <button
                              onClick={() => handleSetWinner(experiment.id, 'c')}
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
                              Set C as Winner
                            </button>
                          )}
                          <button
                            onClick={() => handleSetWinner(experiment.id, 'inconclusive')}
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
                            Mark Inconclusive
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0' }}>
                      Loading results...
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default InstructorABTesting;
