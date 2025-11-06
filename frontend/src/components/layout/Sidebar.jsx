import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, TrendingUp, Wallet, User, Settings,
  LogOut, Menu, X, BarChart3, UserCheck, Coins, AlertTriangle,
  FileText, Database, Shield, Gift
} from 'lucide-react'

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isMember, isAdmin } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  // Member Navigation
  const memberNav = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/network', label: 'Network', icon: Users },
    { path: '/earnings', label: 'Earnings', icon: TrendingUp },
    { path: '/withdrawals', label: 'Withdrawals', icon: Wallet },
    { path: '/wallets', label: 'Wallets', icon: Coins },
  ]

  // Admin Navigation
  const adminNav = [
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/members', label: 'Members', icon: UserCheck },
    { path: '/admin/promotions', label: 'Promotions', icon: Gift },
    { path: '/admin/deposits', label: 'Deposits', icon: Database },
    { path: '/admin/withdrawals', label: 'Withdrawals', icon: Wallet },
    { path: '/admin/fraud', label: 'Fraud Detection', icon: AlertTriangle },
  ]

  const navItems = isAdmin ? adminNav : memberNav

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white text-black p-2 rounded-lg"
      >
        {isCollapsed ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-black border-r border-white border-opacity-10
          transition-all duration-300 z-40 flex flex-col
          ${isCollapsed ? 'w-20' : 'w-64'}
          lg:translate-x-0 ${isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        `}
      >
        {/* Logo/Brand */}
        <div className="p-6 border-b border-white border-opacity-10">
          <Link to={isMember ? '/dashboard' : '/admin/analytics'} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-black font-bold text-xl">A</span>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-white font-display font-bold text-lg">Atlas Network</h2>
                <p className="text-gray-400 text-xs">
                  {isAdmin ? 'Admin' : 'Member'} Portal
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-white border-opacity-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{user?.username}</p>
                <p className="text-gray-400 text-xs truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link key={item.path} to={item.path}>
                  <div
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      font-medium text-sm transition-all
                      ${active
                        ? 'bg-white text-black'
                        : 'text-white hover:bg-white hover:bg-opacity-10'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white border-opacity-10 space-y-1">
          <Link to="/profile">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white hover:bg-opacity-10 transition-all">
              <User className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">Profile</span>}
            </div>
          </Link>

          <Link to="/settings">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white hover:bg-opacity-10 transition-all">
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-red-500 hover:bg-opacity-20 transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content Spacer */}
      <div className={`${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`} />
    </>
  )
}

export default Sidebar
