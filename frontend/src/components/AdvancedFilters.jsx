import React, { useState, useEffect } from 'react';

const AdvancedFilters = ({ onFilterChange, savedPresets = [], onSavePreset, onDeletePreset }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    type: 'all',
    sortBy: 'date_desc',
    triggeredBy: ''
  });

  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  const transactionTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'referral_commission', label: 'Referral Commission' },
    { value: 'injection', label: 'Injection' },
    { value: 'withdrawal', label: 'Withdrawal' },
    { value: 'bonus', label: 'Bonus' },
    { value: 'adjustment', label: 'Adjustment' }
  ];

  const sortOptions = [
    { value: 'date_desc', label: 'Date (Newest)' },
    { value: 'date_asc', label: 'Date (Oldest)' },
    { value: 'amount_desc', label: 'Amount (High to Low)' },
    { value: 'amount_asc', label: 'Amount (Low to High)' }
  ];

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters]);

  const handleInputChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReset = () => {
    const resetFilters = {
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
      type: 'all',
      sortBy: 'date_desc',
      triggeredBy: ''
    };
    setFilters(resetFilters);
  };

  const handleApplyPreset = (preset) => {
    setFilters(preset.filters);
    setIsOpen(false);
  };

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset({
        name: presetName,
        filters: filters
      });
      setPresetName('');
      setShowSavePreset(false);
    }
  };

  const hasActiveFilters = () => {
    return filters.dateFrom || filters.dateTo || filters.amountMin ||
           filters.amountMax || filters.type !== 'all' || filters.triggeredBy;
  };

  const containerStyle = {
    position: 'relative',
    marginBottom: 'var(--space-md)'
  };

  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    background: hasActiveFilters() ? 'linear-gradient(135deg, var(--primary-gold), var(--accent-green))' : 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: hasActiveFilters() ? '#000' : 'var(--text-primary)',
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    transition: 'all var(--transition-base)'
  };

  const panelStyle = {
    position: 'absolute',
    top: 'calc(100% + 0.5rem)',
    right: 0,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)',
    boxShadow: 'var(--shadow-2xl)',
    minWidth: '500px',
    maxWidth: '600px',
    zIndex: 1000,
    animation: 'slideDown 0.2s ease-out'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-md)'
  };

  const fieldStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)'
  };

  const labelStyle = {
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    color: 'var(--text-secondary)'
  };

  const inputStyle = {
    padding: '0.5rem 0.75rem',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-base)',
    transition: 'all var(--transition-base)'
  };

  const actionsStyle = {
    display: 'flex',
    gap: 'var(--space-sm)',
    justifyContent: 'space-between',
    paddingTop: 'var(--space-md)',
    borderTop: '1px solid var(--glass-border)'
  };

  const secondaryButtonStyle = {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-muted)',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-base)'
  };

  const primaryButtonStyle = {
    padding: '0.5rem 1rem',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-base)'
  };

  const presetListStyle = {
    marginBottom: 'var(--space-md)',
    paddingBottom: 'var(--space-md)',
    borderBottom: '1px solid var(--glass-border)'
  };

  const presetItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-sm)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-xs)',
    cursor: 'pointer',
    transition: 'all var(--transition-base)'
  };

  if (!isOpen) {
    return (
      <div style={containerStyle}>
        <button onClick={() => setIsOpen(true)} style={buttonStyle}>
          <span>🔍</span>
          <span>Advanced Filters</span>
          {hasActiveFilters() && (
            <span style={{
              background: '#000',
              color: 'var(--primary-gold)',
              padding: '0.125rem 0.5rem',
              borderRadius: '12px',
              fontSize: 'var(--text-xs)',
              fontWeight: '700'
            }}>
              Active
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <div style={containerStyle}>
        <button onClick={() => setIsOpen(false)} style={buttonStyle}>
          <span>🔍</span>
          <span>Advanced Filters</span>
          {hasActiveFilters() && (
            <span style={{
              background: '#000',
              color: 'var(--primary-gold)',
              padding: '0.125rem 0.5rem',
              borderRadius: '12px',
              fontSize: 'var(--text-xs)',
              fontWeight: '700'
            }}>
              Active
            </span>
          )}
        </button>

        <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-md)'
          }}>
            Advanced Filters
          </h3>

          {/* Saved Presets */}
          {savedPresets && savedPresets.length > 0 && (
            <div style={presetListStyle}>
              <label style={labelStyle}>Saved Presets</label>
              <div style={{ marginTop: 'var(--space-xs)' }}>
                {savedPresets.map((preset, index) => (
                  <div
                    key={index}
                    style={presetItemStyle}
                    onClick={() => handleApplyPreset(preset)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--glass-bg)';
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: '600' }}>
                      {preset.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDeletePreset) onDeletePreset(index);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: 'var(--text-sm)',
                        padding: '0.25rem 0.5rem'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Fields */}
          <div style={gridStyle}>
            {/* Date Range */}
            <div style={fieldStyle}>
              <label style={labelStyle}>From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleInputChange('dateFrom', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleInputChange('dateTo', e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Amount Range */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Min Amount (USDT)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filters.amountMin}
                onChange={(e) => handleInputChange('amountMin', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Max Amount (USDT)</label>
              <input
                type="number"
                step="0.01"
                placeholder="1000.00"
                value={filters.amountMax}
                onChange={(e) => handleInputChange('amountMax', e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Transaction Type */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Transaction Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                style={inputStyle}
              >
                {transactionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleInputChange('sortBy', e.target.value)}
                style={inputStyle}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Triggered By User */}
          <div style={{ ...fieldStyle, marginBottom: 'var(--space-md)' }}>
            <label style={labelStyle}>Triggered By User (ID or Username)</label>
            <input
              type="text"
              placeholder="Enter user ID or username"
              value={filters.triggeredBy}
              onChange={(e) => handleInputChange('triggeredBy', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Save Preset Section */}
          {showSavePreset ? (
            <div style={{ ...fieldStyle, marginBottom: 'var(--space-md)' }}>
              <label style={labelStyle}>Preset Name</label>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <input
                  type="text"
                  placeholder="My Filter Preset"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSavePreset();
                  }}
                />
                <button onClick={handleSavePreset} style={primaryButtonStyle}>
                  Save
                </button>
                <button onClick={() => {
                  setShowSavePreset(false);
                  setPresetName('');
                }} style={secondaryButtonStyle}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            hasActiveFilters() && (
              <button
                onClick={() => setShowSavePreset(true)}
                style={{
                  ...secondaryButtonStyle,
                  marginBottom: 'var(--space-md)',
                  width: '100%'
                }}
              >
                💾 Save as Preset
              </button>
            )
          )}

          {/* Actions */}
          <div style={actionsStyle}>
            <button onClick={handleReset} style={secondaryButtonStyle}>
              Reset All
            </button>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button onClick={() => setIsOpen(false)} style={secondaryButtonStyle}>
                Close
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  ...primaryButtonStyle,
                  background: 'linear-gradient(135deg, var(--primary-gold), var(--accent-green))',
                  color: '#000'
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Overlay */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'transparent',
            zIndex: 999
          }}
          onClick={() => setIsOpen(false)}
        />
      </div>
    </>
  );
};

export default AdvancedFilters;
