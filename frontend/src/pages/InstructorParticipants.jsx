import React, { useState, useEffect } from 'react';
import { instructorAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatCurrency, formatDate } from '../utils/formatters';

const InstructorParticipants = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [processingId, setProcessingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    referralCode: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      const response = await instructorAPI.getParticipants({ limit: 1000 });
      setParticipants(response.data.data.participants);
      setError(null);
    } catch (error) {
      console.error('Failed to load participants:', error);
      setError('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.username || !formData.password) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await instructorAPI.addStudent(formData);
      // Reload participants
      await loadParticipants();
      // Reset form
      setFormData({ email: '', username: '', password: '', referralCode: '' });
      setShowAddForm(false);
      alert(`Student ${formData.username} created successfully!`);
    } catch (error) {
      console.error('Add student error:', error);
      alert(error.response?.data?.error || 'Failed to create student account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (participantId, username) => {
    if (!confirm(`Approve ${username}? This will activate their account and distribute commissions to their upline.`)) {
      return;
    }

    setProcessingId(participantId);
    try {
      await instructorAPI.approveParticipant(participantId);
      // Reload participants
      await loadParticipants();
      alert(`${username} has been approved successfully!`);
    } catch (error) {
      console.error('Approval error:', error);
      alert(error.response?.data?.error || 'Failed to approve participant');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (participantId, username) => {
    const reason = prompt(`Reject ${username}? Please provide a reason:`);
    if (!reason) return;

    setProcessingId(participantId);
    try {
      await instructorAPI.rejectParticipant(participantId, { reason });
      // Reload participants
      await loadParticipants();
      alert(`${username} has been rejected.`);
    } catch (error) {
      console.error('Rejection error:', error);
      alert(error.response?.data?.error || 'Failed to reject participant');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = p.username.toLowerCase().includes(search.toLowerCase()) ||
                         p.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.approvalStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = participants.filter(p => p.approvalStatus === 'pending').length;
  const approvedCount = participants.filter(p => p.approvalStatus === 'approved').length;
  const rejectedCount = participants.filter(p => p.approvalStatus === 'rejected').length;

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Loading participants...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <Card>
          <div style={{ padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Error Loading Participants</h2>
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
      pending: { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', text: '⏳ Pending' },
      approved: { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981', text: '✓ Approved' },
      rejected: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', text: '✗ Rejected' }
    };

    const style = styles[status] || styles.approved;

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
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Participants Management</h1>
          <p style={{ color: '#a0aec0' }}>Manage student registrations and approvals</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '0.75rem 1.5rem',
            background: showAddForm ? '#ef4444' : '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'all 0.2s'
          }}
        >
          {showAddForm ? '✗ Cancel' : '+ Add Student'}
        </button>
      </div>

      {/* Add Student Form */}
      {showAddForm && (
        <Card style={{ marginBottom: '2rem', padding: '2rem', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Create New Student Account</h3>
          <p style={{ color: '#a0aec0', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Students added by instructor are automatically approved and can login immediately.
          </p>
          <form onSubmit={handleAddStudent}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0', fontSize: '0.875rem' }}>
                  Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="student@example.com"
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
                  Username <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  placeholder="johndoe"
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
                  Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Min. 6 characters"
                  minLength={6}
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
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                  placeholder="Leave empty for no referrer"
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
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.75rem 2rem',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                opacity: submitting ? 0.5 : 1
              }}
            >
              {submitting ? 'Creating...' : 'Create Student Account'}
            </button>
          </form>
        </Card>
      )}

      {/* Stats */}
      <div style={statsStyles}>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#fbbf24' }}>{pendingCount}</div>
          <div style={{ color: '#a0aec0' }}>Pending Approval</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#10b981' }}>{approvedCount}</div>
          <div style={{ color: '#a0aec0' }}>Approved</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#ef4444' }}>{rejectedCount}</div>
          <div style={{ color: '#a0aec0' }}>Rejected</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{participants.length}</div>
          <div style={{ color: '#a0aec0' }}>Total Students</div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '0.75rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem'
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setFilter('all')} style={filterButtonStyle(filter === 'all')}>
              All
            </button>
            <button onClick={() => setFilter('pending')} style={filterButtonStyle(filter === 'pending')}>
              Pending ({pendingCount})
            </button>
            <button onClick={() => setFilter('approved')} style={filterButtonStyle(filter === 'approved')}>
              Approved
            </button>
            <button onClick={() => setFilter('rejected')} style={filterButtonStyle(filter === 'rejected')}>
              Rejected
            </button>
          </div>
        </div>
      </Card>

      {/* Participants Table */}
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Username</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Balance</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Network</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Joined</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#a0aec0' }}>
                    No participants found
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((participant) => (
                  <tr key={participant.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>{participant.username}</td>
                    <td style={{ padding: '1rem', color: '#a0aec0' }}>{participant.email}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {getStatusBadge(participant.approvalStatus)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#fbbf24', fontWeight: '600' }}>
                      {formatCurrency(participant.balance)} USDT
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {participant.directRecruits} / {participant.networkSize}
                    </td>
                    <td style={{ padding: '1rem', color: '#a0aec0', fontSize: '0.875rem' }}>
                      {formatDate(participant.joinedAt)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {participant.approvalStatus === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleApprove(participant.id, participant.username)}
                            disabled={processingId === participant.id}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#10b981',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: processingId === participant.id ? 'not-allowed' : 'pointer',
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              opacity: processingId === participant.id ? 0.5 : 1
                            }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleReject(participant.id, participant.username)}
                            disabled={processingId === participant.id}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: processingId === participant.id ? 'not-allowed' : 'pointer',
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              opacity: processingId === participant.id ? 0.5 : 1
                            }}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
                      {participant.approvalStatus === 'approved' && (
                        <span style={{ color: '#10b981', fontSize: '0.875rem' }}>Active</span>
                      )}
                      {participant.approvalStatus === 'rejected' && (
                        <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>Inactive</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default InstructorParticipants;
