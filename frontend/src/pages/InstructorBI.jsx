import React, { useState, useEffect } from 'react';
import { instructorAPI } from '../services/api';
import HelpTooltip from '../components/HelpTooltip';

const InstructorBI = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({
    retention: null,
    conversion: null,
    networkDepth: null,
    earningsDistribution: null,
    growthPredictions: null
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [retention, conversion, networkDepth, earnings, growth] = await Promise.all([
        instructorAPI.getBIRetention(),
        instructorAPI.getBIConversion(),
        instructorAPI.getBINetworkDepth(),
        instructorAPI.getBIEarningsDistribution(),
        instructorAPI.getBIGrowthPredictions()
      ]);

      setData({
        retention: retention.data.data,
        conversion: conversion.data.data,
        networkDepth: networkDepth.data.data,
        earningsDistribution: earnings.data.data,
        growthPredictions: growth.data.data
      });
    } catch (err) {
      console.error('Failed to load BI data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}>⏳</div>
          <p style={styles.loadingText}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button onClick={loadAllData} style={styles.retryButton}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Business Intelligence</h1>
        <p style={styles.subtitle}>
          Advanced analytics and insights
          <HelpTooltip content="Track key business metrics including user retention, conversion rates, network depth, earnings distribution, and growth predictions." position="right" maxWidth="250px" />
        </p>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('overview')}
          style={activeTab === 'overview' ? styles.tabActive : styles.tab}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('conversion')}
          style={activeTab === 'conversion' ? styles.tabActive : styles.tab}
        >
          Conversion Funnel
        </button>
        <button
          onClick={() => setActiveTab('network')}
          style={activeTab === 'network' ? styles.tabActive : styles.tab}
        >
          Network Depth
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          style={activeTab === 'earnings' ? styles.tabActive : styles.tab}
        >
          Earnings Distribution
        </button>
        <button
          onClick={() => setActiveTab('growth')}
          style={activeTab === 'growth' ? styles.tabActive : styles.tab}
        >
          Growth Predictions
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {activeTab === 'overview' && (
          <div style={styles.overviewGrid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Conversion Funnel</h3>
              {data.conversion && (
                <div style={styles.funnelContainer}>
                  {data.conversion.funnel.map((stage, index) => (
                    <div key={index} style={styles.funnelStage}>
                      <div style={styles.funnelBar}>
                        <div
                          style={{
                            ...styles.funnelBarFill,
                            width: `${stage.percentage}%`
                          }}
                        />
                      </div>
                      <div style={styles.funnelInfo}>
                        <span style={styles.funnelStage}>{stage.stage}</span>
                        <span style={styles.funnelCount}>
                          {stage.count} ({stage.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Avg Days to First Commission:</span>
                    <span style={styles.statValue}>
                      {data.conversion.avgDaysToFirstCommission.toFixed(1)} days
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Network Depth</h3>
              {data.networkDepth && (
                <div>
                  <div style={styles.statGrid}>
                    <div style={styles.statItem}>
                      <span style={styles.statLabel}>Max Depth:</span>
                      <span style={styles.statValue}>{data.networkDepth.maxDepth} levels</span>
                    </div>
                    <div style={styles.statItem}>
                      <span style={styles.statLabel}>Avg Depth:</span>
                      <span style={styles.statValue}>{data.networkDepth.avgDepth} levels</span>
                    </div>
                  </div>
                  <div style={styles.depthList}>
                    {data.networkDepth.distribution.slice(0, 5).map((level, index) => (
                      <div key={index} style={styles.depthItem}>
                        <span style={styles.depthLevel}>Level {level.level}</span>
                        <span style={styles.depthCount}>{level.userCount} users</span>
                        <span style={styles.depthEarnings}>
                          ${level.totalEarned.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Earnings Distribution</h3>
              {data.earningsDistribution && (
                <div>
                  <div style={styles.percentileGrid}>
                    <div style={styles.percentileItem}>
                      <span style={styles.percentileLabel}>25th</span>
                      <span style={styles.percentileValue}>
                        ${data.earningsDistribution.percentiles.p25.toFixed(2)}
                      </span>
                    </div>
                    <div style={styles.percentileItem}>
                      <span style={styles.percentileLabel}>50th</span>
                      <span style={styles.percentileValue}>
                        ${data.earningsDistribution.percentiles.p50.toFixed(2)}
                      </span>
                    </div>
                    <div style={styles.percentileItem}>
                      <span style={styles.percentileLabel}>75th</span>
                      <span style={styles.percentileValue}>
                        ${data.earningsDistribution.percentiles.p75.toFixed(2)}
                      </span>
                    </div>
                    <div style={styles.percentileItem}>
                      <span style={styles.percentileLabel}>90th</span>
                      <span style={styles.percentileValue}>
                        ${data.earningsDistribution.percentiles.p90.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Growth Projections</h3>
              {data.growthPredictions && (
                <div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Growth Rate:</span>
                    <span style={styles.statValue}>{data.growthPredictions.growthRate}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>30-Day Projection:</span>
                    <span style={styles.statValue}>
                      {data.growthPredictions.projections[29]?.projectedUsers || 'N/A'} users
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'conversion' && data.conversion && (
          <div style={styles.detailView}>
            <h2 style={styles.sectionTitle}>
              Conversion Funnel Analysis
              <HelpTooltip content="Shows the percentage of users progressing through each stage from registration to active participation. Helps identify where users drop off." position="right" maxWidth="280px" />
            </h2>
            <div style={styles.largeCard}>
              {data.conversion.funnel.map((stage, index) => (
                <div key={index} style={styles.largeFunnelStage}>
                  <div style={styles.funnelStageHeader}>
                    <h3 style={styles.funnelStageTitle}>{stage.stage}</h3>
                    <div style={styles.funnelStageStats}>
                      <span style={styles.funnelStageCount}>{stage.count} users</span>
                      <span style={styles.funnelStagePercentage}>
                        {stage.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div style={styles.largeFunnelBar}>
                    <div
                      style={{
                        ...styles.largeFunnelBarFill,
                        width: `${stage.percentage}%`
                      }}
                    />
                  </div>
                  {index < data.conversion.funnel.length - 1 && (
                    <div style={styles.funnelDropoff}>
                      Dropoff: {(stage.percentage - data.conversion.funnel[index + 1].percentage).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'network' && data.networkDepth && (
          <div style={styles.detailView}>
            <h2 style={styles.sectionTitle}>
              Network Depth Distribution
              <HelpTooltip content="Shows how many users exist at each level of the referral tree. Higher average depth indicates deeper network penetration." position="right" maxWidth="280px" />
            </h2>
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <span style={styles.statCardLabel}>
                  Maximum Depth
                  <HelpTooltip content="The deepest level reached in the referral network." position="top" />
                </span>
                <span style={styles.statCardValue}>{data.networkDepth.maxDepth}</span>
                <span style={styles.statCardUnit}>levels</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statCardLabel}>Average Depth</span>
                <span style={styles.statCardValue}>{data.networkDepth.avgDepth}</span>
                <span style={styles.statCardUnit}>levels</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statCardLabel}>Total Levels</span>
                <span style={styles.statCardValue}>{data.networkDepth.distribution.length}</span>
                <span style={styles.statCardUnit}>active</span>
              </div>
            </div>

            <div style={styles.levelTable}>
              <div style={styles.levelTableHeader}>
                <span style={styles.levelTableCol}>Level</span>
                <span style={styles.levelTableCol}>Users</span>
                <span style={styles.levelTableCol}>Avg Network</span>
                <span style={styles.levelTableCol}>Total Earned</span>
              </div>
              {data.networkDepth.distribution.map((level, index) => (
                <div key={index} style={styles.levelTableRow}>
                  <span style={styles.levelTableCol}>Level {level.level}</span>
                  <span style={styles.levelTableCol}>{level.userCount}</span>
                  <span style={styles.levelTableCol}>{level.avgNetworkSize.toFixed(1)}</span>
                  <span style={styles.levelTableCol}>${level.totalEarned.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'earnings' && data.earningsDistribution && (
          <div style={styles.detailView}>
            <h2 style={styles.sectionTitle}>
              Earnings Distribution
              <HelpTooltip content="Statistical breakdown of user earnings showing percentiles and distribution across earning brackets." position="right" maxWidth="280px" />
            </h2>

            <h3 style={styles.subsectionTitle}>
              Percentiles
              <HelpTooltip content="P50 (median) means 50% of users earned this amount or less. P90 means 90% earned this amount or less." position="right" maxWidth="280px" />
            </h3>
            <div style={styles.percentileRow}>
              {Object.entries(data.earningsDistribution.percentiles).map(([key, value]) => (
                <div key={key} style={styles.percentileCard}>
                  <span style={styles.percentileCardLabel}>{key.toUpperCase()}</span>
                  <span style={styles.percentileCardValue}>${value.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <h3 style={styles.subsectionTitle}>Distribution by Bracket</h3>
            <div style={styles.distributionTable}>
              <div style={styles.distributionTableHeader}>
                <span style={styles.distributionTableCol}>Bracket</span>
                <span style={styles.distributionTableCol}>Users</span>
                <span style={styles.distributionTableCol}>Min</span>
                <span style={styles.distributionTableCol}>Max</span>
                <span style={styles.distributionTableCol}>Average</span>
              </div>
              {data.earningsDistribution.distribution.map((bracket, index) => (
                <div key={index} style={styles.distributionTableRow}>
                  <span style={styles.distributionTableCol}>${bracket.bracket}</span>
                  <span style={styles.distributionTableCol}>{bracket.userCount}</span>
                  <span style={styles.distributionTableCol}>${bracket.minEarned.toFixed(2)}</span>
                  <span style={styles.distributionTableCol}>${bracket.maxEarned.toFixed(2)}</span>
                  <span style={styles.distributionTableCol}>${bracket.avgEarned.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'growth' && data.growthPredictions && (
          <div style={styles.detailView}>
            <h2 style={styles.sectionTitle}>
              Growth Predictions
              <HelpTooltip content="Linear regression projections based on historical growth patterns over the last 30 days." position="right" maxWidth="280px" />
            </h2>

            <div style={styles.growthSummary}>
              <div style={styles.growthStatCard}>
                <span style={styles.growthStatLabel}>Growth Rate</span>
                <span style={styles.growthStatValue}>{data.growthPredictions.growthRate}</span>
              </div>
              <div style={styles.growthStatCard}>
                <span style={styles.growthStatLabel}>7-Day Projection</span>
                <span style={styles.growthStatValue}>
                  {data.growthPredictions.projections[6]?.projectedUsers || 'N/A'} users
                </span>
              </div>
              <div style={styles.growthStatCard}>
                <span style={styles.growthStatLabel}>30-Day Projection</span>
                <span style={styles.growthStatValue}>
                  {data.growthPredictions.projections[29]?.projectedUsers || 'N/A'} users
                </span>
              </div>
            </div>

            <h3 style={styles.subsectionTitle}>Historical Growth (Last 30 Days)</h3>
            <div style={styles.growthTable}>
              {data.growthPredictions.historicalGrowth.slice(-10).map((day, index) => (
                <div key={index} style={styles.growthTableRow}>
                  <span style={styles.growthTableDate}>
                    {new Date(day.date).toLocaleDateString()}
                  </span>
                  <span style={styles.growthTableValue}>+{day.newUsers} new</span>
                  <span style={styles.growthTableValue}>{day.cumulativeUsers} total</span>
                </div>
              ))}
            </div>

            <h3 style={styles.subsectionTitle}>30-Day Projection</h3>
            <div style={styles.projectionList}>
              {data.growthPredictions.projections
                .filter((_, index) => index % 5 === 0 || index === data.growthPredictions.projections.length - 1)
                .map((proj, index) => (
                  <div key={index} style={styles.projectionItem}>
                    <span style={styles.projectionDay}>Day +{proj.day}</span>
                    <span style={styles.projectionUsers}>{proj.projectedUsers} users</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: 'var(--space-lg)',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    marginBottom: 'var(--space-lg)'
  },
  title: {
    fontSize: 'var(--text-4xl)',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-xs)'
  },
  subtitle: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-muted)'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: 'var(--space-md)'
  },
  spinner: {
    fontSize: '3rem',
    animation: 'pulse 2s ease-in-out infinite'
  },
  loadingText: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-muted)'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-md)',
    padding: 'var(--space-3xl)'
  },
  errorText: {
    fontSize: 'var(--text-base)',
    color: '#ef4444'
  },
  retryButton: {
    padding: '0.75rem 1.5rem',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    cursor: 'pointer'
  },
  tabs: {
    display: 'flex',
    gap: 'var(--space-xs)',
    marginBottom: 'var(--space-lg)',
    borderBottom: '2px solid var(--glass-border)',
    overflowX: 'auto'
  },
  tab: {
    padding: 'var(--space-md) var(--space-lg)',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-muted)',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
    marginBottom: '-2px',
    whiteSpace: 'nowrap'
  },
  tabActive: {
    padding: 'var(--space-md) var(--space-lg)',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid var(--primary-gold)',
    color: 'var(--primary-gold)',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '-2px',
    whiteSpace: 'nowrap'
  },
  tabContent: {
    minHeight: '400px'
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: 'var(--space-lg)'
  },
  card: {
    padding: 'var(--space-lg)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)'
  },
  cardTitle: {
    fontSize: 'var(--text-xl)',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-md)'
  },
  funnelContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)'
  },
  funnelStage: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)'
  },
  funnelBar: {
    height: '8px',
    background: 'var(--bg-tertiary)',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  funnelBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--primary-gold), var(--accent-green))',
    transition: 'width var(--transition-base)'
  },
  funnelInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 'var(--text-sm)'
  },
  funnelCount: {
    color: 'var(--text-muted)',
    fontWeight: '600'
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-md)'
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-sm)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)'
  },
  statLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    fontWeight: '500'
  },
  statValue: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-primary)',
    fontWeight: '700'
  },
  depthList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)'
  },
  depthItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 'var(--space-sm)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-sm)'
  },
  depthLevel: {
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  depthCount: {
    color: 'var(--text-muted)'
  },
  depthEarnings: {
    color: 'var(--accent-green)',
    fontWeight: '600'
  },
  percentileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-sm)'
  },
  percentileItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: 'var(--space-sm)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    textAlign: 'center'
  },
  percentileLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)',
    marginBottom: 'var(--space-xs)'
  },
  percentileValue: {
    fontSize: 'var(--text-lg)',
    color: 'var(--text-primary)',
    fontWeight: '700'
  },
  detailView: {
    maxWidth: '1000px'
  },
  sectionTitle: {
    fontSize: 'var(--text-3xl)',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-lg)'
  },
  subsectionTitle: {
    fontSize: 'var(--text-xl)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginTop: 'var(--space-xl)',
    marginBottom: 'var(--space-md)'
  },
  largeCard: {
    padding: 'var(--space-xl)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-xl)'
  },
  largeFunnelStage: {
    marginBottom: 'var(--space-xl)'
  },
  funnelStageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-sm)'
  },
  funnelStageTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  funnelStageStats: {
    display: 'flex',
    gap: 'var(--space-md)',
    alignItems: 'center'
  },
  funnelStageCount: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-secondary)',
    fontWeight: '600'
  },
  funnelStagePercentage: {
    fontSize: 'var(--text-xl)',
    color: 'var(--primary-gold)',
    fontWeight: '700'
  },
  largeFunnelBar: {
    height: '16px',
    background: 'var(--bg-tertiary)',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  largeFunnelBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--primary-gold), var(--accent-green))',
    transition: 'width var(--transition-base)'
  },
  funnelDropoff: {
    marginTop: 'var(--space-sm)',
    fontSize: 'var(--text-sm)',
    color: '#ef4444',
    fontWeight: '600'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-xl)'
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'var(--space-lg)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    textAlign: 'center'
  },
  statCardLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    marginBottom: 'var(--space-sm)'
  },
  statCardValue: {
    fontSize: 'var(--text-4xl)',
    fontWeight: '700',
    color: 'var(--primary-gold)',
    marginBottom: 'var(--space-xs)'
  },
  statCardUnit: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)'
  },
  levelTable: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden'
  },
  levelTableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1.5fr 1.5fr',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
    background: 'var(--bg-tertiary)',
    fontSize: 'var(--text-sm)',
    fontWeight: '700',
    color: 'var(--text-secondary)'
  },
  levelTableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1.5fr 1.5fr',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
    borderTop: '1px solid var(--glass-border)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)',
    transition: 'background var(--transition-fast)'
  },
  levelTableCol: {
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  percentileRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-xl)'
  },
  percentileCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'var(--space-md)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)'
  },
  percentileCardLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)',
    marginBottom: 'var(--space-xs)',
    fontWeight: '600'
  },
  percentileCardValue: {
    fontSize: 'var(--text-xl)',
    color: 'var(--accent-green)',
    fontWeight: '700'
  },
  distributionTable: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden'
  },
  distributionTableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
    background: 'var(--bg-tertiary)',
    fontSize: 'var(--text-sm)',
    fontWeight: '700',
    color: 'var(--text-secondary)'
  },
  distributionTableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
    borderTop: '1px solid var(--glass-border)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)'
  },
  distributionTableCol: {
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  growthSummary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'var(--space-lg)',
    marginBottom: 'var(--space-xl)'
  },
  growthStatCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'var(--space-lg)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)'
  },
  growthStatLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    marginBottom: 'var(--space-sm)'
  },
  growthStatValue: {
    fontSize: 'var(--text-2xl)',
    fontWeight: '700',
    color: 'var(--primary-gold)'
  },
  growthTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)',
    marginBottom: 'var(--space-xl)'
  },
  growthTableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: 'var(--space-md)',
    padding: 'var(--space-sm)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)'
  },
  growthTableDate: {
    color: 'var(--text-primary)',
    fontWeight: '600'
  },
  growthTableValue: {
    color: 'var(--text-muted)'
  },
  projectionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)'
  },
  projectionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 'var(--space-sm)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)'
  },
  projectionDay: {
    color: 'var(--text-primary)',
    fontWeight: '600'
  },
  projectionUsers: {
    color: 'var(--accent-green)',
    fontWeight: '700'
  }
};

export default InstructorBI;
