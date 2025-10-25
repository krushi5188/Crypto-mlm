/**
 * Animation Variants for Framer Motion
 * Centralized animation patterns for consistent motion design across the app
 */

// ========================================
// Page Animations
// ========================================

export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const pageTransition = {
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1]
};

// ========================================
// Staggered Children (for lists, grids)
// ========================================

export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

// Faster stagger for smaller items
export const fastStaggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

// Slower stagger for hero sections
export const slowStaggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

// ========================================
// Card & Button Hover Animations
// ========================================

export const cardHoverVariants = {
  initial: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 }
};

export const buttonHoverVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 }
};

// For buttons with lift effect
export const buttonLiftVariants = {
  initial: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -2,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98, y: 0 }
};

// ========================================
// Number Counting Animation Utilities
// ========================================

/**
 * Hook-style function for animated numbers
 * Use with Framer Motion's useSpring and useTransform
 *
 * Example:
 * const spring = useSpring(value, { stiffness: 100, damping: 30 });
 * const display = useTransform(spring, current => Math.floor(current));
 */
export const numberSpringConfig = {
  stiffness: 100,
  damping: 30
};

export const fastNumberSpringConfig = {
  stiffness: 200,
  damping: 40
};

export const slowNumberSpringConfig = {
  stiffness: 50,
  damping: 25
};

// ========================================
// Modal & Overlay Animations
// ========================================

export const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

export const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: { duration: 0.2 }
  }
};

// ========================================
// Toast/Notification Animations
// ========================================

export const toastVariants = {
  hidden: {
    opacity: 0,
    x: 100,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.8,
    transition: { duration: 0.2 }
  }
};

// ========================================
// Celebration Animations (for earnings, achievements)
// ========================================

export const celebrationVariants = {
  hidden: { scale: 0, opacity: 0 },
  show: {
    scale: [0, 1.2, 1],
    opacity: [0, 1, 1],
    transition: {
      duration: 0.6,
      ease: [0.68, -0.55, 0.265, 1.55] // bounce effect
    }
  }
};

export const successPulseVariants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

// ========================================
// Slide Panel Animations
// ========================================

export const slidePanelVariants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    x: '100%',
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

export const slidePanelLeftVariants = {
  hidden: { x: '-100%' },
  visible: {
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    x: '-100%',
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

// ========================================
// Dropdown Menu Animations
// ========================================

export const dropdownVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.15 }
  }
};

// ========================================
// Accordion/Collapse Animations
// ========================================

export const accordionVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      },
      opacity: {
        duration: 0.2,
        delay: 0.1
      }
    }
  }
};

// ========================================
// Loading Animations
// ========================================

export const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

export const pulseVariants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const skeletonShimmerVariants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// ========================================
// Fade Variants (directional)
// ========================================

export const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

export const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

export const fadeInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

// ========================================
// Scale Variants
// ========================================

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

export const scaleOut = {
  visible: { opacity: 1, scale: 1 },
  hidden: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

// ========================================
// Floating Action Button
// ========================================

export const fabVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      delay: 0.5,
      duration: 0.3,
      ease: [0.68, -0.55, 0.265, 1.55]
    }
  },
  hover: {
    scale: 1.1,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.9 }
};

// ========================================
// Icon Animations
// ========================================

export const iconRotateVariants = {
  initial: { rotate: 0 },
  animate: { rotate: 180, transition: { duration: 0.3 } }
};

export const iconBounceVariants = {
  animate: {
    y: [0, -5, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const iconScaleVariants = {
  initial: { scale: 0 },
  animate: {
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15
    }
  }
};

// ========================================
// Presence Animations (for conditional rendering)
// ========================================

export const presenceVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

// ========================================
// Layout Animation Config
// ========================================

export const layoutTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30
};

// ========================================
// Easing Functions
// ========================================

export const easings = {
  smooth: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.68, -0.6, 0.32, 1.6],
  anticipate: [0.22, 1, 0.36, 1]
};

// ========================================
// Duration Presets
// ========================================

export const durations = {
  instant: 0.075,
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  slower: 0.5,
  slowest: 0.75
};
