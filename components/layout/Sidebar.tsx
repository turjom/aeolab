'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const sidebarRef = useRef<HTMLDivElement>(null)

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/prompts', label: 'Tracked Prompts' },
    { href: '/dashboard/settings', label: 'Account Settings' },
    { href: '/dashboard/billing', label: 'Billing' },
  ]

  const handleLogout = async () => {
    try {
      // Clear sessionStorage to reset trial banner dismissal
      sessionStorage.clear()
      
      // Sign out with Supabase
      await supabase.auth.signOut()
      
      // Redirect to login
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error during logout:', error)
      // Still redirect even if there's an error
      router.push('/login')
    }
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const closeSidebar = () => {
    setIsOpen(false)
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  // Close sidebar when clicking outside (mobile only - overlay handles it)
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Only handle outside clicks on mobile (desktop doesn't have overlay)
      if (window.innerWidth >= 1024) return
      
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(target) &&
        !target.closest('.hamburger-button')
      ) {
        closeSidebar()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close sidebar on mobile when navigating
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      closeSidebar()
    }
  }

  return (
    <>
      {/* Hamburger Button - Always visible */}
      <button
        onClick={toggleSidebar}
        className="hamburger-button fixed top-4 left-4 z-[60] p-2 rounded-md bg-[#1f2937] text-white hover:bg-gray-700 transition-colors"
        aria-label="Toggle sidebar"
      >
        <span className="text-2xl">☰</span>
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed
          top-0 left-0
          h-full w-64
          bg-[#1f2937] text-white
          z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-white hover:bg-gray-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <span className="text-2xl">☰</span>
          </button>
          <h2 className="text-xl font-bold whitespace-nowrap overflow-visible flex-1 text-center">AEOLab</h2>
          <div className="w-10"></div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`
                  block px-4 py-3 rounded-lg
                  transition-colors duration-200
                  ${
                    active
                      ? 'bg-gray-700 text-white font-medium'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="
              w-full px-4 py-3 rounded-lg
              bg-red-600 hover:bg-red-700
              text-white font-medium
              transition-colors duration-200
            "
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
