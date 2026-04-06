'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const Logo = () => (
  <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
    <svg width="160" height="40" viewBox="0 0 180 48" fill="none">
      <path
        d="M24 10 C24 6 28 4 32 4 C36 4 40 6 40 10 C40 14 36 16 32 16 L32 20 L8 36 C6 37 6 40 8 40 L56 40 C58 40 58 37 56 36 L32 20"
        stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="72" y="28" fontFamily="Helvetica Neue, Arial" fontSize="20" fontWeight="800" fill="#111" letterSpacing="-0.5">EveryWear</text>
    </svg>
  </Link>
)

export default function Marketplace() {
  const [listings, setListings] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [filters, setFilters] = useState({ search: '', size: '', color: '', maxPrice: '' })

  useEffect(() => { checkUser() }, [])
  useEffect(() => { applyFilters() }, [filters, listings])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
    getListings()
  }

  const getListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, users(full_name, id)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    const listingsWithRatings = await Promise.all((data || []).map(async (listing) => {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_id', listing.users.id)

      const avg = reviews?.length
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null

      return { ...listing, sellerRating: avg, sellerReviewCount: reviews?.length || 0 }
    }))

    setListings(listingsWithRatings)
    setLoading(false)
  }

  const applyFilters = () => {
    let result = [...listings]
    if (filters.search) result = result.filter(l =>
      l.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      l.color.toLowerCase().includes(filters.search.toLowerCase())
    )
    if (filters.size) result = result.filter(l => l.size === filters.size)
    if (filters.color) result = result.filter(l => l.color.toLowerCase().includes(filters.color.toLowerCase()))
    if (filters.maxPrice) result = result.filter(l => l.price_per_day <= parseInt(filters.maxPrice))
    setFiltered(result)
  }

  const clearFilters = () => setFilters({ search: '', size: '', color: '', maxPrice: '' })
  const hasFilters = filters.search || filters.size || filters.color || filters.maxPrice

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── NAVBAR ── */}
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <Logo />
        {currentUser ? (
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            ← Dashboard
          </Link>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Sign In
            </Link>
            <Link href="/register"
              className="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Get Started
            </Link>
          </div>
        )}
      </nav>

      <div className="px-8 py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-1">Browse Marketplace</h1>
        <p className="text-gray-400 text-sm mb-6">
          {filtered.length} listing{filtered.length !== 1 ? 's' : ''} available
        </p>

        {/* ── SEARCH + FILTERS ROW ── */}
        <div className="flex gap-3 flex-wrap mb-6 items-center">

          {/* Search bar */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search listings..."
              className="border border-gray-200 bg-white rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black w-56"
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
            />
          </div>

          {/* Size */}
          <select
            className="border border-gray-200 bg-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            value={filters.size}
            onChange={e => setFilters({...filters, size: e.target.value})}>
            <option value="">All Sizes</option>
            <option>XS</option><option>S</option><option>M</option>
            <option>L</option><option>XL</option><option>XXL</option>
          </select>

          {/* Color */}
          <select
            className="border border-gray-200 bg-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            value={filters.color}
            onChange={e => setFilters({...filters, color: e.target.value})}>
            <option value="">All Colors</option>
            <option>Black</option><option>White</option><option>Red</option>
            <option>Blue</option><option>Green</option><option>Yellow</option>
            <option>Pink</option><option>Purple</option><option>Brown</option>
            <option>Grey</option><option>Orange</option><option>Multicolor</option>
          </select>

          {/* Max price */}
          <input
            type="number"
            placeholder="Max price (credits)"
            className="border border-gray-200 bg-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black w-48"
            value={filters.maxPrice}
            onChange={e => setFilters({...filters, maxPrice: e.target.value})}
          />

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-black underline underline-offset-2">
              Clear filters
            </button>
          )}
        </div>

        {/* ── GUEST BANNER ── */}
        {!currentUser && (
          <div className="bg-black text-white rounded-2xl px-6 py-5 mb-8 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm mb-0.5">Join EveryWear for free</p>
              <p className="text-gray-400 text-xs">Create an account to start renting clothes from fellow students.</p>
            </div>
            <Link href="/register"
              className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap ml-6">
              Join Free
            </Link>
          </div>
        )}

        {/* ── LISTINGS GRID ── */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-semibold text-gray-900 mb-1">No listings found</p>
            <p className="text-gray-400 text-sm mb-4">Try adjusting your search or filters</p>
            <button
              onClick={clearFilters}
              className="text-sm font-medium bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(listing => (
              <div key={listing.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                {listing.image_url ? (
                  <img src={listing.image_url} alt={listing.title} className="w-full h-56 object-cover" />
                ) : (
                  <div className="w-full h-56 bg-gray-50 flex items-center justify-center text-5xl">👗</div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 truncate">{listing.title}</h3>
                  <p className="text-gray-400 text-xs mb-1">{listing.size} · {listing.color}</p>
                  <p className="text-xs text-gray-400 mb-3">
                    By {listing.users?.full_name}
                    {listing.sellerRating && (
                      <span className="ml-1.5 text-yellow-500 font-medium">
                        ⭐ {listing.sellerRating} ({listing.sellerReviewCount})
                      </span>
                    )}
                  </p>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                    <div>
                      <span className="font-black text-lg text-gray-900">{listing.price_per_day}</span>
                      <span className="text-xs text-gray-400 ml-1">cr/day</span>
                    </div>
                    {currentUser ? (
                      <Link href={`/listing/${listing.id}`}
                        className="bg-black text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-800 transition">
                        Rent Now
                      </Link>
                    ) : (
                      <Link href="/login"
                        className="bg-black text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-800 transition">
                        Sign in
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}