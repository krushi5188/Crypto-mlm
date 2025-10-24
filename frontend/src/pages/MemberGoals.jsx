import React, { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatCurrency } from '../utils/formatters';

const StudentGoals = () => {
  const [goals, setGoals] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    goal_type: 'earnings',
    target_value: '',
    target_date: ''
  });

  useEffect(() => {
    loadGoals();
    loadRecommendations();
  }, []);

  const loadGoals = async () => {
    try {
      const response = await studentAPI.getGoals();
      setGoals(response.data.data.goals || []);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await studentAPI.getGoalRecommendations();
      setRecommendations(response.data.data.recommendations || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await studentAPI.createGoal({
        goal_type: formData.goal_type,
        target_value: parseFloat(formData.target_value),
        target_date: formData.target_date || null
      });

      setShowForm(false);
      setFormData({ goal_type: 'earnings', target_value: '', target_date: '' });
      await loadGoals();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create goal');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      await studentAPI.deleteGoal(id);
      await loadGoals();
    } catch (error) {
      alert('Failed to delete goal');
    }
  };

  const useRecommendation = (rec) => {
    setFormData({
      goal_type: rec.goal_type,
      target_value: rec.target_value.toString(),
      target_date: ''
    });
    setShowForm(true);
  };

  const getProgressPercentage = (goal) => {
    const progress = (goal.current_value / goal.target_value) * 100;
    return Math.min(progress, 100);
  };

  const getGoalTypeLabel = (type) => {
    const labels = {
      'earnings': 'Total Earnings',
      'recruits': 'Direct Recruits',
      'network_size': 'Network Size'
    };
    return labels[type] || type;
  };

  const formatGoalValue = (value, type) => {
    if (type === 'earnings') {
      return `${formatCurrency(value)} USDT`;
    }
    return value;
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Loading goals...</p>
      </div>
    );
  }

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Goals</h1>
        <p style={{ color: '#a0aec0' }}>Set and track your performance goals</p>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
            {activeGoals.length}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#a0aec0' }}>
            Active Goals
          </div>
        </Card>

        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
            {completedGoals.length}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#a0aec0' }}>
            Completed Goals
          </div>
        </Card>

        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
            {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
          </div>
          <div style={{ fontSize: '0.875rem', color: '#a0aec0' }}>
            Success Rate
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recommended Goals</h3>
          <p style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Based on your current progress
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recommendations.map((rec, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {rec.reason}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#a0aec0' }}>
                    {getGoalTypeLabel(rec.goal_type)}: {formatGoalValue(rec.target_value, rec.goal_type)}
                  </div>
                </div>
                <button
                  onClick={() => useRecommendation(rec)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#10b981',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}
                >
                  Set Goal
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create Goal Button */}
      {!showForm && (
        <div style={{ marginBottom: '2rem' }}>
          <Button onClick={() => setShowForm(true)} size="lg">
            + Create New Goal
          </Button>
        </div>
      )}

      {/* Goal Form */}
      {showForm && (
        <Card style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Create New Goal</h3>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Goal Type
              </label>
              <select
                value={formData.goal_type}
                onChange={(e) => setFormData(prev => ({ ...prev, goal_type: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              >
                <option value="earnings">Total Earnings (USDT)</option>
                <option value="recruits">Direct Recruits</option>
                <option value="network_size">Network Size</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Target Value
              </label>
              <input
                type="number"
                step={formData.goal_type === 'earnings' ? '0.01' : '1'}
                value={formData.target_value}
                onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
                placeholder="Enter target value..."
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Target Date (Optional)
              </label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button type="submit">Create Goal</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Active Goals</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {activeGoals.map((goal) => {
              const progress = getProgressPercentage(goal);
              return (
                <Card key={goal.id}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                          {getGoalTypeLabel(goal.goal_type)}
                        </h4>
                        <p style={{ color: '#a0aec0', fontSize: '0.875rem' }}>
                          Target: {formatGoalValue(goal.target_value, goal.goal_type)}
                          {goal.target_date && ` by ${new Date(goal.target_date).toLocaleDateString()}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        style={{
                          padding: '0.5rem',
                          background: 'transparent',
                          border: '1px solid rgba(239, 68, 68, 0.5)',
                          color: '#ef4444',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{ color: '#a0aec0' }}>
                        Current: {formatGoalValue(goal.current_value, goal.goal_type)}
                      </span>
                      <span style={{ fontWeight: '600', color: '#10b981' }}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>

                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: progress >= 100
                          ? '#10b981'
                          : progress >= 75
                          ? '#3b82f6'
                          : progress >= 50
                          ? '#f59e0b'
                          : '#ef4444',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Completed Goals 🎉</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {completedGoals.map((goal) => (
              <Card key={goal.id} style={{ opacity: 0.7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      {getGoalTypeLabel(goal.goal_type)}
                    </h4>
                    <p style={{ color: '#a0aec0', fontSize: '0.875rem' }}>
                      Achieved: {formatGoalValue(goal.current_value, goal.goal_type)}
                      {goal.completed_at && ` on ${new Date(goal.completed_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div style={{ fontSize: '2rem' }}>✅</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {goals.length === 0 && !showForm && (
        <Card style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎯</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Goals Yet</h3>
          <p style={{ color: '#a0aec0', marginBottom: '1.5rem' }}>
            Set your first goal to start tracking your progress!
          </p>
          <Button onClick={() => setShowForm(true)}>Create Your First Goal</Button>
        </Card>
      )}
    </div>
  );
};

export default StudentGoals;
