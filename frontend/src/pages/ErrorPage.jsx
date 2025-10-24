import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ErrorPage = () => {
  const navigate = useNavigate();
  const [errorData, setErrorData] = useState(null);

  useEffect(() => {
    // Read error details from sessionStorage
    const storedError = sessionStorage.getItem('apiError');

    if (storedError) {
      try {
        const parsed = JSON.parse(storedError);
        setErrorData(parsed);
        // Clear sessionStorage after reading
        sessionStorage.removeItem('apiError');
      } catch (e) {
        console.error('Failed to parse error data:', e);
        setErrorData({
          type: 'UNKNOWN',
          message: 'An unexpected error occurred',
          details: null,
          statusCode: null
        });
      }
    } else {
      // No error data found - show generic error
      setErrorData({
        type: 'UNKNOWN',
        message: 'An unexpected error occurred',
        details: null,
        statusCode: null
      });
    }
  }, []);

  if (!errorData) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
      </div>
    );
  }

  // Get icon and title based on error type
  const getErrorIcon = (type) => {
    switch (type) {
      case 'NETWORK_ERROR':
        return '🔌';
      case 'SERVICE_UNAVAILABLE':
        return '⚠️';
      case 'DATABASE_ERROR':
        return '🗄️';
      case 'SERVER_ERROR':
        return '🔥';
      default:
        return '❌';
    }
  };

  const getErrorTitle = (type) => {
    switch (type) {
      case 'NETWORK_ERROR':
        return 'Connection Error';
      case 'SERVICE_UNAVAILABLE':
        return 'Service Unavailable';
      case 'DATABASE_ERROR':
        return 'Database Error';
      case 'SERVER_ERROR':
        return 'Server Error';
      default:
        return 'Error';
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleCheckHealth = () => {
    window.open('/api/v1/health', '_blank');
  };

  const handleViewDiagnostics = () => {
    window.open('/api/v1/status', '_blank');
  };

  const handleCheckEnvVars = () => {
    window.open('/api/v1/env-check', '_blank');
  };

  const handleGoToLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-md)',
      background: 'var(--bg-primary)'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: '#1a1a1a',
        border: '2px solid #d32f2f',
        borderRadius: 'var(--radius-lg)',
        padding: '40px',
        boxShadow: '0 4px 20px rgba(211, 47, 47, 0.2)'
      }} className="fade-in">

        {/* Error Icon */}
        <div style={{
          fontSize: '48px',
          textAlign: 'center',
          marginBottom: 'var(--space-lg)'
        }}>
          {getErrorIcon(errorData.type)}
        </div>

        {/* Error Title */}
        <h1 style={{
          color: '#d32f2f',
          fontSize: '24px',
          textAlign: 'center',
          marginBottom: 'var(--space-lg)',
          fontWeight: '600'
        }}>
          {getErrorTitle(errorData.type)}
        </h1>

        {/* Error Message */}
        <p style={{
          color: '#cccccc',
          fontSize: '14px',
          lineHeight: '1.6',
          textAlign: 'center',
          marginBottom: 'var(--space-xl)'
        }}>
          {errorData.message}
        </p>

        {/* Environment Variables Check Callout - for network/503 errors */}
        {(errorData.type === 'NETWORK_ERROR' || errorData.type === 'SERVICE_UNAVAILABLE') && (
          <div style={{
            background: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-xl)',
            color: '#64b5f6',
            fontSize: '13px',
            lineHeight: '1.6'
          }}>
            <strong>💡 Most Common Fix:</strong>
            <p style={{ margin: '8px 0 0 0' }}>
              This error is usually caused by missing or incorrect environment variables. 
              Click "Check Environment Variables" below to see exactly what's misconfigured and how to fix it.
            </p>
          </div>
        )}

        {/* Technical Details */}
        {errorData.details && (
          <div style={{
            background: '#0d0d0d',
            border: '1px solid #333333',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-xl)'
          }}>
            <p style={{
              color: '#999999',
              fontSize: '12px',
              fontFamily: 'monospace',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {errorData.details}
            </p>
          </div>
        )}

        {/* Status Code */}
        {errorData.statusCode && (
          <div style={{
            textAlign: 'center',
            color: '#999999',
            fontSize: '12px',
            marginBottom: 'var(--space-xl)'
          }}>
            Status Code: {errorData.statusCode}
          </div>
        )}

        {/* Additional Help for Database Errors */}
        {errorData.type === 'SERVICE_UNAVAILABLE' && (
          <div style={{
            background: 'rgba(255, 152, 0, 0.1)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-xl)',
            color: '#ffcc80',
            fontSize: '13px',
            lineHeight: '1.6'
          }}>
            <strong>Troubleshooting:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>Check if the backend server is running</li>
              <li>Verify database connection in .env file</li>
              <li>Ensure PostgreSQL is running and accessible</li>
              <li>Check backend logs for initialization errors</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--space-md)'
        }}>
          <button
            onClick={handleRetry}
            style={{
              background: '#cccccc',
              color: '#000000',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
            onMouseLeave={(e) => e.target.style.background = '#cccccc'}
          >
            🔄 Retry Connection
          </button>

          <button
            onClick={handleCheckHealth}
            style={{
              background: '#cccccc',
              color: '#000000',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
            onMouseLeave={(e) => e.target.style.background = '#cccccc'}
          >
            ❤️ Check Backend Status
          </button>

          <button
            onClick={handleViewDiagnostics}
            style={{
              background: '#cccccc',
              color: '#000000',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
            onMouseLeave={(e) => e.target.style.background = '#cccccc'}
          >
            🔍 View Diagnostics
          </button>

          <button
            onClick={handleCheckEnvVars}
            style={{
              background: '#cccccc',
              color: '#000000',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
            onMouseLeave={(e) => e.target.style.background = '#cccccc'}
          >
            🔍 Check Environment Variables
          </button>

          <button
            onClick={handleGoToLogin}
            style={{
              background: '#cccccc',
              color: '#000000',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
            onMouseLeave={(e) => e.target.style.background = '#cccccc'}
          >
            🔑 Go to Login
          </button>
        </div>

        {/* Timestamp */}
        {errorData.timestamp && (
          <div style={{
            textAlign: 'center',
            color: '#666666',
            fontSize: '11px',
            marginTop: 'var(--space-lg)'
          }}>
            Error occurred at: {new Date(errorData.timestamp).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;
