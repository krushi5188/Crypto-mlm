import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import BalanceWidget from '../widgets/BalanceWidget';
import NetworkOverviewWidget from '../widgets/NetworkOverviewWidget';
import RecentEarningsWidget from '../widgets/RecentEarningsWidget';
import QuickActionsWidget from '../widgets/QuickActionsWidget';
import ReferralStatsWidget from '../widgets/ReferralStatsWidget';
import HelpTooltip from '../HelpTooltip';
import { memberAPI } from '../../services/api';

const ResponsiveGridLayout = WidthProvider(Responsive);

const WidgetGrid = ({ dashboardData, onLayoutChange }) => {
  const [layouts, setLayouts] = useState(null);
  const [visibleWidgets, setVisibleWidgets] = useState([
    'balance',
    'network',
    'earnings',
    'actions',
    'referral'
  ]);

  // Define all available widgets
  const widgetComponents = {
    balance: { component: BalanceWidget, title: 'Balance' },
    network: { component: NetworkOverviewWidget, title: 'Network Overview' },
    earnings: { component: RecentEarningsWidget, title: 'Recent Earnings' },
    actions: { component: QuickActionsWidget, title: 'Quick Actions' },
    referral: { component: ReferralStatsWidget, title: 'Referral Stats' }
  };

  // Default layouts for different breakpoints
  const defaultLayouts = {
    lg: [
      { i: 'balance', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      { i: 'network', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      { i: 'earnings', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      { i: 'actions', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      { i: 'referral', x: 0, y: 2, w: 3, h: 2, minW: 2, minH: 2 }
    ],
    md: [
      { i: 'balance', x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
      { i: 'network', x: 4, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
      { i: 'earnings', x: 0, y: 2, w: 4, h: 2, minW: 2, minH: 2 },
      { i: 'actions', x: 4, y: 2, w: 4, h: 2, minW: 2, minH: 2 },
      { i: 'referral', x: 0, y: 4, w: 4, h: 2, minW: 2, minH: 2 }
    ],
    sm: [
      { i: 'balance', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: 'network', x: 0, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
      { i: 'earnings', x: 0, y: 4, w: 6, h: 2, minW: 4, minH: 2 },
      { i: 'actions', x: 0, y: 6, w: 6, h: 2, minW: 4, minH: 2 },
      { i: 'referral', x: 0, y: 8, w: 6, h: 2, minW: 4, minH: 2 }
    ]
  };

  // Load saved layout from preferences
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await memberAPI.getPreferences();
      const prefs = response.data.data;

      if (prefs && prefs.dashboard_layout) {
        setLayouts(prefs.dashboard_layout);
      } else {
        setLayouts(defaultLayouts);
      }

      if (prefs && prefs.hidden_widgets) {
        const visible = Object.keys(widgetComponents).filter(
          key => !prefs.hidden_widgets.includes(key)
        );
        setVisibleWidgets(visible);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setLayouts(defaultLayouts);
    }
  };

  const handleLayoutChange = async (layout, allLayouts) => {
    setLayouts(allLayouts);

    // Save to backend
    try {
      await memberAPI.updatePreferences({
        dashboard_layout: allLayouts
      });
      if (onLayoutChange) {
        onLayoutChange(allLayouts);
      }
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  };

  const toggleWidget = async (widgetKey) => {
    const newVisible = visibleWidgets.includes(widgetKey)
      ? visibleWidgets.filter(k => k !== widgetKey)
      : [...visibleWidgets, widgetKey];

    setVisibleWidgets(newVisible);

    // Save hidden widgets to backend
    const hidden = Object.keys(widgetComponents).filter(
      key => !newVisible.includes(key)
    );

    try {
      await memberAPI.updatePreferences({
        hidden_widgets: hidden
      });
    } catch (error) {
      console.error('Failed to save widget visibility:', error);
    }
  };

  const resetLayout = async () => {
    setLayouts(defaultLayouts);
    setVisibleWidgets(Object.keys(widgetComponents));

    try {
      await memberAPI.updatePreferences({
        dashboard_layout: defaultLayouts,
        hidden_widgets: []
      });
    } catch (error) {
      console.error('Failed to reset layout:', error);
    }
  };

  if (!layouts) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}>⏳</div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Widget Customizer Bar */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <span style={styles.toolbarTitle}>
            Dashboard Widgets
            <HelpTooltip content="Customize your dashboard by dragging widgets to rearrange them, resizing from corners, or hiding widgets you don't need." position="right" maxWidth="250px" />
          </span>
          <span style={styles.toolbarHint}>Drag to rearrange • Resize corners</span>
        </div>
        <div style={styles.toolbarRight}>
          <button onClick={resetLayout} style={styles.toolbarButton}>
            Reset Layout
          </button>
          <div style={styles.widgetToggles}>
            {Object.entries(widgetComponents).map(([key, widget]) => (
              <button
                key={key}
                onClick={() => toggleWidget(key)}
                style={
                  visibleWidgets.includes(key)
                    ? styles.toggleButtonActive
                    : styles.toggleButton
                }
              >
                {widget.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 8, sm: 6 }}
        rowHeight={100}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {visibleWidgets.map((widgetKey) => {
          const Widget = widgetComponents[widgetKey].component;
          return (
            <div key={widgetKey} style={styles.widgetWrapper}>
              <Widget data={dashboardData} />
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
};

const styles = {
  container: {
    width: '100%'
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-md)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    marginBottom: 'var(--space-md)',
    flexWrap: 'wrap',
    gap: 'var(--space-md)'
  },
  toolbarLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)'
  },
  toolbarTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: '700',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)'
  },
  toolbarHint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)',
    fontStyle: 'italic'
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    flexWrap: 'wrap'
  },
  toolbarButton: {
    padding: '0.5rem 1rem',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-base)'
  },
  widgetToggles: {
    display: 'flex',
    gap: 'var(--space-xs)',
    flexWrap: 'wrap'
  },
  toggleButton: {
    padding: '0.5rem 0.75rem',
    background: 'transparent',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
    fontSize: 'var(--text-xs)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
    opacity: 0.5
  },
  toggleButtonActive: {
    padding: '0.5rem 0.75rem',
    background: 'var(--glass-bg)',
    border: '1px solid var(--primary-gold)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--primary-gold)',
    fontSize: 'var(--text-xs)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
    opacity: 1
  },
  widgetWrapper: {
    width: '100%',
    height: '100%'
  },
  loading: {
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
  }
};

export default WidgetGrid;
