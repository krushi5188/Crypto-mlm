import React from 'react'
import Sidebar from './Sidebar'

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <main className="lg:ml-64 transition-all duration-300">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
