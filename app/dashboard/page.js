'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">👗 EveryWear</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">👋 {profile?.full_name}</span>
          <span className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full font-medium">
            💰 {profile?.credits} credits
          </span>
          <Link href="/notifications" className="relative">
  <span className="text-xl">🔔</span>
</Link>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {/* Welcome */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-2xl font-bold mb-1">Welcome back, {profile?.full_name}! 🎉</h2>
          <p className="text-gray-500">What would you like to do today?</p>
          <div className="flex gap-2 mt-3">
            {profile?.is_buyer && <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">Buyer</span>}
            {profile?.is_seller && <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">Seller</span>}
            {profile?.is_admin && <span className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full">Admin</span>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {profile?.is_buyer && (
            <Link href="/marketplace" className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border-2 border-transparent hover:border-black">
              <div className="text-3xl mb-2">🛍️</div>
              <h3 className="font-bold text-lg">Browse Marketplace</h3>
              <p className="text-gray-500 text-sm">Find clothes to rent</p>
            </Link>
          )}
          {profile?.is_buyer && (
            <Link href="/my-bookings" className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border-2 border-transparent hover:border-black">
              <div className="text-3xl mb-2">📦</div>
              <h3 className="font-bold text-lg">My Bookings</h3>
              <p className="text-gray-500 text-sm">View your rentals</p>
            </Link>
          )}
          {profile?.is_seller && (
            <Link href="/my-listings" className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border-2 border-transparent hover:border-black">
              <div className="text-3xl mb-2">👗</div>
              <h3 className="font-bold text-lg">My Listings</h3>
              <p className="text-gray-500 text-sm">Manage your clothes</p>
            </Link>
          )}
          {profile?.is_seller && (
            <Link href="/create-listing" className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border-2 border-transparent hover:border-black">
              <div className="text-3xl mb-2">➕</div>
              <h3 className="font-bold text-lg">Add New Listing</h3>
              <p className="text-gray-500 text-sm">List a clothing item</p>
            </Link>
          )}
          
            {profile?.is_seller && (
    <Link href="/seller-bookings" className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border-2 border-transparent hover:border-black">
        <div className="text-3xl mb-2">📬</div>
        <h3 className="font-bold text-lg">Booking Requests</h3>
        <p className="text-gray-500 text-sm">Accept or reject bookings</p>
    </Link>
    )}
    {profile?.is_admin && (
  <Link href="/admin" className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border-2 border-transparent hover:border-black">
    <div className="text-3xl mb-2">🛡️</div>
    <h3 className="font-bold text-lg">Admin Panel</h3>
    <p className="text-gray-500 text-sm">Approve/reject listings</p>
  </Link>
)}
        </div>

        {/* Wallet */}
        <div className="bg-black text-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-1">💳 My Wallet</h3>
          <p className="text-4xl font-bold">{profile?.credits} <span className="text-lg font-normal text-gray-400">credits</span></p>
          <p className="text-gray-400 text-sm mt-2">1 credit = $1</p>
        </div>
      </div>
    </div>
  )
}