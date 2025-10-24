import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import ThemeSwitcher from '../ThemeSwitcher';
import NotificationCenter from '../NotificationCenter';

const Navbar = () => {
  const { user, isAuthenticated, isInstructor, isStudent, logout } = useAuth();
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

  return (
    <nav style={navStyles}>
      <Link 
        to={isStudent() ? '/dashboard' : isInstructor() ? '/instructor/analytics' : '/'} 
        style={logoStyles}
      >
        Atlas Network
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        {isAuthenticated() ? (
          <>
            {isStudent() && (
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
                  to="/profile" 
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  Profile
                </Link>
                <Link 
                  to="/security" 
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  Security
                </Link>
                <Link 
                  to="/achievements" 
                  style={linkStyles}
                  onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  Achievements
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
                  BI Analytics
                </Link>
              </>
            )}

            <ThemeSwitcher />
            {isStudent() && <NotificationCenter />}
            <span style={{ 
              marginLeft: 'var(--space-md)', 
              fontSize: 'var(--text-sm)', 
              color: 'var(--text-dimmed)',
              fontWeight: '500'
            }}>
              {user?.username}
            </span>
            <Button onClick={handleLogout} size="sm" variant="outline">
              Logout
            </Button>
          </>
        ) : (
          <>
            <ThemeSwitcher />
            <Link 
              to="/login" 
              style={linkStyles}
              onMouseEnter={(e) => e.target.style.color = linkHoverStyles.color}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
