'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const Logo = () => (
  <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
    <svg width="140" height="36" viewBox="0 0 180 48" fill="none">
      <path
        d="M24 10 C24 6 28 4 32 4 C36 4 40 6 40 10 C40 14 36 16 32 16 L32 20 L8 36 C6 37 6 40 8 40 L56 40 C58 40 58 37 56 36 L32 20"
        stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="72" y="28" fontFamily="Helvetica Neue, Arial" fontSize="20" fontWeight="800" fill="#111" letterSpacing="-0.5">EveryWear</text>
    </svg>
  </Link>
)

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(profile)

    // Check if account was created in the last 5 minutes
    const createdAt = new Date(user.created_at)
    const now = new Date()
    const diffMinutes = (now - createdAt) / 1000 / 60
    setIsNew(diffMinutes < 5)

    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── NAVBAR ── */}
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">👋 {profile?.full_name}</span>
          <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full font-medium">
            💰 {profile?.credits} credits
          </span>
          <Link href="/notifications" className="text-gray-400 hover:text-gray-900 transition-colors">
            🔔
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* ── WELCOME ── */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <h2 className="text-2xl font-black text-gray-900 mb-1">
            {isNew ? `Welcome to EveryWear, ${firstName}! 🎉` : `Welcome back, ${firstName}!`}
          </h2>
          <p className="text-gray-400 text-sm">
            {isNew
              ? 'Your account is ready. Browse listings or add your first item.'
              : 'What would you like to do today?'}
          </p>
          {profile?.is_admin && (
            <span className="inline-block mt-3 bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full font-semibold">
              Admin
            </span>
          )}
        </div>

        {/* ── QUICK ACTIONS ── */}
        {/* <div className="grid grid-cols-2 gap-4 mb-6"> */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Link href="/marketplace"
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all">
            <div className="text-3xl mb-3">🛍️</div>
            <h3 className="font-bold text-gray-900 text-lg">Browse Marketplace</h3>
            <p className="text-gray-400 text-sm">Find clothes to rent</p>
          </Link>

          <Link href="/my-bookings"
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all">
            <div className="text-3xl mb-3">📦</div>
            <h3 className="font-bold text-gray-900 text-lg">My Bookings</h3>
            <p className="text-gray-400 text-sm">View your rentals</p>
          </Link>

          <Link href="/my-listings"
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all">
            <div className="text-3xl mb-3">👗</div>
            <h3 className="font-bold text-gray-900 text-lg">My Listings</h3>
            <p className="text-gray-400 text-sm">Manage your clothes</p>
          </Link>

          <Link href="/create-listing"
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all">
            <div className="text-3xl mb-3">➕</div>
            <h3 className="font-bold text-gray-900 text-lg">Add New Listing</h3>
            <p className="text-gray-400 text-sm">List a clothing item</p>
          </Link>

          <Link href="/seller-bookings"
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all">
            <div className="text-3xl mb-3">📬</div>
            <h3 className="font-bold text-gray-900 text-lg">Booking Requests</h3>
            <p className="text-gray-400 text-sm">Accept or reject bookings</p>
          </Link>

          {profile?.is_admin && (
            <Link href="/admin"
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="font-bold text-gray-900 text-lg">Admin Panel</h3>
              <p className="text-gray-400 text-sm">Approve/reject listings</p>
            </Link>
          )}
        </div>

        {/* ── WALLET ── */}
        <div className="bg-black text-white rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-1">💳 My Wallet</h3>
          <p className="text-4xl font-black">
            {profile?.credits}{' '}
            <span className="text-lg font-normal text-gray-400">credits</span>
          </p>
          <p className="text-gray-500 text-sm mt-2">1 credit = $1</p>
        </div>

      </div>
    </div>
  )
}