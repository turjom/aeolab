'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const sidebarRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    setLoggingOut(true)
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
    } finally {
      setLoggingOut(false)
    }
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const closeSidebar = () => {
    setIsOpen(false)
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
        className="hamburger-button fixed top-4 left-4 z-[60] p-2 rounded-md border border-white/10 text-white/60 hover:bg-red-900/30 hover:text-white transition-colors shadow-sm"
        style={{ background: '#111111' }}
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
          min-h-screen w-64
          border-r border-white/10
          z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
        style={{ background: '#111111' }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-white/60 hover:bg-red-900/30 hover:text-white transition-colors"
            aria-label="Toggle sidebar"
          >
            <span className="text-2xl">☰</span>
          </button>
          <h2 className="text-2xl font-bold text-red-400 whitespace-nowrap overflow-visible flex-1 text-center">AEOLab</h2>
          <div className="w-10"></div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/dashboard"
            className="block px-3 py-2 rounded-lg text-sm transition-colors"
            style={{
              color: pathname === '/dashboard' ? 'white' : 'rgba(255,255,255,0.5)',
              background: pathname === '/dashboard' ? 'rgba(153,27,27,0.3)' : 'transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'white' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = pathname === '/dashboard' ? 'white' : 'rgba(255,255,255,0.5)' }}
            onClick={handleLinkClick}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/prompts"
            className="block px-3 py-2 rounded-lg text-sm transition-colors"
            style={{
              color: pathname.startsWith('/dashboard/prompts') ? 'white' : 'rgba(255,255,255,0.5)',
              background: pathname.startsWith('/dashboard/prompts') ? 'rgba(153,27,27,0.3)' : 'transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'white' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = pathname.startsWith('/dashboard/prompts') ? 'white' : 'rgba(255,255,255,0.5)' }}
            onClick={handleLinkClick}
          >
            Tracked Prompts
          </Link>
          <Link
            href="/dashboard/settings"
            className="block px-3 py-2 rounded-lg text-sm transition-colors"
            style={{
              color: pathname.startsWith('/dashboard/settings') ? 'white' : 'rgba(255,255,255,0.5)',
              background: pathname.startsWith('/dashboard/settings') ? 'rgba(153,27,27,0.3)' : 'transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'white' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = pathname.startsWith('/dashboard/settings') ? 'white' : 'rgba(255,255,255,0.5)' }}
            onClick={handleLinkClick}
          >
            Account Settings
          </Link>
          <Link
            href="/dashboard/billing"
            className="block px-3 py-2 rounded-lg text-sm transition-colors"
            style={{
              color: pathname.startsWith('/dashboard/billing') ? 'white' : 'rgba(255,255,255,0.5)',
              background: pathname.startsWith('/dashboard/billing') ? 'rgba(153,27,27,0.3)' : 'transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'white' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = pathname.startsWith('/dashboard/billing') ? 'white' : 'rgba(255,255,255,0.5)' }}
            onClick={handleLinkClick}
          >
            Billing
          </Link>
        </nav>

        {/* Logout Button */}
        <div className="mt-auto pt-4 pb-4 px-4 border-t border-white/10">
          <Button
            variant="ghost"
            className="w-full justify-start text-white/60 hover:bg-red-900/20 hover:text-white/80"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Logging out...
              </>
            ) : (
              'Logout'
            )}
          </Button>
        </div>
      </aside>
    </>
  )
}
