import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import NotificationDropdown from '../NotificationDropdown';
import RankBadge from '../RankBadge';

const Navbar = () => {
  const { user, isAuthenticated, isInstructor, isMember, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navStyles = {
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: 'var(--space-md) var(--space-lg)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  };

  const logoStyles = {
    fontSize: 'var(--text-xl)',
    fontWeight: '700',
    background: 'linear-gradient(135deg, var(--primary-gold) 0%, var(--primary-gold-dark) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textDecoration: 'none',
    letterSpacing: '-0.01em'
  };

  const linkStyles = {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    marginLeft: 'var(--space-lg)',
    fontSize: 'var(--text-base)',
    fontWeight: '500',
    transition: 'color var(--transition-fast)',
    letterSpacing: '-0.01em'
  };

  const linkHoverStyles = {
    color: 'var(--text-primary)'
  };

  const styles = {
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)'
    },
    username: {
      marginLeft: 'var(--space-md)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-dimmed)',
      fontWeight: '500'
    }
  };

  return (
    <nav style={navStyles}>
      <Link
        to={isMember() ? '/dashboard' : isInstructor() ? '/instructor/analytics' : '/'}
        style={logoStyles}
      >
        Atlas Network
      </Link>

      <div style={styles.rightSection}>
        {isAuthenticated() ? (
          <>
            {isMember() && (
              <>
                <Link
                  to="/dashboard"
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  Dashboard
                </Link>
                <Link
                  to="/network"
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  Network
                </Link>
                <Link
                  to="/earnings"
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  Earnings
                </Link>
                <Link
                  to="/achievements"
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  🏆 Achievements
                </Link>
                <Link
                  to="/leaderboard"
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  🏅 Leaderboard
                </Link>
                <Link
                  to="/security"
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  🔒 Security
                </Link>
              </>
            )}

            {isInstructor() && (
              <>
                <Link
                  to="/instructor/analytics"
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  Analytics
                </Link>
                <Link
                  to="/instructor/participants"
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  Participants
                </Link>
                <Link
                  to="/instructor/referrals"
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  Referrals
                </Link>
                <Link
                  to="/instructor/network"
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  Network
                </Link>
                <Link
                  to="/instructor/controls"
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  Controls
                </Link>
                <Link
                  to="/instructor/fraud-detection"
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  Fraud Detection
                </Link>
                <Link
                  to="/instructor/bi"
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  Business Intelligence
                </Link>
                <Link
                  to="/instructor/deposits"
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  Deposits
                </Link>
                <Link
                  to="/instructor/configuration"
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  Configuration
                </Link>
              </>
            )}

            {/* Notification Dropdown and Rank Badge for Members */}
            {isMember() && (
              <>
                <NotificationDropdown />
                <RankBadge />
              </>
            )}

            <span style={styles.username}>
              {user?.username}
            </span>
            <LanguageSwitcher variant="compact" />
            <ThemeToggle variant="compact" />
            <Button onClick={handleLogout} size="sm" variant="outline">
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              style={linkStyles}
              onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              Login
            </Link>
            <LanguageSwitcher variant="compact" />
            <ThemeToggle variant="compact" />
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
