'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [stats, setStats] = useState({ bookings: 0, myListings: 0 })
  const [loading, setLoading] = useState(true)
  const [isNew, setIsNew] = useState(false)
  const [activeTab, setActiveTab] = useState('browse')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const createdAt = new Date(user.created_at)
    setIsNew((new Date() - createdAt) / 1000 / 60 < 5)

    const { data: prof } = await supabase
      .from('users').select('*').eq('id', user.id).single()
    setProfile(prof)

    const { data: listingData } = await supabase
      .from('listings')
      .select('*, users(full_name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(8)
    setListings(listingData || [])

    const { data: bookingData } = await supabase
      .from('bookings').select('id')
      .eq('buyer_id', user.id)
      .in('status', ['active', 'reserved'])
    const { data: listData } = await supabase
      .from('listings').select('id').eq('seller_id', user.id)

    setStats({
      bookings: bookingData?.length || 0,
      myListings: listData?.length || 0
    })
    setLoading(false)
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-400 text-sm">Loading your home...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO BANNER ── */}
      <div className="bg-black text-white px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">Syracuse University</p>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight mb-3">
              {isNew ? `Welcome, ${firstName}! 🎉` : `Welcome back, ${firstName}!`}
            </h1>
            <p className="text-gray-400 text-sm max-w-md">
              {isNew ? 'Your account is ready. Browse listings or list your first item below.' : "Here's what's trending on campus today."}
            </p>
          </div>
          <div className="hidden md:flex gap-8 text-right">
            {[
              { num: profile?.credits, label: 'Credits' },
              { num: stats.bookings, label: 'Active rentals' },
              { num: stats.myListings, label: 'My listings' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl font-black text-white">{s.num}</p>
                <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── QUICK ACTION TABS ── */}
      <div className="bg-white border-b border-gray-100 px-2 md:px-8 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-1 min-w-max md:min-w-0">
          {[
            { id: 'browse', label: '🛍️ Browse' },
            { id: 'mylistings', label: '👗 My Listings' },
            { id: 'bookings', label: '📦 My Bookings' },
            { id: 'wallet', label: '💳 Wallet' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.id ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">

        {/* BROWSE TAB */}
        {activeTab === 'browse' && (
          <div>
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">Trending on campus</h2>
              <Link href="/marketplace" className="text-sm font-semibold text-gray-400 hover:text-gray-900 underline underline-offset-2">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map(listing => (
                <Link key={listing.id} href={`/listing/${listing.id}`}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                  {listing.image_url ? (
                    <img src={listing.image_url} alt={listing.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-48 bg-gray-50 flex items-center justify-center text-5xl">👗</div>
                  )}
                  <div className="p-4">
                    <p className="font-bold text-gray-900 truncate">{listing.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 mb-2">{listing.size} · {listing.color}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-gray-900">{listing.price_per_day} <span className="text-xs font-normal text-gray-400">cr/day</span></span>
                      <span className="text-xs bg-black text-white px-3 py-1 rounded-full">Rent</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {listings.length === 0 && (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">👗</p>
                <p className="font-bold text-gray-900 mb-2">No listings yet</p>
                <p className="text-gray-400 text-sm mb-6">Be the first to list something on campus</p>
                <Link href="/create-listing" className="bg-black text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors">
                  Add a listing
                </Link>
              </div>
            )}
          </div>
        )}

        {/* MY LISTINGS TAB */}
        {activeTab === 'mylistings' && (
          <div>
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">My Listings</h2>
              <Link href="/create-listing"
                className="bg-black text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                + Add New
              </Link>
            </div>
            <Link href="/my-listings" className="bg-white rounded-2xl p-8 border border-gray-100 flex items-center justify-between hover:border-gray-300 transition-colors">
              <div>
                <p className="font-black text-gray-900 text-lg">View all your listings</p>
                <p className="text-gray-400 text-sm mt-1">Manage, edit and track your listed items</p>
              </div>
              <span className="text-2xl">→</span>
            </Link>
          </div>
        )}

        {/* MY BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div>
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">My Bookings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/my-bookings" className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all">
                <p className="text-3xl mb-3">📦</p>
                <p className="font-black text-gray-900 text-lg">Rentals I'm Borrowing</p>
                <p className="text-gray-400 text-sm mt-1">Items you've booked from others</p>
                {stats.bookings > 0 && (
                  <span className="inline-block mt-3 bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
                    {stats.bookings} active
                  </span>
                )}
              </Link>
              <Link href="/seller-bookings" className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all">
                <p className="text-3xl mb-3">📬</p>
                <p className="font-black text-gray-900 text-lg">Booking Requests</p>
                <p className="text-gray-400 text-sm mt-1">Requests from others for your items</p>
              </Link>
            </div>
          </div>
        )}

        {/* WALLET TAB */}
        {activeTab === 'wallet' && (
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-6">My Wallet</h2>
            <div className="bg-black text-white rounded-2xl p-8 mb-4" id="wallet">
              <p className="text-gray-400 text-sm mb-2">Available balance</p>
              <p className="text-6xl font-black mb-1">{profile?.credits}</p>
              <p className="text-gray-400 text-sm">credits · 1 credit = $1</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Earned from rentals', val: '—' },
                { label: 'Spent on rentals', val: '—' },
                { label: 'Starting credits', val: '1,000' },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
                  <p className="text-xl font-black text-gray-900">{item.val}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}