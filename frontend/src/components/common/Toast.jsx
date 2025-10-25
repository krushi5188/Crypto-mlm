import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { toastVariants } from '../../utils/animations';

const Toast = ({ id, type = 'info', message, duration = 4000, onClose }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const types = {
    success: {
      icon: <CheckCircle className="w-5 h-5" />,
      bg: 'bg-success/10',
      border: 'border-success/30',
      text: 'text-success',
      progressBg: 'bg-success'
    },
    error: {
      icon: <XCircle className="w-5 h-5" />,
      bg: 'bg-error/10',
      border: 'border-error/30',
      text: 'text-error',
      progressBg: 'bg-error'
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      bg: 'bg-warning/10',
      border: 'border-warning/30',
      text: 'text-warning',
      progressBg: 'bg-warning'
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      bg: 'bg-info/10',
      border: 'border-info/30',
      text: 'text-info',
      progressBg: 'bg-info'
    }
  };

  const config = types[type] || types.info;

  return (
    <motion.div
      variants={toastVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`
        relative w-full max-w-sm
        ${config.bg} backdrop-blur-xl
        border-2 ${config.border}
        rounded-xl shadow-2xl
        overflow-hidden
      `}
    >
      <div className="p-4 flex items-start gap-3">
        <div className={config.text}>
          {config.icon}
        </div>
        <p className="flex-1 text-sm text-text-primary font-medium">
          {message}
        </p>
        <button
          onClick={() => onClose(id)}
          className="text-text-dimmed hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      {duration && (
        <motion.div
          className={`h-1 ${config.progressBg}`}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
};

export default Toast;
