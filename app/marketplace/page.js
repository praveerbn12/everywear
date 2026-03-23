'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Marketplace() {
  const router = useRouter()
  const [listings, setListings] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ size: '', color: '', maxPrice: '' })

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, listings])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    getListings()
  }

  const getListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, users(full_name, id)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
  
    // Get avg rating for each seller
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
    if (filters.size) result = result.filter(l => l.size === filters.size)
    if (filters.color) result = result.filter(l => l.color.toLowerCase().includes(filters.color.toLowerCase()))
    if (filters.maxPrice) result = result.filter(l => l.price_per_day <= parseInt(filters.maxPrice))
    setFiltered(result)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold">👗 EveryWear</Link>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">← Dashboard</Link>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Browse Marketplace</h2>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex gap-4 flex-wrap">
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            value={filters.size}
            onChange={e => setFilters({...filters, size: e.target.value})}>
            <option value="">All Sizes</option>
            <option>XS</option><option>S</option><option>M</option>
            <option>L</option><option>XL</option><option>XXL</option>
          </select>

          <input
            type="text" placeholder="Filter by color..."
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            value={filters.color}
            onChange={e => setFilters({...filters, color: e.target.value})} />

          <input
            type="number" placeholder="Max price (credits)"
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            value={filters.maxPrice}
            onChange={e => setFilters({...filters, maxPrice: e.target.value})} />

          <button
            onClick={() => setFilters({ size: '', color: '', maxPrice: '' })}
            className="text-sm text-gray-500 hover:text-black underline">
            Clear filters
          </button>
        </div>

        {/* Listings Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500">No listings found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(listing => (
              <div key={listing.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
                {listing.image_url ? (
                  <img src={listing.image_url} className="w-full h-56 object-cover" />
                ) : (
                  <div className="w-full h-56 bg-gray-100 flex items-center justify-center text-5xl">👗</div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{listing.title}</h3>
                  <p className="text-gray-500 text-sm mb-2">{listing.size} • {listing.color}</p>
                  <p className="text-sm text-gray-400 mb-3">By {listing.users?.full_name}  {listing.sellerRating && (
    <span className="ml-2 text-yellow-500 font-medium">
      ⭐ {listing.sellerRating} ({listing.sellerReviewCount})
    </span>
  )}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">{listing.price_per_day} <span className="text-sm font-normal text-gray-500">credits/day</span></span>
                    <Link href={`/listing/${listing.id}`}
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition">
                      Rent Now
                    </Link>
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