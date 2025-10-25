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
  // Variant styles with distinct colors
  const variantStyles = {
    default: 'from-gray-800/50 to-gray-900/50 border-gray-700/30',
    gold: 'from-yellow-900/30 to-yellow-950/50 border-yellow-700/30',
    green: 'from-green-900/30 to-green-950/50 border-green-700/30',
    blue: 'from-blue-900/30 to-blue-950/50 border-blue-700/30',
    purple: 'from-purple-900/30 to-purple-950/50 border-purple-700/30'
  };

  const iconColors = {
    default: 'text-gray-400',
    gold: 'text-gold-400',
    green: 'text-green-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400'
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
        className={`bg-gradient-to-br ${variantStyles[variant]} border min-h-[160px] flex flex-col`}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-400 mb-2">{title}</p>
            <h3 className="text-4xl font-display font-bold text-white tracking-tight">
              <AnimatedNumber
                value={value}
                prefix={prefix}
                suffix={suffix}
                decimals={decimals}
              />
            </h3>
          </div>
          {icon && (
            <div className={`p-3 rounded-xl bg-black/30 ${iconColors[variant]}`}>
              {icon}
            </div>
          )}
        </div>

        <div className="mt-auto min-h-[24px]">
          {(trend || trendValue) && (
            <div className="flex items-center gap-2 text-sm">
              {trend === 'up' ? (
                <div className="flex items-center gap-1 text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">{trendValue}</span>
                </div>
              ) : trend === 'down' ? (
                <div className="flex items-center gap-1 text-red-400">
                  <TrendingDown className="w-4 h-4" />
                  <span className="font-medium">{trendValue}</span>
                </div>
              ) : (
                <span className="text-gray-400">{trendValue}</span>
              )}
              <span className="text-gray-500">{trendLabel}</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default StatsCard;
