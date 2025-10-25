import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Card from './common/Card';
import AnimatedNumber from './AnimatedNumber';
import { fadeInUp } from '../utils/animations';

const StatsCard = ({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon,
  trend,
  trendValue,
  trendLabel = 'vs last month',
  variant = 'default',
  className = ''
}) => {
  // Variant styles
  const variantStyles = {
    default: 'from-glass-medium to-glass-strong',
    gold: 'from-gold-400/10 to-gold-600/10 border-gold-400/30',
    green: 'from-green-400/10 to-green-600/10 border-green-400/30',
    blue: 'from-blue-400/10 to-blue-600/10 border-blue-400/30'
  };

  const iconColors = {
    default: 'text-text-secondary',
    gold: 'text-gold-400',
    green: 'text-green-400',
    blue: 'text-blue-400'
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={className}
    >
      <Card
        variant="glass"
        interactive
        className={`bg-gradient-to-br ${variantStyles[variant]} h-full`}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-text-muted mb-1">{title}</p>
            <h3 className="text-4xl font-display font-bold text-text-primary tracking-tight">
              <AnimatedNumber
                value={value}
                prefix={prefix}
                suffix={suffix}
                decimals={decimals}
              />
            </h3>
          </div>
          {icon && (
            <div className={`p-3 rounded-xl bg-glass-medium ${iconColors[variant]}`}>
              {icon}
            </div>
          )}
        </div>

        {(trend || trendValue) && (
          <div className="flex items-center gap-2 text-sm">
            {trend === 'up' ? (
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">{trendValue}</span>
              </div>
            ) : trend === 'down' ? (
              <div className="flex items-center gap-1 text-error">
                <TrendingDown className="w-4 h-4" />
                <span className="font-medium">{trendValue}</span>
              </div>
            ) : (
              <span className="text-text-dimmed">{trendValue}</span>
            )}
            <span className="text-text-dimmed">{trendLabel}</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default StatsCard;
