'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MyListings() {
  const router = useRouter()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getListings()
  }, [])

  const getListings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })

    setListings(data || [])
    setLoading(false)
  }

  const statusColor = (status) => {
    if (status === 'approved') return 'bg-green-100 text-green-700'
    if (status === 'rejected') return 'bg-red-100 text-red-700'
    return 'bg-yellow-100 text-yellow-700'
  }

  const statusLabel = (status) => {
    if (status === 'approved') return '✅ Approved'
    if (status === 'rejected') return '❌ Rejected'
    return '⏳ Pending Review'
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
        <Link href="/create-listing" className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition">
          + Add Listing
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">My Listings</h2>

        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-4xl mb-3">👗</p>
            <p className="text-gray-500 mb-4">No listings yet</p>
            <Link href="/create-listing" className="bg-black text-white px-6 py-2 rounded-lg text-sm hover:bg-gray-800 transition">
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {listings.map(listing => (
              <div key={listing.id} className="bg-white rounded-2xl shadow-sm p-4 flex gap-4 items-center">
                {listing.image_url ? (
                  <img src={listing.image_url} className="w-20 h-20 rounded-xl object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">👗</div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{listing.title}</h3>
                  <p className="text-gray-500 text-sm">{listing.size} • {listing.color}</p>
                  <p className="text-black font-medium">{listing.price_per_day} credits/day</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor(listing.status)}`}>
                  {statusLabel(listing.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}