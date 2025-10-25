import React from 'react';
import { motion } from 'framer-motion';
import { FileQuestion } from 'lucide-react';
import Button from './common/Button';
import { scaleIn } from '../utils/animations';

const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  const Icon = icon || FileQuestion;

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      <motion.div
        className="mb-6 p-6 rounded-full bg-glass-medium border border-glass-border"
        whileHover={{ scale: 1.05, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <Icon className="w-16 h-16 text-text-dimmed" />
      </motion.div>

      <h3 className="text-2xl font-display font-semibold text-text-primary mb-2">
        {title}
      </h3>

      <p className="text-text-muted max-w-md mb-6">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;
