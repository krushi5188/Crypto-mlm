import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Wifi, Database, Server, XCircle,
  RefreshCw, Heart, Search, Key, FileWarning, Zap
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { pageVariants, pageTransition, fadeInUp, scaleIn } from '../utils/animations';

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

  // Get icon and title based on error type
  const getErrorIcon = (type) => {
    switch (type) {
      case 'NETWORK_ERROR':
        return <Wifi className="w-16 h-16 text-error" />;
      case 'SERVICE_UNAVAILABLE':
        return <AlertTriangle className="w-16 h-16 text-warning" />;
      case 'DATABASE_ERROR':
        return <Database className="w-16 h-16 text-error" />;
      case 'SERVER_ERROR':
        return <Server className="w-16 h-16 text-error" />;
      default:
        return <XCircle className="w-16 h-16 text-error" />;
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

  if (!errorData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Zap className="w-12 h-12 text-gold-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="min-h-screen flex items-center justify-center py-12 px-4"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-error/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-warning/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <Card
            variant="glass-strong"
            padding="xl"
            className="border-2 border-error/30"
          >
            {/* Error Icon */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="flex justify-center mb-6"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {getErrorIcon(errorData.type)}
              </motion.div>
            </motion.div>

            {/* Error Title */}
            <h1 className="text-4xl font-display font-bold text-center mb-6 text-error">
              {getErrorTitle(errorData.type)}
            </h1>

            {/* Error Message */}
            <p className="text-lg text-text-muted text-center mb-8 leading-relaxed">
              {errorData.message}
            </p>

            {/* Environment Variables Check Callout - for network/503 errors */}
            {(errorData.type === 'NETWORK_ERROR' || errorData.type === 'SERVICE_UNAVAILABLE') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card
                  variant="glass-medium"
                  padding="lg"
                  className="mb-6 border border-blue-400/30"
                >
                  <div className="flex items-start gap-3">
                    <FileWarning className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-blue-400 mb-2">Most Common Fix</p>
                      <p className="text-sm text-text-muted leading-relaxed">
                        This error is usually caused by missing or incorrect environment variables.
                        Click "Check Environment Variables" below to see exactly what's misconfigured and how to fix it.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Technical Details */}
            <AnimatePresence>
              {errorData.details && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <Card variant="glass" padding="md">
                    <p className="text-xs font-mono text-text-dimmed whitespace-pre-wrap break-words">
                      {errorData.details}
                    </p>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Code */}
            {errorData.statusCode && (
              <div className="text-center text-sm text-text-dimmed mb-6">
                Status Code: <span className="font-mono text-error">{errorData.statusCode}</span>
              </div>
            )}

            {/* Additional Help for Service Unavailable */}
            {errorData.type === 'SERVICE_UNAVAILABLE' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card
                  variant="glass-medium"
                  padding="lg"
                  className="mb-8 border border-warning/30"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-warning mb-3">Troubleshooting Steps</p>
                      <ul className="space-y-2 text-sm text-text-muted">
                        <li className="flex items-start gap-2">
                          <span className="text-gold-400 mt-1">•</span>
                          <span>Check if the backend server is running</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gold-400 mt-1">•</span>
                          <span>Verify database connection in .env file</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gold-400 mt-1">•</span>
                          <span>Ensure PostgreSQL is running and accessible</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gold-400 mt-1">•</span>
                          <span>Check backend logs for initialization errors</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-3"
            >
              <Button
                onClick={handleRetry}
                variant="primary"
                size="md"
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Retry
              </Button>

              <Button
                onClick={handleCheckHealth}
                variant="outline"
                size="md"
                icon={<Heart className="w-4 h-4" />}
              >
                Backend Status
              </Button>

              <Button
                onClick={handleViewDiagnostics}
                variant="outline"
                size="md"
                icon={<Search className="w-4 h-4" />}
              >
                Diagnostics
              </Button>

              <Button
                onClick={handleCheckEnvVars}
                variant="outline"
                size="md"
                icon={<FileWarning className="w-4 h-4" />}
                className="md:col-span-2"
              >
                Check Environment
              </Button>

              <Button
                onClick={handleGoToLogin}
                variant="ghost"
                size="md"
                icon={<Key className="w-4 h-4" />}
              >
                Go to Login
              </Button>
            </motion.div>

            {/* Timestamp */}
            {errorData.timestamp && (
              <div className="mt-8 text-center text-xs text-text-dimmed">
                Error occurred at: {new Date(errorData.timestamp).toLocaleString()}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ErrorPage;
