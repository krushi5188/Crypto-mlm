import React, { useState, useEffect } from 'react';
import { memberAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatCurrency } from '../utils/formatters';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MemberAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, insightsRes] = await Promise.all([
        memberAPI.get('/analytics/predictions'),
        memberAPI.get('/analytics/insights')
      ]);

      setAnalytics(analyticsRes.data.data.analytics);
      setInsights(insightsRes.data.data.insights);
      setError(null);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setError(error.response?.data?.error || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      await memberAPI.post('/analytics/recalculate');
      await loadAnalytics();
    } catch (error) {
      console.error('Failed to recalculate:', error);
    } finally {
      setRecalculating(false);
    }
  };

  const getRiskLevelColor = (level) => {
    const colors = {
      low: 'var(--accent-green)',
      medium: '#f59e0b',
      high: '#f97316',
      critical: '#ef4444'
    };
    return colors[level] || colors.low;
  };

  const getInsightIcon = (type) => {
    const icons = {
      warning: '⚠️',
      success: '✅',
      info: 'ℹ️'
    };
    return icons[type] || '📊';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 'var(--space-md)'
      }}>
        <div className="spin" style={{ fontSize: '4rem' }}>📊</div>
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>Loading analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-md)'
      }}>
        <div style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: 'var(--space-lg)' }}>📊</div>
          <h2 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-md)', fontWeight: '600' }}>
            Unable to Load Analytics
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)', fontSize: 'var(--text-lg)' }}>
            {error || 'Unable to load analytics data.'}
          </p>
          <Button onClick={loadAnalytics} size="lg">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Prepare chart data for earnings projection
  const earningsProjectionData = [
    { period: 'Current', value: analytics.avgMonthlyEarnings, type: 'actual' },
    { period: '30 Days', value: analytics.predicted30dEarnings, type: 'predicted' },
    { period: '90 Days', value: analytics.predicted90dEarnings, type: 'predicted' }
  ];

  // Growth rate data
  const growthData = [
    { metric: 'Earnings', rate: analytics.earningsGrowthRate },
    { metric: 'Network', rate: analytics.networkGrowthRate }
  ];

  return (
    <div style={{ padding: 'var(--space-xl) var(--space-md)' }}>
      {/* Hero Section */}
      <div className="container" style={{ marginBottom: 'var(--space-3xl)' }}>
        <div className="fade-in" style={{ maxWidth: '800px', marginBottom: 'var(--space-xl)' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            marginBottom: 'var(--space-md)',
            fontWeight: '700',
            letterSpacing: '-0.02em'
          }}>
            Predictive Analytics
          </h1>
          <p style={{
            fontSize: 'var(--text-xl)',
            color: 'var(--text-muted)',
            lineHeight: '1.6',
            marginBottom: 'var(--space-lg)'
          }}>
            AI-powered insights into your earnings, network growth, and future projections
          </p>
          <Button
            onClick={handleRecalculate}
            disabled={recalculating}
            variant="secondary"
          >
            {recalculating ? '🔄 Recalculating...' : '🔄 Refresh Analytics'}
          </Button>
        </div>
      </div>

      {/* Insights Cards */}
      {insights.length > 0 && (
        <div className="container" style={{ marginBottom: 'var(--space-3xl)' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-xl)', fontWeight: '600' }}>
            Actionable Insights
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
            {insights.map((insight, index) => (
              <Card key={index} className={`fade-in-up delay-${index * 100}`}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
                  <div style={{ fontSize: '2rem' }}>{getInsightIcon(insight.type)}</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-xs)' }}>
                      {insight.title}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-base)', lineHeight: '1.6' }}>
                      {insight.message}
                    </p>
                    {insight.action && (
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ marginTop: 'var(--space-md)', padding: '0' }}
                      >
                        {insight.action} →
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="container" style={{ marginBottom: 'var(--space-3xl)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-xl)'
        }}>
          <Card className="fade-in-up delay-100" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-md)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Activity Score
            </div>
            <div style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              color: analytics.activityScore >= 0.7 ? 'var(--accent-green)' : analytics.activityScore >= 0.4 ? '#f59e0b' : '#ef4444',
              marginBottom: 'var(--space-sm)'
            }}>
              {(analytics.activityScore * 100).toFixed(0)}%
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-dimmed)' }}>
              {analytics.daysActive} days active
            </div>
          </Card>

          <Card className="fade-in-up delay-200" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-md)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Churn Risk
            </div>
            <div style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              color: getRiskLevelColor(analytics.churnRiskLevel),
              marginBottom: 'var(--space-sm)',
              textTransform: 'capitalize'
            }}>
              {analytics.churnRiskLevel}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-dimmed)' }}>
              Score: {(analytics.churnRiskScore * 100).toFixed(0)}%
            </div>
          </Card>

          <Card className="fade-in-up delay-300" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-md)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Avg Daily Earnings
            </div>
            <div style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              color: 'var(--primary-gold)',
              marginBottom: 'var(--space-sm)'
            }}>
              ${analytics.avgDailyEarnings.toFixed(2)}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-dimmed)' }}>
              ${analytics.avgWeeklyEarnings.toFixed(2)}/week
            </div>
          </Card>

          <Card className="fade-in-up delay-400" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-md)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Earnings Growth
            </div>
            <div style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              color: analytics.earningsGrowthRate >= 0 ? 'var(--accent-green)' : '#ef4444',
              marginBottom: 'var(--space-sm)'
            }}>
              {analytics.earningsGrowthRate > 0 ? '+' : ''}{analytics.earningsGrowthRate.toFixed(1)}%
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-dimmed)' }}>
              Last 30 days
            </div>
          </Card>
        </div>
      </div>

      {/* Earnings Projection Chart */}
      <div className="container" style={{ marginBottom: 'var(--space-3xl)' }}>
        <Card className="fade-in-up">
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-lg)', fontWeight: '600' }}>
            Earnings Projection
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={earningsProjectionData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="period" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                formatter={(value) => `$${value.toFixed(2)}`}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#d4af37"
                fillOpacity={1}
                fill="url(#colorValue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-md)', fontSize: 'var(--text-sm)' }}>
              <div>
                <div style={{ color: 'var(--text-dimmed)', marginBottom: 'var(--space-xs)' }}>Current Monthly</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--primary-gold)' }}>
                  ${analytics.avgMonthlyEarnings.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-dimmed)', marginBottom: 'var(--space-xs)' }}>30-Day Forecast</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--accent-green)' }}>
                  ${analytics.predicted30dEarnings.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-dimmed)', marginBottom: 'var(--space-xs)' }}>90-Day Forecast</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--accent-green)' }}>
                  ${analytics.predicted90dEarnings.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Growth Rates Chart */}
      <div className="container" style={{ marginBottom: 'var(--space-3xl)' }}>
        <Card className="fade-in-up delay-100">
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-lg)', fontWeight: '600' }}>
            Growth Rates
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="metric" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                formatter={(value) => `${value.toFixed(1)}%`}
              />
              <Bar dataKey="rate" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Best Recruitment Times */}
      {analytics.bestRecruitmentDay && (
        <div className="container" style={{ marginBottom: 'var(--space-3xl)' }}>
          <Card className="fade-in-up delay-200">
            <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-lg)', fontWeight: '600' }}>
              Optimal Recruitment Times
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-xl)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>📅</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                  Best Day
                </div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '600', color: 'var(--primary-gold)' }}>
                  {analytics.bestRecruitmentDay}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>⏰</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                  Best Hour
                </div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '600', color: 'var(--primary-gold)' }}>
                  {analytics.bestRecruitmentHour}:00
                </div>
              </div>
            </div>
            <div style={{
              marginTop: 'var(--space-xl)',
              padding: 'var(--space-md)',
              background: 'rgba(212, 175, 55, 0.1)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(212, 175, 55, 0.2)'
            }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <strong style={{ color: 'var(--primary-gold)' }}>Tip:</strong> Based on your historical data, you have the best success recruiting on {analytics.bestRecruitmentDay}s around {analytics.bestRecruitmentHour}:00. Try to focus your outreach efforts during these times!
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Additional Stats */}
      <div className="container">
        <Card className="fade-in-up delay-300">
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-lg)', fontWeight: '600' }}>
            Additional Metrics
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                Network Growth Rate
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '600' }}>
                {analytics.networkGrowthRate > 0 ? '+' : ''}{analytics.networkGrowthRate.toFixed(1)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                Predicted 30d Recruits
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '600' }}>
                {analytics.predicted30dRecruits}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                Days Inactive
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '600', color: analytics.daysInactive > 7 ? '#ef4444' : 'var(--accent-green)' }}>
                {analytics.daysInactive}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                Last Updated
              </div>
              <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-dimmed)' }}>
                {new Date(analytics.lastUpdated).toLocaleDateString()}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MemberAnalytics;
