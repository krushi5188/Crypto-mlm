import React, { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

const AnimatedNumber = ({
  value,
  duration = 2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = ''
}) => {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (current) =>
    decimals > 0 ? current.toFixed(decimals) : Math.floor(current)
  );
  const prevValue = useRef(0);

  useEffect(() => {
    if (value !== prevValue.current) {
      spring.set(value);
      prevValue.current = value;
    }
  }, [value, spring]);

  return (
    <span className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
};

export default AnimatedNumber;
