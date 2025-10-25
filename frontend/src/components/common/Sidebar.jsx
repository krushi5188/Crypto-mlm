import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, DollarSign, Trophy, Award,
  Shield, BarChart3, UserCheck, Network, AlertTriangle,
  Brain, Wallet, Cog, Bell, TrendingDown, Share2,
  Calendar, Target, BookOpen, Key, LogOut, User,
  Settings, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import RankBadge from '../RankBadge';

const Sidebar = () => {
  const { user, isAuthenticated, isInstructor, isMember, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items for members
  const memberNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/wallets', label: 'Wallets', icon: Wallet },
    { path: '/network', label: 'Network', icon: Users },
    { path: '/earnings', label: 'Earnings', icon: DollarSign },
    { path: '/withdrawals', label: 'Withdrawals', icon: TrendingDown },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/achievements', label: 'Achievements', icon: Trophy },
    { path: '/leaderboard', label: 'Leaderboard', icon: Award },
    { path: '/share', label: 'Share', icon: Share2 },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/resources', label: 'Resources', icon: BookOpen },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/api-keys', label: 'API Keys', icon: Key },
  ];

  // Navigation items for instructors
  const instructorNavItems = [
    { path: '/instructor/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/instructor/participants', label: 'Participants', icon: UserCheck },
    { path: '/instructor/network', label: 'Network', icon: Network },
    { path: '/instructor/referrals', label: 'Referrals', icon: Users },
    { path: '/instructor/deposits', label: 'Deposits', icon: DollarSign },
    { path: '/instructor/fraud-detection', label: 'Fraud Detection', icon: AlertTriangle },
    { path: '/instructor/bi', label: 'Business Intelligence', icon: Brain },
    { path: '/instructor/ab-testing', label: 'A/B Testing', icon: BarChart3 },
    { path: '/instructor/campaigns', label: 'Campaigns', icon: Target },
    { path: '/instructor/controls', label: 'Controls', icon: Cog },
    { path: '/instructor/configuration', label: 'Configuration', icon: Settings },
  ];

  const navItems = isMember() ? memberNavItems : isInstructor() ? instructorNavItems : [];

  // Check if route is active
  const isActive = (path) => location.pathname === path;

  if (!isAuthenticated()) {
    return null;
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-black">
      {/* Logo/Brand */}
      <div className="p-4 border-b border-white/10 bg-black">
        <Link
          to={isMember() ? '/dashboard' : '/instructor/analytics'}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-black font-bold text-xl">A</span>
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-white font-display font-bold text-lg leading-tight">
                Atlas Network
              </h2>
              <p className="text-gray-400 text-xs">MLM Platform</p>
            </div>
          )}
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/10 bg-black">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-bold flex-shrink-0">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {user?.username}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
        {isMember() && !isCollapsed && (
          <div className="mt-3">
            <RankBadge />
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-2 bg-black">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link key={item.path} to={item.path}>
                <div
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    font-medium text-sm transition-all
                    ${active
                      ? 'bg-white text-black'
                      : 'text-white hover:bg-white/10'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-white/10 space-y-1 bg-black">
        <Link to="/profile">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-white/10 transition-all">
            <User className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Profile</span>}
          </div>
        </Link>

        {isMember() && (
          <Link to="/security">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-white/10 transition-all">
              <Shield className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Security</span>}
            </div>
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>

        {/* Collapse Toggle - Desktop Only */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex w-full items-center justify-center px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="ml-2 text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-black border border-white/20 text-white"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setIsMobileOpen(false)}
            />
            <div
              className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-black border-r border-white/10 z-50 flex flex-col"
            >
              <SidebarContent />
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        style={{ width: isCollapsed ? '80px' : '280px' }}
        className="hidden md:flex fixed left-0 top-0 bottom-0 bg-black border-r border-white/10 flex-col z-40 transition-all duration-300"
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
