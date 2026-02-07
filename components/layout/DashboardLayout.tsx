'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 lg:relative">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hamburger-button p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors lg:hidden"
              aria-label="Toggle sidebar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {sidebarOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">AEOLab</h1>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 min-h-[calc(100vh-64px)] p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
