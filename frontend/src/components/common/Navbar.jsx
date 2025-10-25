import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, ChevronDown, LogOut, User, Settings,
  LayoutDashboard, Users, DollarSign, Trophy, Award,
  Shield, BarChart3, UserCheck, Network, AlertTriangle,
  Brain, Wallet, Cog
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import NotificationDropdown from '../NotificationDropdown';
import RankBadge from '../RankBadge';
import { dropdownVariants } from '../../utils/animations';

const Navbar = () => {
  const { user, isAuthenticated, isInstructor, isMember, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items for members
  const memberNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/network', label: 'Network', icon: <Users className="w-4 h-4" /> },
    { path: '/earnings', label: 'Earnings', icon: <DollarSign className="w-4 h-4" /> },
    { path: '/achievements', label: 'Achievements', icon: <Trophy className="w-4 h-4" /> },
    { path: '/leaderboard', label: 'Leaderboard', icon: <Award className="w-4 h-4" /> },
  ];

  // Navigation items for instructors
  const instructorNavItems = [
    { path: '/instructor/analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { path: '/instructor/participants', label: 'Participants', icon: <UserCheck className="w-4 h-4" /> },
    { path: '/instructor/network', label: 'Network', icon: <Network className="w-4 h-4" /> },
    { path: '/instructor/fraud-detection', label: 'Fraud', icon: <AlertTriangle className="w-4 h-4" /> },
    { path: '/instructor/bi', label: 'BI', icon: <Brain className="w-4 h-4" /> },
    { path: '/instructor/controls', label: 'Controls', icon: <Cog className="w-4 h-4" /> },
  ];

  const navItems = isMember() ? memberNavItems : isInstructor() ? instructorNavItems : [];

  // Check if route is active
  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      className={`
        fixed top-0 left-0 right-0 z-50
        transition-all duration-300
        ${isScrolled
          ? 'h-16 bg-black/95 border-b border-glass-border-strong backdrop-blur-xl shadow-2xl'
          : 'h-18 bg-black/80 border-b border-glass-border backdrop-blur-2xl'
        }
      `}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          to={isMember() ? '/dashboard' : isInstructor() ? '/instructor/analytics' : '/'}
          className="flex items-center gap-2"
        >
          <motion.div
            className="text-2xl font-display font-bold bg-gradient-to-r from-gold-400 to-green-500 bg-clip-text text-transparent tracking-tight"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Atlas Network
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated() && navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="relative"
            >
              <motion.div
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  font-medium text-sm transition-colors
                  ${isActive(item.path)
                    ? 'text-gold-400 bg-gold-400/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-glass-light'
                  }
                `}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive(item.path) && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400 rounded-full"
                    layoutId="activeTab"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated() ? (
            <>
              {/* Notifications (Members only) */}
              {isMember() && (
                <div className="hidden md:block">
                  <NotificationDropdown />
                </div>
              )}

              {/* Rank Badge (Members only) */}
              {isMember() && (
                <div className="hidden md:block">
                  <RankBadge />
                </div>
              )}

              {/* Theme & Language */}
              <div className="hidden md:flex items-center gap-2">
                <LanguageSwitcher variant="compact" />
                <ThemeToggle variant="compact" />
              </div>

              {/* User Menu */}
              <div className="relative hidden md:block">
                <motion.button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-glass-medium border border-glass-border hover:bg-glass-strong transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-green-500 flex items-center justify-center text-black font-bold text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-text-secondary">
                    {user?.username}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute right-0 mt-2 w-56 bg-bg-elevated backdrop-blur-xl border border-glass-border-strong rounded-xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-glass-border">
                        <p className="text-sm font-medium text-text-primary">{user?.username}</p>
                        <p className="text-xs text-text-dimmed">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-glass-light transition-colors text-text-secondary hover:text-text-primary"
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm">Profile</span>
                        </Link>
                        {isMember() && (
                          <Link
                            to="/security"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-glass-light transition-colors text-text-secondary hover:text-text-primary"
                          >
                            <Shield className="w-4 h-4" />
                            <span className="text-sm">Security</span>
                          </Link>
                        )}
                        {isInstructor() && (
                          <Link
                            to="/instructor/configuration"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-glass-light transition-colors text-text-secondary hover:text-text-primary"
                          >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm">Configuration</span>
                          </Link>
                        )}
                      </div>
                      <div className="p-2 border-t border-glass-border">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error/10 transition-colors text-error w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg bg-glass-medium border border-glass-border hover:bg-glass-strong transition-all"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-2">
                <LanguageSwitcher variant="compact" />
                <ThemeToggle variant="compact" />
              </div>
              <Link to="/login">
                <Button size="sm" variant="outline">
                  Login
                </Button>
              </Link>
              <Link to="/register" className="hidden sm:block">
                <Button size="sm" variant="primary">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && isAuthenticated() && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-bg-elevated border-t border-glass-border backdrop-blur-xl overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    font-medium transition-colors
                    ${isActive(item.path)
                      ? 'text-gold-400 bg-gold-400/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-glass-light'
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}

              <div className="pt-4 border-t border-glass-border space-y-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-glass-light transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-error hover:bg-error/10 transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
