import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';

const Navbar = () => {
  const { user, isAuthenticated, isInstructor, isStudent, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navStyles = {
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    padding: '1rem 2rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  };

  const logoStyles = {
    fontSize: '1.5rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textDecoration: 'none'
  };

  const linkStyles = {
    color: '#ffffff',
    textDecoration: 'none',
    marginLeft: '1.5rem',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'color 0.2s'
  };

  return (
    <nav style={navStyles}>
      <Link to={isStudent() ? '/dashboard' : isInstructor() ? '/instructor/analytics' : '/'} style={logoStyles}>
        Atlas Network
      </Link>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        {isAuthenticated() ? (
          <>
            {isStudent() && (
              <>
                <Link to="/dashboard" style={linkStyles}>Dashboard</Link>
                <Link to="/network" style={linkStyles}>Network</Link>
                <Link to="/earnings" style={linkStyles}>Earnings</Link>
                <Link to="/profile" style={linkStyles}>Profile</Link>
              </>
            )}

            {isInstructor() && (
              <>
                <Link to="/instructor/analytics" style={linkStyles}>Analytics</Link>
                <Link to="/instructor/participants" style={linkStyles}>Participants</Link>
                <Link to="/instructor/network" style={linkStyles}>Network</Link>
                <Link to="/instructor/controls" style={linkStyles}>Controls</Link>
              </>
            )}

            <span style={{ marginLeft: '1.5rem', fontSize: '0.9rem', color: '#a0aec0' }}>
              {user?.username}
            </span>
            <div style={{ marginLeft: '1rem' }}>
              <Button onClick={handleLogout} size="sm" variant="outline">
                Logout
              </Button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" style={linkStyles}>Login</Link>
            <div style={{ marginLeft: '1rem' }}>
              <Button onClick={() => navigate('/register')} size="sm" variant="secondary">
                Sign Up
              </Button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
