'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const Logo = ({ href }) => (
  <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
    <svg width="130" height="34" viewBox="0 0 180 48" fill="none">
      <path d="M24 10 C24 6 28 4 32 4 C36 4 40 6 40 10 C40 14 36 16 32 16 L32 20 L8 36 C6 37 6 40 8 40 L56 40 C58 40 58 37 56 36 L32 20"
        stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="72" y="28" fontFamily="Helvetica Neue, Arial" fontSize="20" fontWeight="800" fill="#111" letterSpacing="-0.5">EveryWear</text>
    </svg>
  </Link>
)

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Pages that should show the simple public navbar
  const publicPages = ['/', '/login', '/register']
  const isPublicPage = publicPages.includes(pathname)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase
          .from('users').select('*').eq('id', user.id).single()
        setProfile(prof)
      }
      setLoaded(true)
    }
    checkUser()
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSidebarOpen(false)
    router.push('/login')
  }

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EW'

  const navItems = [
    { section: 'Main', items: [
      { icon: '🏠', label: 'Home', href: '/home' },
      { icon: '🛍️', label: 'Browse Marketplace', href: '/marketplace' },
      { icon: '📦', label: 'My Bookings', href: '/my-bookings' },
    ]},
    { section: 'Listings', items: [
      { icon: '👗', label: 'My Listings', href: '/my-listings' },
      { icon: '➕', label: 'Add New Listing', href: '/create-listing' },
      { icon: '📬', label: 'Booking Requests', href: '/seller-bookings' },
    ]},
    { section: 'Account', items: [
      { icon: '🔔', label: 'Notifications', href: '/notifications' },
      ...(profile?.is_admin ? [{ icon: '🛡️', label: 'Admin Panel', href: '/admin' }] : []),
    ]},
  ]

  if (!loaded) return null

  // ── PUBLIC NAVBAR (landing, login, register) ──
  if (isPublicPage || !profile) {
    return (
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-20">
        <Logo href="/" />
        <div className="flex items-center gap-6">
          <Link href="/marketplace" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Browse</Link>
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Sign In</Link>
          <Link href="/register" className="bg-black text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>
    )
  }

  // ── LOGGED-IN NAVBAR with sidebar ──
  return (
    <>
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-gray-200 transition-colors">
            <span className="w-4 h-0.5 bg-gray-700 block"></span>
            <span className="w-4 h-0.5 bg-gray-700 block"></span>
            <span className="w-4 h-0.5 bg-gray-700 block"></span>
          </button>
          <Logo href="/home" />
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full">
            💰 {profile?.credits} credits
          </span>
          <Link href="/notifications" className="text-gray-400 hover:text-gray-900 transition-colors" style={{fontSize:'18px'}}>🔔</Link>
          <div
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer">
            {initials}
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white z-40 shadow-xl flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Logo href="/home" />
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-900 text-xl">✕</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white text-sm font-bold">{initials}</div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{profile?.full_name}</p>
              <p className="text-gray-400 text-xs">💰 {profile?.credits} credits</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          {navItems.map(section => (
            <div key={section.section} className="px-3 mb-4">
              <p className="text-xs font-bold text-gray-300 uppercase tracking-widest px-2 mb-2">{section.section}</p>
              {section.items.map(item => (
                <Link key={item.label} href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${pathname === item.href ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                  <span style={{fontSize:'16px'}}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-gray-100">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 font-medium hover:bg-red-50 transition-colors w-full">
            <span style={{fontSize:'16px'}}>🚪</span> Logout
          </button>
        </div>
      </div>
    </>
  )
}